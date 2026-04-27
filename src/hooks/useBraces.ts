import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { deleteBracePreference, getBracePreference, listBraceOptions, upsertBracePreference } from "@/lib/supabase/services/braces";

export const useBraceOptionsQuery = () =>
  useQuery({
    queryKey: QUERY_KEYS.braceOptions,
    queryFn: listBraceOptions,
  });

export const useBracePreferenceQuery = (caseId?: string) =>
  useQuery({
    queryKey: QUERY_KEYS.bracePreference(caseId ?? ""),
    queryFn: () => getBracePreference(caseId!),
    enabled: Boolean(caseId),
  });

export const useSaveBracePreferenceMutation = (caseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertBracePreference,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bracePreference(caseId) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.caseDetail(caseId) }),
      ]);
    },
  });
};

export const useDeleteBracePreferenceMutation = (caseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteBracePreference(caseId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bracePreference(caseId) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.caseDetail(caseId) }),
      ]);
    },
  });
};
