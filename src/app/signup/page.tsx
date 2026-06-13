import { EmptyState } from "@/components/common/empty-state";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <EmptyState
        title="회원가입 화면 준비 중"
        description="이름, 이메일, 비밀번호를 입력받고 역할은 관리자 또는 초기 데이터에서 안전하게 관리할 예정입니다."
      />
    </main>
  );
}
