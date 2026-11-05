import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export function useAdminSession() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  useEffect(() => {
    const db = getSupabase();
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setInitializing(false);
    });
    return () => subscription.unsubscribe();
  }, []);
  const role = useQuery({
    queryKey: ["admin-access", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data, error } = await getSupabase().rpc("has_admin_role");
      if (error) throw error;
      return data === true;
    },
    refetchInterval: 15000,
    staleTime: 0,
  });
  useEffect(() => {
    if (!session) return;
    const db = getSupabase();
    const channel = db
      .channel(`admin-role-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["admin-access"] });
        },
      )
      .subscribe();
    return () => {
      void db.removeChannel(channel);
    };
  }, [session?.user.id, queryClient]);
  useEffect(() => {
    if (!session || role.data === false) {
      queryClient.removeQueries({ queryKey: ["admin-bookings"] });
      queryClient.removeQueries({ queryKey: ["admin-stats"] });
      queryClient.removeQueries({ queryKey: ["admin-team"] });
      queryClient.removeQueries({ queryKey: ["admin-email-config"] });
      queryClient.removeQueries({ queryKey: ["admin-packages"] });
      queryClient.removeQueries({ queryKey: ["admin-fleet"] });
    }
  }, [session, role.data, queryClient]);
  return {
    session,
    initializing: initializing || Boolean(session && role.isPending),
    isAdmin: role.data === true,
    accessError: role.error,
    retryAccess: role.refetch,
  };
}
