import { supabase } from "@/lib/supabase/client";
import type { Appointment, AppointmentType, UserRole } from "@/lib/domain";

const mapAppointment = (row: any): Appointment => ({
  id: row.id,
  doctorId: row.doctor_id,
  doctorName: row.doctor?.full_name ?? "Doctor",
  patientId: row.patient_id,
  patientName: row.patient?.full_name ?? "Patient",
  scheduledAt: row.scheduled_at,
  durationMinutes: row.duration_minutes,
  appointmentType: row.appointment_type,
  status: row.status,
  notes: row.notes,
});

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

export const listAppointments = async (role: UserRole) => {
  const user = await getCurrentUser();

  const query = supabase
    .from("appointments")
    .select(
      `
        id,
        doctor_id,
        patient_id,
        scheduled_at,
        duration_minutes,
        appointment_type,
        status,
        notes,
        doctor:profiles!appointments_doctor_id_fkey(full_name),
        patient:profiles!appointments_patient_id_fkey(full_name)
      `,
    )
    .order("scheduled_at", { ascending: true });

  const { data, error } = await (role === "doctor"
    ? query.eq("doctor_id", user.id)
    : query.eq("patient_id", user.id));

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapAppointment);
};

export const createAppointment = async (input: {
  doctorId: string;
  patientId: string;
  scheduledAt: string;
  appointmentType: AppointmentType;
  notes?: string;
}) => {
  const user = await getCurrentUser();

  const { error } = await supabase.from("appointments").insert({
    doctor_id: input.doctorId,
    patient_id: input.patientId,
    scheduled_at: input.scheduledAt,
    appointment_type: input.appointmentType,
    notes: input.notes ?? null,
    created_by: user.id,
  });

  if (error) {
    throw error;
  }
};

export const updateAppointment = async (
  appointmentId: string,
  input: { scheduledAt: string; appointmentType: AppointmentType; notes?: string | null },
) => {
  const { error } = await supabase
    .from("appointments")
    .update({
      scheduled_at: input.scheduledAt,
      appointment_type: input.appointmentType,
      notes: input.notes ?? null,
    })
    .eq("id", appointmentId);

  if (error) {
    throw error;
  }
};

export const updateAppointmentStatus = async (
  appointmentId: string,
  status: "scheduled" | "completed" | "cancelled",
) => {
  const { error } = await supabase.from("appointments").update({ status }).eq("id", appointmentId);

  if (error) {
    throw error;
  }
};

export const listDoctors = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "doctor")
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((doctor) => ({
    id: doctor.id,
    fullName: doctor.full_name,
    email: doctor.email,
  }));
};
