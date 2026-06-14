import { redirectAuthenticatedUser } from "@/features/auth/api/server-auth";
import { AuthFormShell } from "@/features/auth/components/auth-form-shell";
import { SignupForm } from "@/features/auth/components/signup-form";

export default async function SignupPage() {
  await redirectAuthenticatedUser();

  return (
    <AuthFormShell
      title="회원가입"
      description="고객 문의를 등록하고 처리 현황을 확인할 계정을 만듭니다."
      footerText="이미 계정이 있나요?"
      footerHref="/login"
      footerLinkText="로그인"
    >
      <SignupForm />
    </AuthFormShell>
  );
}
