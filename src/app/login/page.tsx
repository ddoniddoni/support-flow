import { redirectAuthenticatedUser } from "@/features/auth/api/server-auth";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
  await redirectAuthenticatedUser();

  return (
    <AuthFormShell
      title="로그인"
      description="지원 업무 공간에 접속하려면 계정으로 로그인해 주세요."
      footerText="아직 계정이 없나요?"
      footerHref="/signup"
      footerLinkText="회원가입"
    >
      <LoginForm />
    </AuthFormShell>
  );
}
