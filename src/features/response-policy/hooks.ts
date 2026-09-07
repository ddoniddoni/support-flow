"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  policyPayload,
  type ResponsePolicy,
  type ResponsePolicyInput,
  type ResponseCalendar,
} from "./schema";
export function useResponsePolicy(profileId: string) {
  return useQuery({
    queryKey: ["response-policy", profileId],
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const db = createSupabaseBrowserClient();
      const { data: settings, error } = await db
        .from("response_settings")
        .select("policy_id,alerts_enabled")
        .single();
      if (error) throw error;
      const { data: policy, error: policyError } = await db
        .from("response_policies")
        .select("*")
        .eq("id", settings.policy_id)
        .single();
      if (policyError) throw policyError;
      return {
        policy: policy as unknown as ResponsePolicy,
        alertsEnabled: settings.alerts_enabled,
      };
    },
  });
}
export function useSchedulerHealth(profileId: string) {
  return useQuery({
    queryKey: ["response-scheduler", profileId],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await createSupabaseBrowserClient().rpc(
        "response_scheduler_health",
        {},
      );
      if (error) throw error;
      return {
        ...(data as { last_succeeded_at: string | null; processed: number }),
        checkedAt: Date.now(),
      };
    },
  });
}
export function useSaveResponsePolicy() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      expectedId,
      input,
      previousCalendar,
    }: {
      id: string;
      expectedId: string;
      input: ResponsePolicyInput;
      previousCalendar: ResponseCalendar;
    }) => {
      const payload = policyPayload(input, previousCalendar);
      const { error } = await createSupabaseBrowserClient().rpc(
        "save_response_policy",
        {
          p_id: id,
          p_expected_id: expectedId,
          p_calendar: payload.calendar,
          p_targets: payload.targets,
          p_warning: input.warningMinutes,
          p_alerts: input.alertsEnabled,
        },
      );
      if (error) throw error;
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["response-policy"] }),
  });
}
