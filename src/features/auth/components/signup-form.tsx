"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  signupSchema,
  signupPasswordHint,
  type SignupInput,
} from "../schemas/auth-schema";
import { getAuthFailure } from "../utils/auth-feedback";
import { AuthField } from "./auth-field";
import { AuthSubmit } from "./auth-submit";
import styles from "./auth.module.css";
export function SignupForm() {
  const router = useRouter();
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null,
  );
  const [navigating, setNavigating] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "" },
  });
  const pending = isSubmitting || navigating;
  async function onSubmit(input: SignupInput) {
    clearErrors("root");
    try {
      const { data, error } = await createSupabaseBrowserClient().auth.signUp({
        email: input.email,
        password: input.password,
        options: { data: { name: input.name, role: "customer" } },
      });
      if (error) {
        const failure = getAuthFailure(error, "signup");
        setError(
          failure.field,
          { type: "server", message: failure.message },
          { shouldFocus: true },
        );
        return;
      }
      if (!data.session) {
        resetField("password");
        setConfirmationEmail(input.email);
        return;
      }
      setNavigating(true);
      router.replace("/tickets/new");
      router.refresh();
    } catch {
      setError("root.server", {
        message:
          "회원가입을 완료하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.",
      });
    }
  }
  if (confirmationEmail)
    return (
      <div className={styles.confirmation} role="status">
        <MailCheck size={32} aria-hidden="true" />
        <h2>메일함을 확인해 주세요</h2>
        <p>
          <strong>{confirmationEmail}</strong>
          <br />
          가입 확인 메일이 도착하면 인증을 완료해 주세요. 이미 가입한 계정이라면
          아래 로그인으로 이동해 주세요.
        </p>
        <button type="button" onClick={() => setConfirmationEmail(null)}>
          이메일 다시 입력하기
        </button>
      </div>
    );
  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      onChange={() => clearErrors("root")}
      aria-busy={pending}
    >
      <fieldset disabled={pending}>
        <AuthField
          id="name"
          label="이름"
          autoComplete="name"
          placeholder="이름을 입력해 주세요"
          error={errors.name?.message}
          {...register("name")}
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
          autoComplete="new-password"
          placeholder="비밀번호를 입력해 주세요"
          hint={signupPasswordHint}
          error={errors.password?.message}
          {...register("password")}
        />
        <AuthSubmit
          pending={pending}
          label="회원가입"
          error={errors.root?.server?.message}
        />
      </fieldset>
      <p className={styles.accountHint}>
        고객 계정으로 가입됩니다. 가입 후 바로 문의를 남길 수 있습니다.
      </p>
    </form>
  );
}
