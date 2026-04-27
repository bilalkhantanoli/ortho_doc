import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import type { DenoRuntime } from "../_shared/deno-runtime.ts";

declare const Deno: DenoRuntime;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const customModelUrl = Deno.env.get("CUSTOM_MODEL_URL") ?? "";
const customModelApiKey = Deno.env.get("CUSTOM_MODEL_API_KEY") ?? "";

const supabase = createClient(supabaseUrl, serviceRoleKey);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const markCaseFailed = async (caseId: string, analysisId: string, message: string, status = "failed") => {
  await supabase.from("analysis_runs").update({
    status,
    failure_reason: message,
    completed_at: new Date().toISOString(),
  }).eq("id", analysisId);

  await supabase.from("case_records").update({
    status: "failed",
    error_message: message,
    latest_analysis_id: analysisId,
  }).eq("id", caseId);
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!customModelUrl) {
      return jsonResponse({ error: "CUSTOM_MODEL_URL is not configured." }, 500);
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header." }, 401);
    }

    const client = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const { caseId } = await request.json();
    if (!caseId) {
      return jsonResponse({ error: "caseId is required." }, 400);
    }

    const { data: caseRecord, error: caseError } = await supabase
      .from("case_records")
      .select("id, image_bucket, image_path, patient_id, doctor_id, uploaded_by, latest_analysis_id")
      .eq("id", caseId)
      .single();

    if (caseError || !caseRecord) {
      return jsonResponse({ error: "Case not found." }, 404);
    }

    const authorized =
      caseRecord.patient_id === user.id ||
      caseRecord.uploaded_by === user.id ||
      caseRecord.doctor_id === user.id;

    if (!authorized) {
      const { data: link } = await supabase
        .from("doctor_patient_links")
        .select("id")
        .eq("doctor_id", user.id)
        .eq("patient_id", caseRecord.patient_id)
        .eq("relationship_status", "active")
        .maybeSingle();

      if (!link) {
        return jsonResponse({ error: "Forbidden." }, 403);
      }
    }

    const { data: analysisRun, error: analysisInsertError } = await supabase
      .from("analysis_runs")
      .insert({
        case_id: caseId,
        requested_by: user.id,
        status: "processing",
        provider: "custom-model",
        model_name: customModelUrl,
      })
      .select("id")
      .single();

    if (analysisInsertError || !analysisRun) {
      return jsonResponse({ error: analysisInsertError?.message ?? "Unable to create analysis run." }, 500);
    }

    await supabase.from("case_records").update({
      status: "processing",
      error_message: null,
      latest_analysis_id: analysisRun.id,
    }).eq("id", caseId);

    const { data: imageFile, error: downloadError } = await supabase.storage
      .from(caseRecord.image_bucket)
      .download(caseRecord.image_path);

    if (downloadError || !imageFile) {
      await markCaseFailed(caseId, analysisRun.id, downloadError?.message ?? "Unable to download image.");
      return jsonResponse({ error: "Unable to download image." }, 500);
    }

    const bytes = new Uint8Array(await imageFile.arrayBuffer());
    const mimeType = imageFile.type || "image/jpeg";
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    const base64 = btoa(binary);
    const imageDataUrl = `data:${mimeType};base64,${base64}`;

    const aiResponse = await fetch(customModelUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(customModelApiKey ? { Authorization: `Bearer ${customModelApiKey}` } : {}),
      },
      body: JSON.stringify({
        image_url: imageDataUrl,
        case_id: caseId,
        patient_id: caseRecord.patient_id,
      }),
    });

    if (aiResponse.status === 429) {
      await markCaseFailed(caseId, analysisRun.id, "The AI provider rate-limited the request.", "rate_limited");
      return jsonResponse({ error: "Rate limited by AI provider." }, 429);
    }

    if (!aiResponse.ok) {
      const message = await aiResponse.text();
      await markCaseFailed(caseId, analysisRun.id, message || "AI provider request failed.");
      return jsonResponse({ error: "AI provider request failed." }, 502);
    }

    const aiPayload = await aiResponse.json();
    const parsed = aiPayload;
    const { data: braceOption } = await supabase
      .from("brace_options")
      .select("id")
      .eq("code", parsed.recommended_brace_code)
      .maybeSingle();

    const finalStatus = parsed.partial_response ? "partial" : "completed";
    const caseStatus = "analyzed";

    await supabase.from("analysis_runs").update({
      status: finalStatus,
      summary: parsed.summary ?? null,
      notes: parsed.notes ?? null,
      metrics: {
        misalignment: parsed.misalignment ?? null,
        symmetry: parsed.symmetry ?? null,
        crowding: parsed.crowding ?? null,
        overbite: parsed.overbite ?? null,
        confidence: parsed.confidence ?? null,
      },
      raw_response: aiPayload,
      recommended_brace_option_id: braceOption?.id ?? null,
      completed_at: new Date().toISOString(),
    }).eq("id", analysisRun.id);

    await supabase.from("case_records").update({
      status: caseStatus,
      latest_analysis_id: analysisRun.id,
      error_message: parsed.partial_response ? "Partial AI response stored." : null,
    }).eq("id", caseId);

    if (braceOption?.id) {
      await supabase.from("brace_preferences").upsert(
        {
          case_id: caseId,
          patient_id: caseRecord.patient_id,
          selected_by: user.id,
          brace_option_id: braceOption.id,
          color_hex: "#3B82F6",
          notes: parsed.notes,
        },
        { onConflict: "case_id" },
      );
    }

    return jsonResponse({ caseId, analysisId: analysisRun.id, status: finalStatus });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unexpected error." }, 500);
  }
});
