import { format } from "date-fns";
import type { Appointment, CaseRecord, DoctorSummary } from "@/lib/domain";
import { APPOINTMENT_TIME_SLOTS } from "@/lib/constants";

export interface DoctorCard {
  id: string;
  fullName: string;
  careFocus: string;
  careSummary: string;
  patientCount: number;
  recentVisitLabel: string;
  reviewLabel: string;
  recommendationLabel: string;
}

export interface MedicalHistoryItem {
  id: string;
  label: string;
  detail: string;
  date: string;
  tone: "success" | "primary" | "secondary" | "muted";
}

export interface ReportRow {
  id: string;
  title: string;
  type: string;
  date: string;
  doctor: string;
  summary: string;
  source: "xray" | "lab";
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  variant: "success" | "warning" | "info";
  timestamp: string;
}

const conditionRules = [
  {
    label: "Braces follow-up",
    keywords: ["brace", "braces", "aligner", "retainer", "follow-up", "follow up"],
  },
  {
    label: "Jaw pain care",
    keywords: ["jaw", "tmj", "pain", "bite"],
  },
  {
    label: "Growth monitoring",
    keywords: ["pediatric", "child", "growth"],
  },
  {
    label: "Retention review",
    keywords: ["retain", "retainer", "post-treatment"],
  },
];

const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");

const getCaseText = (caseItem: CaseRecord) =>
  normalizeText([caseItem.title, caseItem.analysis?.summary ?? "", caseItem.analysis?.notes ?? ""].join(" "));

const inferCareFocus = (cases: CaseRecord[]) => {
  const combined = normalizeText(
    cases
      .slice(0, 5)
      .flatMap((item) => [item.title, item.analysis?.summary ?? "", item.analysis?.notes ?? ""])
      .join(" "),
  );

  const match = conditionRules.find((rule) => rule.keywords.some((keyword) => combined.includes(keyword)));
  return match?.label ?? "General orthodontic care";
};

const buildCareSummary = (cases: CaseRecord[], appointments: Appointment[]) => {
  const caseCount = cases.length;
  const appointmentCount = appointments.length;
  const latestCase = cases[0];

  const latestSignal =
    latestCase?.analysis?.summary ??
    latestCase?.analysis?.notes ??
    latestCase?.title ??
    "Care history available";

  return `${caseCount} case${caseCount === 1 ? "" : "s"} and ${appointmentCount} appointment${appointmentCount === 1 ? "" : "s"} on file. ${latestSignal}`;
};

