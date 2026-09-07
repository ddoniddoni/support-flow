import type { Metadata } from "next";
import { SupportFlowHome } from "@/features/landing/components/supportflow-home";

export const metadata: Metadata = {
  title: "SupportFlow | 고객의 이야기와 팀의 다음 행동을 연결하다",
  description:
    "문의 접수부터 AI 요약, 담당자 배정과 답변까지. 고객과 지원팀을 연결하는 SupportFlow를 만나보세요.",
};

export default function Home() {
  return <SupportFlowHome />;
}
