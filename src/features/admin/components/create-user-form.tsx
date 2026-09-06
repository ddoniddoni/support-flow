"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { FormActions } from "@/components/common/form-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSelect } from "@/components/ui/app-select";
import { createManagedUserSchema, managedRoleLabels, type CreateManagedUserInput } from "../schemas/user-management-schema";
import { useUserManagementMutations } from "../hooks/use-user-management";

export function CreateUserForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const { create } = useUserManagementMutations();
  const form = useForm<CreateManagedUserInput>({ resolver: zodResolver(createManagedUserSchema), defaultValues: { name: "", email: "", password: "", role: "customer" } });
  const pending = form.formState.isSubmitting || create.isPending;
  async function submit(input: CreateManagedUserInput) {
    try { await create.mutateAsync(input); form.reset(); onCreated(); } catch { /* Mutation error is rendered below. */ }
  }
  return (
    <Card>
      <CardHeader><CardTitle>사용자 추가</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(submit)} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {([{ key: "name", label: "이름", type: "text", autoComplete: "off" }, { key: "email", label: "이메일", type: "email", autoComplete: "off" }, { key: "password", label: "초기 비밀번호", type: "password", autoComplete: "new-password" }] as const).map((field) => (
              <div key={field.key} className="grid gap-2">
                <Label htmlFor={`new-user-${field.key}`}>{field.label}</Label>
                <Input id={`new-user-${field.key}`} type={field.type} autoComplete={field.autoComplete} disabled={pending} aria-invalid={Boolean(form.formState.errors[field.key])} aria-describedby={form.formState.errors[field.key] ? `new-user-${field.key}-error` : undefined} {...form.register(field.key)} />
                {form.formState.errors[field.key] ? <p id={`new-user-${field.key}-error`} role="alert" className="text-xs text-red-600 dark:text-red-400">{form.formState.errors[field.key]?.message}</p> : null}
              </div>
            ))}
            <div className="grid content-start gap-2">
              <Label htmlFor="new-user-role">역할</Label>
              <Controller name="role" control={form.control} render={({ field }) => (
                <AppSelect id="new-user-role" name={field.name} ref={field.ref} onBlur={field.onBlur} value={field.value} onValueChange={field.onChange} options={Object.entries(managedRoleLabels).map(([value, label]) => ({ value, label }))} disabled={pending} />
              )} />
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">초기 비밀번호는 12자 이상 설정해 주세요. 계정은 바로 로그인할 수 있으며, 안내 메일은 자동 발송되지 않습니다.</p>
          {create.error ? <p role="alert" className="text-sm text-red-600 dark:text-red-400">{create.error.message}</p> : null}
          <FormActions secondaryLabel="취소" onSecondary={onCancel} submitLabel="사용자 추가" pendingLabel="추가 중…" pending={pending} />
        </form>
      </CardContent>
    </Card>
  );
}