const buildRecentVisitLabel = (appointments: Appointment[], doctorId: string) => {
  const visits = appointments.filter((appointment) => appointment.doctorId === doctorId);
  if (!visits.length) {
    return "No visits yet";
  }

  const latestVisit = visits[0];
  return `Last visit: ${new Date(latestVisit.scheduledAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
};

const buildReviewLabel = (cases: CaseRecord[]) => {
  const latestCase = cases[0];
  if (!latestCase) {
    return "No patient feedback recorded";
  }

  return latestCase.analysis?.notes ?? latestCase.analysis?.summary ?? "Clinical notes available";
};

const buildRecommendationLabel = (careFocus: string) => {
  if (careFocus === "Braces follow-up") {
    return "Best for braces follow-up";
  }

  if (careFocus === "Jaw pain care") {
    return "Best for jaw pain";
  }

  if (careFocus === "Retention review") {
    return "Best for retention review";
  }

  if (careFocus === "Growth monitoring") {
    return "Best for growth checks";
  }

  return "Best continuity match";
};

export const buildDoctorCards = (
  doctors: DoctorSummary[],
  cases: CaseRecord[],
  appointments: Appointment[],
): DoctorCard[] => {
  const patientAppointmentsByDoctor = new Map<string, Appointment[]>();
  appointments.forEach((appointment) => {
    const existing = patientAppointmentsByDoctor.get(appointment.doctorId) ?? [];
    patientAppointmentsByDoctor.set(appointment.doctorId, [appointment, ...existing]);
  });

  return doctors.map((doctor) => {
    const doctorCases = cases.filter((caseItem) => caseItem.doctorId === doctor.id);
    const doctorAppointments = patientAppointmentsByDoctor.get(doctor.id) ?? [];
    const careFocus = inferCareFocus(doctorCases.length ? doctorCases : cases);

    return {
      id: doctor.id,
      fullName: doctor.fullName,
      careFocus,
      careSummary: buildCareSummary(doctorCases.length ? doctorCases : cases, doctorAppointments),
      patientCount: doctorAppointments.length,
      recentVisitLabel: buildRecentVisitLabel(doctorAppointments, doctor.id),
      reviewLabel: buildReviewLabel(doctorCases.length ? doctorCases : cases),
      recommendationLabel: buildRecommendationLabel(careFocus),
    };
  });
};

export const buildMedicalHistory = (
  cases: CaseRecord[],
  appointments: Appointment[],
): MedicalHistoryItem[] => {
  const latestCases = cases.slice(0, 5);
  const latestAppointments = appointments.slice(0, 3);

  const treatmentItems = latestCases.map((caseItem, index) => ({
    id: `treatment-${caseItem.id}`,
    label: caseItem.bracePreference?.braceOptionName ?? caseItem.title,
    detail:
      caseItem.analysis?.summary ??
      caseItem.analysis?.notes ??
      "Treatment monitored through case review.",
    date: caseItem.updatedAt,
    tone: index === 0 ? "success" : "primary",
  })) satisfies MedicalHistoryItem[];

  const diagnosisItems = latestCases.map((caseItem, index) => ({
    id: `diagnosis-${caseItem.id}`,
    label: caseItem.analysis?.summary ?? caseItem.title,
    detail: caseItem.analysis?.notes ?? "Diagnosis captured during care review.",
    date: caseItem.createdAt,
    tone: index === 0 ? "secondary" : "muted",
  })) satisfies MedicalHistoryItem[];

  const appointmentItems = latestAppointments.map((appointment) => ({
    id: `appointment-${appointment.id}`,
    label: appointment.doctorName,
    detail: `${appointment.appointmentType.replace("_", " ")} appointment`,
    date: appointment.scheduledAt,
    tone: appointment.status === "completed" ? "success" : "primary",
  })) satisfies MedicalHistoryItem[];

  return [...treatmentItems, ...diagnosisItems, ...appointmentItems].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
};

export const buildReportRows = (cases: CaseRecord[]): ReportRow[] =>
  cases.map((caseItem) => {
    const reportText = normalizeText(
      [caseItem.title, caseItem.analysis?.summary ?? "", caseItem.analysis?.notes ?? ""].join(" "),
    );
    const isLabReport = reportText.includes("lab") || reportText.includes("blood") || reportText.includes("test");

    return {
      id: caseItem.id,
      title: caseItem.title,
      type: isLabReport ? "Lab Report" : "X-ray / Scan",
      date: caseItem.createdAt,
      doctor: caseItem.doctorName ?? "Assigned doctor",
      summary:
        caseItem.analysis?.summary ??
        caseItem.analysis?.notes ??
        "Structured report available for review and sharing.",
      source: isLabReport ? ("lab" as const) : ("xray" as const),
    };
  });

export const buildNotificationItems = (appointments: Appointment[]): NotificationItem[] => {
  const now = new Date();

  const reminders = appointments.flatMap((appointment) => {
    const scheduled = new Date(appointment.scheduledAt);
    const diffHours = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (appointment.status === "scheduled" && diffHours <= 24 && diffHours >= 0) {
      return [
        {
          id: appointment.id,
          title: "Appointment Reminder",
          detail: `${appointment.doctorName} at ${format(scheduled, "p")}`,
          variant: "info" as const,
          timestamp: appointment.scheduledAt,
        },
      ];
    }

    return [];
  });

  const missed = appointments.flatMap((appointment) => {
    const scheduled = new Date(appointment.scheduledAt);
    const isMissed = appointment.status === "scheduled" && scheduled.getTime() < now.getTime() - 15 * 60 * 1000;

    if (!isMissed) {
      return [];
    }

    return [
      {
        id: `missed-${appointment.id}`,
        title: "Missed Appointment",
        detail: `${appointment.doctorName} on ${format(scheduled, "PPP p")}`,
        variant: "warning" as const,
        timestamp: appointment.scheduledAt,
      },
    ];
  });

  return [...reminders, ...missed].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
};

export const getSlotDisplayLabel = (slot: string) =>
  format(new Date(`2000-01-01T${slot}:00`), "h:mm a");

export const filterAvailableSlots = (bookedSlots: string[]) =>
  APPOINTMENT_TIME_SLOTS.filter((slot) => !bookedSlots.includes(slot));

export const getCaseConditionLabel = (cases: CaseRecord[]) => inferCareFocus(cases);

export const getCaseTextForDoctor = (caseItem: CaseRecord) => getCaseText(caseItem);
