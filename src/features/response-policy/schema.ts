import { z } from "zod";
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
export const responsePolicySchema = z
  .object({
    mode: z.enum(["calendar", "business"]),
    timeZone: z.string().min(1),
    days: z
      .array(
        z.object({
          day: z.number().int().min(1).max(7),
          enabled: z.boolean(),
          start: z.string(),
          end: z.string(),
        }),
      )
      .length(7),
    holidays: z.string().max(5000),
    urgent: z.number().min(0.25).max(168),
    high: z.number().min(0.25).max(168),
    medium: z.number().min(0.25).max(168),
    low: z.number().min(0.25).max(168),
    warningMinutes: z.number().int().min(1),
    alertsEnabled: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "business") {
      const selected = value.days.filter((day) => day.enabled);
      if (!selected.length)
        ctx.addIssue({
          code: "custom",
          path: ["days"],
          message: "운영 요일을 하나 이상 선택해 주세요.",
        });
      for (const day of selected) {
        const minutes = (t: string) =>
          Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
        if (
          !timePattern.test(day.start) ||
          !timePattern.test(day.end) ||
          minutes(day.end) - minutes(day.start) < 60
        )
          ctx.addIssue({
            code: "custom",
            path: ["days"],
            message: "운영 구간은 같은 날 안에서 최소 1시간이어야 합니다.",
          });
      }
      const holidays = value.holidays.split(/[\s,]+/).filter(Boolean);
      if (
        holidays.length > 366 ||
        holidays.some(
          (date) =>
            !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            !Number.isFinite(Date.parse(date)) ||
            new Date(date).toISOString().slice(0, 10) !== date,
        )
      )
        ctx.addIssue({
          code: "custom",
          path: ["holidays"],
          message: "휴일은 유효한 YYYY-MM-DD 날짜로 최대 366개 입력해 주세요.",
        });
    }
    if (
      value.urgent > value.high ||
      value.high > value.medium ||
      value.medium > value.low
    )
      ctx.addIssue({
        code: "custom",
        path: ["urgent"],
        message: "높은 우선순위의 목표 시간을 더 짧거나 같게 설정해 주세요.",
      });
    if (
      value.warningMinutes >=
      Math.min(value.urgent, value.high, value.medium, value.low) * 60
    )
      ctx.addIssue({
        code: "custom",
        path: ["warningMinutes"],
        message: "사전 알림은 가장 짧은 응답 목표보다 짧아야 합니다.",
      });
  });
export type ResponsePolicyInput = z.infer<typeof responsePolicySchema>;
export type ResponseCalendar = {
  mode: "calendar" | "business";
  timeZone: string;
  days: { day: number; start: string; end: string }[];
  holidays: string[];
};
export type ResponsePolicy = {
  id: string;
  calendar: ResponseCalendar;
  targets: { low: number; medium: number; high: number; urgent: number };
  warning_minutes: number;
  created_at: string;
  created_by: string | null;
  alerts_enabled: boolean;
};
export function policyInput(
  policy: ResponsePolicy,
  alertsEnabled: boolean,
): ResponsePolicyInput {
  return {
    mode: policy.calendar.mode,
    timeZone: policy.calendar.timeZone,
    days: Array.from({ length: 7 }, (_, index) => {
      const rule = policy.calendar.days.find((d) => d.day === index + 1);
      return {
        day: index + 1,
        enabled: !!rule,
        start: rule?.start ?? "09:00",
        end: rule?.end ?? "18:00",
      };
    }),
    holidays: policy.calendar.holidays.join("\n"),
    low: policy.targets.low / 60,
    medium: policy.targets.medium / 60,
    high: policy.targets.high / 60,
    urgent: policy.targets.urgent / 60,
    warningMinutes: policy.warning_minutes,
    alertsEnabled,
  };
}
export function policyPayload(
  input: ResponsePolicyInput,
  previousCalendar?: ResponseCalendar,
) {
  return {
    calendar: {
      mode: input.mode,
      timeZone: input.timeZone,
      days:
        input.mode === "calendar"
          ? (previousCalendar?.days ??
            [1, 2, 3, 4, 5].map((day) => ({
              day,
              start: "09:00",
              end: "18:00",
            })))
          : input.days
              .filter((day) => day.enabled)
              .map(({ day, start, end }) => ({ day, start, end })),
      holidays:
        input.mode === "calendar"
          ? (previousCalendar?.holidays ?? [])
          : [...new Set(input.holidays.split(/[\s,]+/).filter(Boolean))].sort(),
    },
    targets: {
      low: Math.round(input.low * 60),
      medium: Math.round(input.medium * 60),
      high: Math.round(input.high * 60),
      urgent: Math.round(input.urgent * 60),
    },
  };
}
