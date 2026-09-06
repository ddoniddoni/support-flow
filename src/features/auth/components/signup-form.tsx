"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

import { signupSchema, type SignupInput } from "../schemas/auth-schema";

function getSignupErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("already registered")) {
    return "이미 가입된 이메일입니다. 로그인으로 진행해 주세요.";
  }

  if (normalizedMessage.includes("invalid") && normalizedMessage.includes("email")) {
    return "이메일 형식이 올바르지 않습니다. 다른 이메일을 입력해 주세요.";
  }

  if (normalizedMessage.includes("password")) {
    return "비밀번호가 보안 기준을 통과하지 못했습니다. 더 긴 비밀번호를 사용해 주세요.";
  }

  if (normalizedMessage.includes("database")) {
    return "회원가입 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (normalizedMessage.includes("rate limit")) {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  }

  return "회원가입을 완료하지 못했습니다. 입력한 정보를 다시 확인해 주세요.";
}

export function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(input: SignupInput) {
    setFormError(null);
    setNotice(null);

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          name: input.name,
          role: "customer",
        },
      },
    });

    if (error) {
      setFormError(getSignupErrorMessage(error.message));
      return;
    }

    if (!data.session) {
      setNotice("가입 확인 메일을 보냈습니다. 이메일 인증 후 로그인해 주세요.");
      return;
    }

    router.replace("/tickets/new");
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        ) : null}
      </div>

      {formError ? <p role="alert" className="text-sm text-red-600">{formError}</p> : null}
      {notice ? <p role="status" className="text-sm text-emerald-700">{notice}</p> : null}

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        회원가입
      </Button>
    </form>
  );
}
