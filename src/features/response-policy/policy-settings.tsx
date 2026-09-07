"use client";
import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock3, Bell, CalendarDays } from "lucide-react";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ActionDialog } from "@/components/common/action-dialog";
import { messageOf } from "@/lib/error-message";
import {
  useResponsePolicy,
  useSaveResponsePolicy,
  useSchedulerHealth,
} from "./hooks";
import {
  responsePolicySchema,
  policyInput,
  type ResponsePolicy,
  type ResponsePolicyInput,
} from "./schema";
const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
const sections =
  "grid gap-4 rounded-xl border border-border bg-card p-5 sm:p-6";
function SchedulerStatus({ profileId }: { profileId: string }) {
  const query = useSchedulerHealth(profileId);
  if (query.isPending)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        알림 스케줄러 상태를 확인하는 중…
      </p>
    );
  if (query.isError)
    return (
      <div role="alert" className="text-sm">
        <p>알림 스케줄러 상태를 확인하지 못했습니다.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void query.refetch()}
        >
          상태 다시 확인
        </Button>
      </div>
    );
  const last = query.data.last_succeeded_at;
  const healthy =
    last !== null && query.data.checkedAt - Date.parse(last) < 180000;
  return (
    <p
      role="status"
      className={`rounded-lg border p-3 text-sm leading-6 ${healthy ? "border-emerald-500/25 text-emerald-700 dark:text-emerald-300" : "border-amber-500/30 text-amber-700 dark:text-amber-300"}`}
    >
      {healthy
        ? "알림 스케줄러 정상 · 매분 확인합니다."
        : "알림 스케줄러 확인 필요 · 최근 3분 이내 실행 기록이 없습니다."}
      {last ? (
        <span className="block text-xs">
          마지막 정상 실행: {new Date(last).toLocaleString("ko-KR")}
        </span>
      ) : null}
    </p>
  );
}
export function PolicySettings({ profileId }: { profileId: string }) {
  const query = useResponsePolicy(profileId);
  const [editing, setEditing] = useState<{
    policy: ResponsePolicy;
    alertsEnabled: boolean;
  } | null>(null);
  const [notice, setNotice] = useState("");
  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-8 sm:px-6">
      <header>
        <p className="mb-2 text-sm font-medium text-primary">상담 운영 기준</p>
        <h1 className="text-2xl font-semibold">응답 목표 설정</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          문의마다 약속한 응답 기한을 일관되게 계산하고 지연을 알립니다.
        </p>
      </header>
      <SchedulerStatus profileId={profileId} />
      {notice ? (
        <p
          role="status"
          className="text-sm text-emerald-700 dark:text-emerald-300"
        >
          {notice}
        </p>
      ) : null}
      {query.isLoading ? (
        <div
          role="status"
          className="h-64 animate-pulse rounded-xl bg-muted"
          aria-label="정책 불러오는 중"
        />
      ) : query.isError ? (
        <div role="alert">
          <p>응답 정책을 불러오지 못했습니다.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            다시 시도
          </Button>
        </div>
      ) : query.data ? (
        <>
          <div className="rounded-lg border border-blue-500/25 bg-blue-500/5 p-4 text-sm leading-6">
            <strong>적용 범위</strong>
            <p>
              시간·휴일·목표 변경은 저장 이후 새로 접수되거나 재개된 응답
              대기부터 적용합니다. 이미 대기 중인 문의의 기한은 유지합니다. 알림
              켜기·끄기는 즉시 적용합니다.
            </p>
          </div>
          {editing ? (
            <PolicyEditor
              key={editing.policy.id}
              policy={editing.policy}
              alertsEnabled={editing.alertsEnabled}
              onClose={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                setNotice(
                  "응답 정책을 저장했습니다. 다음 응답 대기부터 새 시간 기준을 적용합니다.",
                );
              }}
            />
          ) : (
            <PolicySummary
              policy={query.data.policy}
              alertsEnabled={query.data.alertsEnabled}
              onEdit={() => {
                setNotice("");
                setEditing(query.data);
              }}
            />
          )}
        </>
      ) : null}
    </div>
  );
}
function PolicySummary({
  policy,
  alertsEnabled,
  onEdit,
}: {
  policy: ResponsePolicy;
  alertsEnabled: boolean;
  onEdit: () => void;
}) {
  return (
    <section className={sections}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Clock3 className="size-5 text-primary" />
          현재 응답 정책
        </h2>
        <Button onClick={onEdit}>정책 편집</Button>
      </div>
      <p className="text-sm">
        {policy.calendar.mode === "business" ? "영업시간 기준" : "24시간 기준"}{" "}
        · {policy.calendar.timeZone}
      </p>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["urgent", "긴급"],
            ["high", "높음"],
            ["medium", "보통"],
            ["low", "낮음"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="rounded-lg bg-muted/40 p-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-xl font-semibold">
              {policy.targets[key] / 60}
              <span className="ml-1 text-sm font-normal">시간</span>
            </dd>
          </div>
        ))}
      </dl>
      {policy.calendar.mode === "business" ? (
        <div className="grid gap-2 text-sm">
          <p className="font-medium">운영시간</p>
          {policy.calendar.days.map((day) => (
            <p key={day.day}>
              {weekdays[day.day - 1]}요일 {day.start}–{day.end}
            </p>
          ))}
          <p className="mt-2 text-muted-foreground">
            휴일: {policy.calendar.holidays.join(", ") || "등록 없음"}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          주말과 야간을 포함한 실제 경과 시간을 계산합니다.
        </p>
      )}
      <p className="flex items-start gap-2 border-t pt-4 text-sm leading-6">
        <Bell className="mt-1 size-4 shrink-0" />
        {alertsEnabled
          ? `목표 ${policy.warning_minutes}분 전 담당자 알림 · 기한 초과 시 담당자와 관리자 알림`
          : "지연 알림이 꺼져 있습니다. 기한 계산과 표시는 유지합니다."}
      </p>
    </section>
  );
}
function PolicyEditor({
  policy,
  alertsEnabled,
  onClose,
  onSaved,
}: {
  policy: ResponsePolicy;
  alertsEnabled: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const mutation = useSaveResponsePolicy();
  const [requestId] = useState(() => crypto.randomUUID());
  const [confirmation, setConfirmation] = useState<ResponsePolicyInput | null>(
    null,
  );
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResponsePolicyInput>({
    resolver: zodResolver(responsePolicySchema),
    defaultValues: policyInput(policy, alertsEnabled),
  });
  const mode = useWatch({ control, name: "mode" });
  const days = useWatch({ control, name: "days" });
  return (
    <form className="grid gap-5" onSubmit={handleSubmit(setConfirmation)}>
      <fieldset
        className="grid min-w-0 gap-5 disabled:opacity-60"
        disabled={mutation.isPending}
      >
        <section className={sections}>
          <h2 className="flex items-center gap-2 font-semibold">
            <CalendarDays className="size-5 text-primary" />
            운영시간과 휴일
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="response-mode">계산 기준</Label>
              <Controller
                control={control}
                name="mode"
                render={({ field }) => (
                  <AppSelect
                    id="response-mode"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={[
                      { value: "calendar", label: "24시간 기준" },
                      { value: "business", label: "영업시간 기준" },
                    ]}
                  />
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="response-timezone">운영 시간대</Label>
              <Controller
                control={control}
                name="timeZone"
                render={({ field }) => (
                  <AppSelect
                    id="response-timezone"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={Array.from(
                      new Set([
                        field.value,
                        "Asia/Seoul",
                        "Asia/Tokyo",
                        "UTC",
                        "America/New_York",
                        "Europe/London",
                      ]),
                    ).map((value) => ({ value, label: value }))}
                  />
                )}
              />
            </div>
          </div>
          {mode === "business" ? (
            <>
              <p className="text-sm leading-6 text-muted-foreground">
                요일별로 같은 날 안의 운영 구간을 지정합니다. 운영하지 않는
                시간과 아래 휴일에는 응답 시간이 흐르지 않습니다.
              </p>
              <div className="grid gap-3">
                {days.map((day, index) => (
                  <div
                    key={day.day}
                    className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[64px_minmax(0,1fr)_minmax(0,1fr)]"
                  >
                    <label className="col-span-2 flex items-center gap-2 text-sm sm:col-span-1">
                      <input
                        type="checkbox"
                        className="size-4 accent-blue-500"
                        {...register(`days.${index}.enabled`)}
                      />
                      {weekdays[index]}
                    </label>
                    <Input
                      aria-label={`${weekdays[index]}요일 시작`}
                      type="time"
                      disabled={!day.enabled || mutation.isPending}
                      {...register(`days.${index}.start`)}
                    />
                    <Input
                      aria-label={`${weekdays[index]}요일 종료`}
                      type="time"
                      disabled={!day.enabled || mutation.isPending}
                      {...register(`days.${index}.end`)}
                    />
                  </div>
                ))}
              </div>
              {errors.days ? (
                <p role="alert" className="text-sm text-destructive">
                  {errors.days.message ?? "운영 요일과 시각을 확인해 주세요."}
                </p>
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="response-holidays">휴일 날짜</Label>
                <Textarea
                  id="response-holidays"
                  placeholder={"2026-09-25\n2026-12-25"}
                  {...register("holidays")}
                />
                <p className="text-xs text-muted-foreground">
                  YYYY-MM-DD 날짜를 한 줄에 하나씩 입력합니다. 해당 연도의
                  날짜에만 적용됩니다.
                </p>
                {errors.holidays ? (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.holidays.message}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </section>
        <section className={sections}>
          <h2 className="font-semibold">우선순위별 응답 목표</h2>
          <p className="text-sm text-muted-foreground">
            15분~168시간 사이로 설정합니다. 예: 0.5 = 30분
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
              [
                ["urgent", "긴급"],
                ["high", "높음"],
                ["medium", "보통"],
                ["low", "낮음"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="grid gap-2">
                <Label htmlFor={`target-${key}`}>{label} (시간)</Label>
                <Input
                  id={`target-${key}`}
                  type="number"
                  min={0.25}
                  max={168}
                  step={0.25}
                  {...register(key, { valueAsNumber: true })}
                />
                {errors[key] ? (
                  <p role="alert" className="text-xs text-destructive">
                    {errors[key]?.message}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
        <section className={sections}>
          <h2 className="font-semibold">지연 알림</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-blue-500"
              {...register("alertsEnabled")}
            />
            응답 지연 알림 사용
          </label>
          <div className="grid gap-2">
            <Label htmlFor="response-warning">사전 알림 (목표 몇 분 전)</Label>
            <Input
              id="response-warning"
              className="max-w-40"
              type="number"
              min={1}
              {...register("warningMinutes", { valueAsNumber: true })}
            />
            {errors.warningMinutes ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.warningMinutes.message}
              </p>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            미배정 문의의 사전 알림은 관리자에게 보냅니다. 초과하면 담당자와
            관리자에게 앱 내 알림을 보냅니다. 같은 응답 대기의 같은 단계는
            수신자별 한 번만 알립니다.
          </p>
        </section>
      </fieldset>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={mutation.isPending}
          onClick={onClose}
        >
          취소
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          변경 내용 확인
        </Button>
      </div>
      <ActionDialog
        open={confirmation !== null}
        onClose={() => setConfirmation(null)}
        pending={mutation.isPending}
        title="응답 정책을 저장할까요?"
        description="새 시간 기준은 다음 응답 대기부터 적용합니다. 이미 대기 중인 문의의 기한은 바뀌지 않습니다. 알림 사용 여부는 즉시 반영됩니다."
        body={
          mutation.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {messageOf(mutation.error)}
            </p>
          ) : null
        }
      >
        <Button
          type="button"
          disabled={mutation.isPending}
          onClick={() => {
            if (confirmation)
              mutation.mutate(
                {
                  id: requestId,
                  expectedId: policy.id,
                  input: confirmation,
                  previousCalendar: policy.calendar,
                },
                { onSuccess: onSaved },
              );
          }}
        >
          {mutation.isPending ? "저장 중…" : "정책 저장"}
        </Button>
      </ActionDialog>
    </form>
  );
}
