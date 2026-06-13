import { EmptyState } from "@/components/common/empty-state";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <EmptyState
        title="로그인 화면 준비 중"
        description="이메일과 비밀번호로 로그인하고, 입력 검증과 오류 메시지, 제출 중 상태를 함께 제공할 예정입니다."
      />
    </main>
  );
}
