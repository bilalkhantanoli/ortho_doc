import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { approveCase, createCaseAndAnalyze, deleteCase, getCaseById, listCases } from "@/lib/supabase/services/cases";
import type { UserRole } from "@/lib/domain";

export const useCasesQuery = (role: UserRole) =>
  useQuery({
    queryKey: QUERY_KEYS.cases(role),
    queryFn: () => listCases(role),
  });

export const useCaseDetailQuery = (caseId?: string) =>
  useQuery({
    queryKey: QUERY_KEYS.caseDetail(caseId ?? ""),
    queryFn: () => getCaseById(caseId!),
    enabled: Boolean(caseId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) {
        return false;
      }

      return data.status === "processing" ? 5000 : false;
    },
  });

export const useCreateCaseMutation = (role: UserRole) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCaseAndAnalyze,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cases(role) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cases(role === "doctor" ? "patient" : "doctor") }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard(role) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard(role === "doctor" ? "patient" : "doctor") }),
      ]);
    },
  });
};

export const useApproveCaseMutation = (role: UserRole) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveCase,
    onSuccess: async (_, caseId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.caseDetail(caseId) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cases(role) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cases(role === "doctor" ? "patient" : "doctor") }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard(role) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard(role === "doctor" ? "patient" : "doctor") }),
      ]);
    },
  });
};

export const useDeleteCaseMutation = (role: UserRole) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, imagePath }: { caseId: string; imagePath: string }) => deleteCase(caseId, imagePath),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cases(role) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cases(role === "doctor" ? "patient" : "doctor") }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard(role) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard(role === "doctor" ? "patient" : "doctor") }),
      ]);
    },
  });
};
