import { redirectAuthenticatedUser } from "@/features/auth/api/server-auth";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
  await redirectAuthenticatedUser();

  return (
    <AuthFormShell
      title="로그인"
      description="역할별 데모를 체험하거나, 내 계정으로 로그인하세요."
      footerText="아직 계정이 없나요?"
      footerHref="/signup"
      footerLinkText="회원가입"
    >
      <LoginForm />
    </AuthFormShell>
  );
}
