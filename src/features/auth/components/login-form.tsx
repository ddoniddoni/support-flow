"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { loginSchema, type LoginInput } from "../schemas/auth-schema";
import { getAuthFailure, getLoginDestination } from "../utils/auth-feedback";
import { AuthField } from "./auth-field";
import { AuthSubmit } from "./auth-submit";
import styles from "./auth.module.css";
import type { Role } from "@/types/domain";
import { DemoAccountPicker } from "@/features/demo/components/demo-account-picker";
import { getDemoAccount } from "@/features/demo/demo-accounts";
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const selectedAccount = getDemoAccount(selectedRole);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });
  const pending = isSubmitting || navigating;
  async function onSubmit(input: LoginInput) {
    clearErrors("root");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword(input);
      if (error) {
        const failure = getAuthFailure(error, "login");
        setError(
          failure.field,
          { type: "server", message: failure.message },
          { shouldFocus: true },
        );
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      setNavigating(true);
      router.replace(
        getLoginDestination(
          selectedAccount ? null : searchParams.get("next"),
          profile?.role,
        ),
      );
      router.refresh();
    } catch {
      setError("root.server", {
        message:
          "로그인을 완료하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.",
      });
    }
  }
  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      onChange={() => {
        clearErrors("root");
        setSelectedRole(null);
      }}
      aria-busy={pending}
    >
      <fieldset disabled={pending}>
        <DemoAccountPicker
          selectedRole={selectedRole}
          disabled={pending}
          onSelect={(role) => {
            const account = getDemoAccount(role);
            if (!account) return;
            reset({ email: account.email, password: account.password });
            setSelectedRole(role);
          }}
        />
        <AuthField
          id="email"
          label="이메일"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="name@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <AuthField
          id="password"
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호를 입력해 주세요"
          error={errors.password?.message}
          {...register("password")}
        />
        <AuthSubmit
          pending={pending}
          label={selectedAccount?.submitLabel ?? "로그인"}
          error={errors.root?.server?.message}
        />
      </fieldset>
    </form>
  );
}
