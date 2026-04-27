import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { getDashboardData } from "@/lib/supabase/services/dashboard";
import type { UserRole } from "@/lib/domain";

export const useDashboardQuery = (role: UserRole) =>
  useQuery({
    queryKey: QUERY_KEYS.dashboard(role),
    queryFn: () => getDashboardData(role),
  });
