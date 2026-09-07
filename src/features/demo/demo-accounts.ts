import type { Role } from "@/types/domain";

// Intentionally public demo credentials, also documented in README.md.
// Never put personal accounts or privileged API keys in this catalog.
export const demoAccounts = [
  {
    role: "customer",
    label: "고객",
    email: "customer@test.com",
    password: "11111111",
    description: "문의 등록과 답변 확인",
    submitLabel: "고객으로 체험하기",
  },
  {
    role: "agent",
    label: "상담원",
    email: "agent@test.com",
    password: "11111111",
    description: "배정된 문의와 AI 답변 검토",
    submitLabel: "상담원으로 체험하기",
  },
  {
    role: "admin",
    label: "관리자",
    email: "admin@test.com",
    password: "11111111",
    description: "문의 배정과 전체 운영 관리",
    submitLabel: "관리자로 체험하기",
  },
] as const satisfies readonly {
  role: Role;
  label: string;
  email: string;
  password: string;
  description: string;
  submitLabel: string;
}[];
export function getDemoAccount(role: Role | null) {
  return demoAccounts.find((account) => account.role === role);
}
export function isDemoProfile(profile: { email: string; role: Role }) {
  return demoAccounts.some(
    (account) =>
      account.email === profile.email.toLowerCase() &&
      account.role === profile.role,
  );
}
export const demoGuides: Record<
  Role,
  { title: string; description: string; href: string; action: string }
> = {
  customer: {
    title: "첫 문의를 남겨 보세요",
    description:
      "문의와 첨부파일을 등록한 뒤, 내 문의에서 지원팀의 답변과 처리 상태를 확인할 수 있습니다.",
    href: "/tickets/new#inquiry-heading",
    action: "문의 등록하기",
  },
  agent: {
    title: "배정된 문의에서 답변을 준비해 보세요",
    description:
      "문의 상세에서 AI 요약과 답변 초안을 확인하고, 내부 메모 또는 고객에게 공개할 답변을 작성할 수 있습니다.",
    href: "/tickets",
    action: "내 배정 문의 보기",
  },
  admin: {
    title: "문의 배정부터 팀 운영을 살펴보세요",
    description:
      "문의함에서 여러 문의를 선택해 상담원에게 배정하고, 대시보드와 AI 검토에서 팀의 처리 현황을 확인할 수 있습니다.",
    href: "/tickets",
    action: "문의 배정하기",
  },
};
