import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import {
  createAppointment,
  getDoctorBookedSlots,
  listAppointments,
  listDoctors,
  updateAppointment,
  updateAppointmentStatus,
} from "@/lib/supabase/services/appointments";
import { APPOINTMENT_TIME_SLOTS } from "@/lib/constants";
import type { AppointmentType, UserRole } from "@/lib/domain";
import { format } from "date-fns";

export const useAppointmentsQuery = (role: UserRole) =>
  useQuery({
    queryKey: QUERY_KEYS.appointments(role),
    queryFn: () => listAppointments(role),
  });

export const useDoctorsQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.doctors,
    queryFn: listDoctors,
  });

export const useDoctorAvailabilityQuery = (doctorId?: string, date?: Date) =>
  useQuery({
    queryKey: ["doctor-availability", doctorId ?? "", date ? format(date, "yyyy-MM-dd") : ""],
    queryFn: async () => {
      if (!doctorId || !date) {
        return { bookedSlots: [] as string[], availableSlots: APPOINTMENT_TIME_SLOTS as readonly string[] };
      }

      const bookedSlots = await getDoctorBookedSlots(doctorId, format(date, "yyyy-MM-dd"));
      const availableSlots = APPOINTMENT_TIME_SLOTS.filter((slot) => !bookedSlots.includes(slot));

      return { bookedSlots, availableSlots };
    },
    enabled: Boolean(doctorId && date),
  });

export const useCreateAppointmentMutation = (role: UserRole) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAppointment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments(role) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments(role === "doctor" ? "patient" : "doctor") }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard(role) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard(role === "doctor" ? "patient" : "doctor") }),
      ]);
    },
  });
};

export const useUpdateAppointmentMutation = (role: UserRole) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, scheduledAt, appointmentType, notes }: { appointmentId: string; scheduledAt: string; appointmentType: AppointmentType; notes?: string | null }) =>
      updateAppointment(appointmentId, { scheduledAt, appointmentType, notes }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments(role) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments(role === "doctor" ? "patient" : "doctor") }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard(role) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard(role === "doctor" ? "patient" : "doctor") }),
      ]);
    },
  });
};

export const useUpdateAppointmentStatusMutation = (role: UserRole) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: string; status: "scheduled" | "completed" | "cancelled" }) =>
      updateAppointmentStatus(appointmentId, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments(role) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.appointments(role === "doctor" ? "patient" : "doctor") }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard(role) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard(role === "doctor" ? "patient" : "doctor") }),
      ]);
    },
  });
};
