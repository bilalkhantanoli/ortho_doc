import { supabase } from "@/lib/supabase/client";
import type { BraceOption, BracePreference } from "@/lib/domain";

export const listBraceOptions = async (): Promise<BraceOption[]> => {
  const { data, error } = await supabase
    .from("brace_options")
    .select("id, code, name, description, default_color_hex, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    defaultColorHex: row.default_color_hex,
    isActive: row.is_active,
  }));
};

export const getBracePreference = async (caseId: string): Promise<BracePreference | null> => {
  const { data, error } = await supabase
    .from("brace_preferences")
    .select(
      `
        id,
        case_id,
        color_hex,
        notes,
        brace_option_id,
        brace_option:brace_options(name)
      `,
    )
    .eq("case_id", caseId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    caseId: data.case_id,
    braceOptionId: data.brace_option_id,
    braceOptionName: (data.brace_option as { name: string } | null)?.name ?? "Brace",
    colorHex: data.color_hex,
    notes: data.notes,
  };
};

export const upsertBracePreference = async (input: {
  caseId: string;
  patientId: string;
  braceOptionId: string;
  colorHex: string;
  notes?: string | null;
}) => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase.from("brace_preferences").upsert(
    {
      case_id: input.caseId,
      patient_id: input.patientId,
      brace_option_id: input.braceOptionId,
      color_hex: input.colorHex,
      notes: input.notes ?? null,
      selected_by: user.id,
    },
    { onConflict: "case_id" },
  );

  if (error) {
    throw error;
  }
};

export const deleteBracePreference = async (caseId: string) => {
  const { error } = await supabase.from("brace_preferences").delete().eq("case_id", caseId);

  if (error) {
    throw error;
  }
};
