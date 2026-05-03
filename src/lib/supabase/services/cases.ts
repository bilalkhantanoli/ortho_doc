import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, STORAGE_BUCKETS } from "@/lib/constants";
import { mapCaseDetail, type CaseRecord, type UserRole } from "@/lib/domain";
import { supabase } from "@/lib/supabase/client";
import { analyzeLandmarkXray } from "@/lib/gradio";
import { buildCaseImagePath, createSignedImageUrl, removeStoredImage } from "@/lib/supabase/storage";

const validateImage = (file: File) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Only JPG, PNG, or WEBP images are allowed.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image must be 10MB or smaller.");
  }
};

const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Not authenticated");
  }

  return user;
};

const hydrateCaseUrls = async (rows: any[]) => {
  const paths = rows.map((row) => row.image_path);
  const urlMap = new Map<string, string | null>();

  if (paths.length) {
    const { data } = await supabase.storage
      .from(STORAGE_BUCKETS.caseImages)
      .createSignedUrls(paths, 60 * 60);

    (data ?? []).forEach((item) => {
      urlMap.set(item.path, item.signedUrl ?? null);
    });
  }

  return rows.map((row) => mapCaseDetail(row, urlMap.get(row.image_path) ?? null));
};

export const listCases = async (role: UserRole) => {
  const user = await getCurrentUser();

  const baseQuery = supabase
    .from("case_details")
    .select("*")
    .order("case_created_at", { ascending: false });

  const { data, error } = await (role === "doctor"
    ? baseQuery.eq("doctor_id", user.id)
    : baseQuery.eq("patient_id", user.id));

  if (error) {
    throw error;
  }

  return hydrateCaseUrls(data ?? []);
};

export const getCaseById = async (caseId: string): Promise<CaseRecord> => {
  const { data, error } = await supabase.from("case_details").select("*").eq("case_id", caseId).single();

  if (error) {
    throw error;
  }

  const signedUrl = await createSignedImageUrl(data.image_path);
  return mapCaseDetail(data, signedUrl);
};

export const createCaseAndAnalyze = async (input: {
  file: File;
  title: string;
  patientId: string;
  doctorId: string | null;
}) => {
  validateImage(input.file);
  const user = await getCurrentUser();
  const imagePath = buildCaseImagePath(user.id, input.file.name);
  let createdCaseId: string | null = null;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.caseImages)
    .upload(imagePath, input.file, {
      cacheControl: "3600",
      upsert: false,
      contentType: input.file.type,
    });

  if (uploadError) {
    throw uploadError;
  }

  try {
    const { data, error } = await supabase
      .from("case_records")
      .insert({
        doctor_id: input.doctorId,
        patient_id: input.patientId,
        uploaded_by: user.id,
        title: input.title,
        image_bucket: STORAGE_BUCKETS.caseImages,
        image_path: imagePath,
        original_filename: input.file.name,
        mime_type: input.file.type,
        size_bytes: input.file.size,
        status: "processing",
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    createdCaseId = data.id;

    const landmarkResult = await analyzeLandmarkXray(input.file);
    const analysisSummary =
      landmarkResult.diagnosis ?? (landmarkResult.rawText || "Landmark analysis completed");

    const { data: analysisRun, error: analysisInsertError } = await supabase
      .from("analysis_runs")
      .insert({
        case_id: data.id,
        requested_by: user.id,
        status: "completed",
        provider: "gradio",
        model_name: "predict_landmarks",
        summary: analysisSummary,
        notes: landmarkResult.rawText,
        metrics: {
          sna: landmarkResult.metrics.sna,
          snb: landmarkResult.metrics.snb,
          anb: landmarkResult.metrics.anb,
        },
        raw_response: landmarkResult.rawResponse as any,
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (analysisInsertError) {
      throw analysisInsertError;
    }

    const { error: caseUpdateError } = await supabase
      .from("case_records")
      .update({
        status: "analyzed",
        latest_analysis_id: analysisRun.id,
      })
      .eq("id", data.id);

    if (caseUpdateError) {
      throw caseUpdateError;
    }

    return data.id;
  } catch (error) {
    if (!createdCaseId) {
      await removeStoredImage(imagePath).catch(() => undefined);
    }
    throw error;
  }
};

export const approveCase = async (caseId: string) => {
  const { error } = await supabase.from("case_records").update({ status: "approved" }).eq("id", caseId);

  if (error) {
    throw error;
  }
};

export const deleteCase = async (caseId: string, imagePath: string) => {
  await removeStoredImage(imagePath).catch(() => undefined);

  const { error } = await supabase.from("case_records").delete().eq("id", caseId);

  if (error) {
    throw error;
  }
};
