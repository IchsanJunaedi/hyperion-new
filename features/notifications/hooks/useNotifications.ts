import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useNotifications(userId: string, limit = 10) {
  return useQuery({
    queryKey: ["notifications", userId, limit],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
