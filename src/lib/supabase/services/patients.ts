import { supabase } from "@/lib/supabase/client";
import type { PatientSummary } from "@/lib/domain";

const getCurrentDoctorId = async () => {
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

  return user.id;
};

export const listDoctorPatients = async (searchTerm?: string) => {
  const doctorId = await getCurrentDoctorId();
  const { data, error } = await supabase
    .from("doctor_patient_links")
    .select(
      `
        id,
        patient_id,
        relationship_status,
        patient:profiles!doctor_patient_links_patient_id_fkey (
          id,
          email,
          full_name,
          age,
          phone,
          avatar_path
        )
      `,
    )
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const patientIds = (data ?? []).map((row) => row.patient_id);
  const [appointmentsResult, casesResult] = await Promise.all([
    patientIds.length
      ? supabase
          .from("appointments")
          .select("patient_id, scheduled_at")
          .eq("doctor_id", doctorId)
          .in("patient_id", patientIds)
          .order("scheduled_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    patientIds.length
      ? supabase
          .from("case_records")
          .select("patient_id, status")
          .eq("doctor_id", doctorId)
          .in("patient_id", patientIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (appointmentsResult.error) {
    throw appointmentsResult.error;
  }

  if (casesResult.error) {
    throw casesResult.error;
  }

  const lastAppointmentByPatient = new Map<string, string>();
  (appointmentsResult.data ?? []).forEach((item) => {
    if (!lastAppointmentByPatient.has(item.patient_id)) {
      lastAppointmentByPatient.set(item.patient_id, item.scheduled_at);
    }
  });

  const caseCountByPatient = new Map<string, number>();
  (casesResult.data ?? []).forEach((item) => {
    caseCountByPatient.set(item.patient_id, (caseCountByPatient.get(item.patient_id) ?? 0) + 1);
  });

  const mapped = (data ?? []).flatMap((row): PatientSummary[] => {
    if (!row.patient) {
      return [];
    }

    return [
      {
        id: row.patient.id,
        email: row.patient.email,
        fullName: row.patient.full_name,
        role: "patient",
        age: row.patient.age,
        phone: row.patient.phone,
        avatarPath: row.patient.avatar_path,
        relationshipId: row.id,
        relationshipStatus: row.relationship_status,
        activeCaseCount: caseCountByPatient.get(row.patient.id) ?? 0,
        lastAppointmentAt: lastAppointmentByPatient.get(row.patient.id) ?? null,
      },
    ];
  });

  if (!searchTerm) {
    return mapped;
  }

  const term = searchTerm.toLowerCase();
  return mapped.filter(
    (patient) =>
      patient.fullName.toLowerCase().includes(term) || patient.email.toLowerCase().includes(term),
  );
};

export const createPatientRelationship = async (input: {
  email: string;
  fullName: string;
  age: number | null;
  phone: string | null;
}) => {
  const { data, error } = await supabase.functions.invoke("upsert-patient-link", {
    body: input,
  });

  if (error) {
    throw error;
  }

  return data;
};

export const updatePatientRelationship = async (
  relationshipId: string,
  relationshipStatus: "active" | "inactive",
) => {
  const { error } = await supabase
    .from("doctor_patient_links")
    .update({ relationship_status: relationshipStatus })
    .eq("id", relationshipId);

  if (error) {
    throw error;
  }
};

export const deletePatientRelationship = async (relationshipId: string) => {
  const { error } = await supabase.from("doctor_patient_links").delete().eq("id", relationshipId);

  if (error) {
    throw error;
  }
};
