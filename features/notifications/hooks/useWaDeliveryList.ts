import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type WaFilter = "all" | "pending" | "sent" | "failed";

export function useWaDeliveryList(
  orgId: string,
  filter: WaFilter,
  page: number,
  pageSize = 20,
) {
  return useQuery({
    queryKey: ["wa-delivery", orgId, filter, page],
    queryFn: async () => {
      const supabase = createClient();
      let q = supabase
        .from("notifications")
        .select("*, profiles!inner(display_name)", { count: "exact" })
        .eq("organization_id", orgId)
        .not("wa_number", "is", null)
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filter !== "all") {
        q = q.eq("status", filter);
      }

      const { data, count, error } = await q;
      if (error) throw error;
      return { data: data ?? [], total: count ?? 0 };
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
