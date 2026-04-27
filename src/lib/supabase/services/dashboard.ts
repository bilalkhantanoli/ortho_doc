import type {
  Appointment,
  DoctorDashboardData,
  PatientDashboardData,
  UserRole,
} from "@/lib/domain";
import { listAppointments } from "@/lib/supabase/services/appointments";
import { listCases } from "@/lib/supabase/services/cases";
import { listDoctorPatients } from "@/lib/supabase/services/patients";

const toMonthLabel = (dateIso: string) =>
  new Date(dateIso).toLocaleDateString("en-US", { month: "short" });

export const getDashboardData = async (role: UserRole) => {
  if (role === "doctor") {
    const [patients, cases, appointments] = await Promise.all([
      listDoctorPatients(),
      listCases("doctor"),
      listAppointments("doctor"),
    ]);

    const casesByMonthMap = new Map<string, number>();
    cases
      .slice()
      .reverse()
      .forEach((item) => {
        const label = toMonthLabel(item.createdAt);
        casesByMonthMap.set(label, (casesByMonthMap.get(label) ?? 0) + 1);
      });

    const approvedOrAnalyzed = cases.filter((item) =>
      item.status === "approved" || item.status === "analyzed",
    );
    const successRate = approvedOrAnalyzed.length
      ? Math.round(
          (cases.filter((item) => item.status === "approved").length / approvedOrAnalyzed.length) * 100,
        )
      : 0;

    return {
      stats: {
        totalPatients: patients.length,
        activeCases: cases.filter((item) => item.status !== "approved").length,
        scheduledAppointments: appointments.filter((item) => item.status === "scheduled").length,
        successRate,
      },
      casesByMonth: Array.from(casesByMonthMap.entries()).map(([month, count]) => ({
        month,
        cases: count,
      })),
      recentPatients: patients.slice(0, 4),
    } satisfies DoctorDashboardData;
  }

  const [appointments, cases] = await Promise.all([listAppointments("patient"), listCases("patient")]);
  const nextAppointment =
    appointments.find((item) => item.status === "scheduled" && new Date(item.scheduledAt) >= new Date()) ??
    null;

  const approvedCases = cases.filter((item) => item.status === "approved").length;
  const finishedCases = cases.filter((item) => item.status === "approved" || item.status === "analyzed").length;

  return {
    nextAppointment,
    treatmentProgress: finishedCases ? Math.round((approvedCases / finishedCases) * 100) : 0,
    openCases: cases.filter((item) => item.status !== "approved").length,
  } satisfies PatientDashboardData;
};

export const getAvailableTimeSlots = (appointments: Appointment[], date: Date) => {
  const targetDay = date.toISOString().slice(0, 10);
  return appointments.filter((appointment) => appointment.scheduledAt.startsWith(targetDay));
};
