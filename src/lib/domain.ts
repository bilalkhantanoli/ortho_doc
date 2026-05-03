import type { Json } from "@/lib/database.types";
import { findImageUrl } from "@/lib/landmark";

export type UserRole = "doctor" | "patient";
export type CaseStatus = "uploading" | "processing" | "analyzed" | "approved" | "failed";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled";
export type AnalysisStatus = "queued" | "processing" | "completed" | "partial" | "failed" | "rate_limited";
export type AppointmentType = "consultation" | "follow_up" | "check_up" | "treatment" | "emergency";

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  age: number | null;
  phone: string | null;
  avatarPath: string | null;
}

export interface PatientSummary extends Profile {
  relationshipId: string;
  relationshipStatus: "active" | "inactive";
  activeCaseCount: number;
  lastAppointmentAt: string | null;
}

export interface DoctorSummary {
  id: string;
  fullName: string;
  email: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  scheduledAt: string;
  durationMinutes: number;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  notes: string | null;
}

export interface BraceOption {
  id: string;
  code: string;
  name: string;
  description: string | null;
  defaultColorHex: string | null;
  isActive: boolean;
}

export interface BracePreference {
  id: string;
  caseId: string;
  braceOptionId: string;
  braceOptionName: string;
  colorHex: string;
  notes: string | null;
}

export interface AnalysisMetrics {
  misalignment: number | null;
  symmetry: number | null;
  crowding: number | null;
  overbite: number | null;
  confidence: number | null;
  sna: number | null;
  snb: number | null;
  anb: number | null;
}

export interface Analysis {
  id: string;
  status: AnalysisStatus;
  summary: string | null;
  notes: string | null;
  metrics: AnalysisMetrics;
  failureReason: string | null;
  completedAt: string | null;
  rawResponse: Json | null;
  resultImageUrl: string | null;
}

export interface CaseRecord {
  id: string;
  title: string;
  status: CaseStatus;
  patientId: string;
  patientName: string;
  doctorId: string | null;
  doctorName: string | null;
  imageBucket: string;
  imagePath: string;
  imageUrl: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  bracePreference: BracePreference | null;
  analysis: Analysis | null;
}

export interface DoctorDashboardData {
  stats: {
    totalPatients: number;
    activeCases: number;
    scheduledAppointments: number;
    successRate: number;
  };
  casesByMonth: Array<{ month: string; cases: number }>;
  recentPatients: PatientSummary[];
}

export interface PatientDashboardData {
  nextAppointment: Appointment | null;
  treatmentProgress: number;
  openCases: number;
}

const asMetrics = (value: Json | null | undefined): AnalysisMetrics => {
  const metrics = (value as Record<string, number | null> | null) ?? {};

  return {
    misalignment: typeof metrics.misalignment === "number" ? metrics.misalignment : null,
    symmetry: typeof metrics.symmetry === "number" ? metrics.symmetry : null,
    crowding: typeof metrics.crowding === "number" ? metrics.crowding : null,
    overbite: typeof metrics.overbite === "number" ? metrics.overbite : null,
    confidence: typeof metrics.confidence === "number" ? metrics.confidence : null,
    sna: typeof metrics.sna === "number" ? metrics.sna : null,
    snb: typeof metrics.snb === "number" ? metrics.snb : null,
    anb: typeof metrics.anb === "number" ? metrics.anb : null,
  };
};

export const formatAppointmentType = (value: AppointmentType) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");

export const mapCaseDetail = (
  row: {
    case_id: string;
    title: string;
    case_status: CaseStatus;
    patient_id: string;
    patient_name: string;
    doctor_id: string | null;
    doctor_name: string | null;
    image_bucket: string;
    image_path: string;
    uploaded_by: string;
    case_created_at: string;
    updated_at: string;
    brace_option_name: string | null;
    brace_option_code: string | null;
    brace_color_hex: string | null;
    analysis_id: string | null;
    analysis_status: AnalysisStatus | null;
    analysis_summary: string | null;
    analysis_notes: string | null;
  analysis_metrics: Json | null;
  analysis_failure_reason: string | null;
  analysis_completed_at: string | null;
  analysis_raw_response: Json | null;
  },
  signedUrl: string | null,
): CaseRecord => ({
  id: row.case_id,
  title: row.title,
  status: row.case_status,
  patientId: row.patient_id,
  patientName: row.patient_name,
  doctorId: row.doctor_id,
  doctorName: row.doctor_name,
  imageBucket: row.image_bucket,
  imagePath: row.image_path,
  imageUrl: signedUrl,
  uploadedBy: row.uploaded_by,
  createdAt: row.case_created_at,
  updatedAt: row.updated_at,
  bracePreference:
    row.brace_option_name && row.brace_option_code && row.brace_color_hex
      ? {
          id: row.case_id,
          caseId: row.case_id,
          braceOptionId: row.brace_option_code,
          braceOptionName: row.brace_option_name,
          colorHex: row.brace_color_hex,
          notes: null,
        }
      : null,
  analysis: row.analysis_id && row.analysis_status
    ? {
        id: row.analysis_id,
        status: row.analysis_status,
        summary: row.analysis_summary,
        notes: row.analysis_notes,
        metrics: asMetrics(row.analysis_metrics),
        failureReason: row.analysis_failure_reason,
        completedAt: row.analysis_completed_at,
        rawResponse: row.analysis_raw_response,
        resultImageUrl: findImageUrl(row.analysis_raw_response),
      }
    : null,
});
