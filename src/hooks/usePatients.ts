import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import {
  createPatientRelationship,
  deletePatientRelationship,
  listDoctorPatients,
  updatePatientRelationship,
} from "@/lib/supabase/services/patients";

export const usePatientsQuery = (searchTerm?: string, enabled = true) =>
  useQuery({
    queryKey: [...QUERY_KEYS.patients, searchTerm ?? ""],
    queryFn: () => listDoctorPatients(searchTerm),
    enabled,
    staleTime: 0,
  });

export const useCreatePatientMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPatientRelationship,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard("doctor") }),
      ]);
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.patients, type: "active" });
    },
  });
};

export const useUpdatePatientStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ relationshipId, relationshipStatus }: { relationshipId: string; relationshipStatus: "active" | "inactive" }) =>
      updatePatientRelationship(relationshipId, relationshipStatus),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard("doctor") }),
      ]);
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.patients, type: "active" });
    },
  });
};

export const useDeletePatientMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePatientRelationship,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.patients }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard("doctor") }),
      ]);
      await queryClient.refetchQueries({ queryKey: QUERY_KEYS.patients, type: "active" });
    },
  });
};
