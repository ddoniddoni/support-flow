import { redirectAuthenticatedUser } from "@/features/auth/api/server-auth";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
  await redirectAuthenticatedUser();

  return (
    <AuthFormShell
      title="로그인"
      description="문의 등록과 답변 확인을 위해 로그인해 주세요."
      footerText="아직 계정이 없나요?"
      footerHref="/signup"
      footerLinkText="회원가입"
    >
      <LoginForm />
    </AuthFormShell>
  );
}
