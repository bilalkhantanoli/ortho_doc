import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import type { DenoRuntime } from "../_shared/deno-runtime.ts";

declare const Deno: DenoRuntime;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(supabaseUrl, serviceRoleKey);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header." }, 401);
    }

    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const { data: doctorProfile } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (!doctorProfile || doctorProfile.role !== "doctor") {
      return jsonResponse({ error: "Only doctors can add patients." }, 403);
    }

    const { email, fullName, age, phone } = await request.json();
    if (!email || !fullName) {
      return jsonResponse({ error: "email and fullName are required." }, 400);
    }

    let { data: patientProfile } = await admin
      .from("profiles")
      .select("id, role")
      .eq("email", email)
      .maybeSingle();

    if (!patientProfile) {
      const { data: invitedUser, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
          role: "patient",
        },
      });

      if (inviteError || !invitedUser.user) {
        return jsonResponse({ error: inviteError?.message ?? "Unable to invite patient user." }, 500);
      }

      await admin.from("profiles").upsert({
        id: invitedUser.user.id,
        email,
        full_name: fullName,
        role: "patient",
        age: age ?? null,
        phone: phone ?? null,
      });

      patientProfile = { id: invitedUser.user.id, role: "patient" };
    } else if (patientProfile.role !== "patient") {
      return jsonResponse({ error: "The selected email belongs to a doctor account." }, 400);
    } else {
      await admin.from("profiles").update({
        full_name: fullName,
        age: age ?? null,
        phone: phone ?? null,
      }).eq("id", patientProfile.id);
    }

    const { error: linkError } = await admin.from("doctor_patient_links").upsert(
      {
        doctor_id: user.id,
        patient_id: patientProfile.id,
        relationship_status: "active",
      },
      { onConflict: "doctor_id,patient_id" },
    );

    if (linkError) {
      return jsonResponse({ error: linkError.message }, 500);
    }

    return jsonResponse({ ok: true, patientId: patientProfile.id });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unexpected error." }, 500);
  }
});
