import { Badge } from "@/components/ui/badge";

export function IntegrationStatusView({ databaseConfigured, autoAnalysisEnabled, provider }: {
  databaseConfigured: boolean; autoAnalysisEnabled: boolean; provider: string;
}) {
  const rows = [
    { name: "계정과 문의 저장", status: databaseConfigured ? "설정됨" : "설정 필요", detail: "로그인, 문의, 답변, 활동 이력을 저장합니다. 설정 여부이며 연결 상태를 실시간 검사한 결과는 아닙니다." },
    { name: "AI 분석", status: provider === "mock" ? "데모 모드" : "지원되지 않는 설정", detail: provider === "mock" ? "규칙 기반으로 예측 가능한 분석과 답변 초안을 제공합니다. 실제 언어 모델을 호출하지 않습니다." : "현재 버전은 규칙 기반 데모 분석을 지원합니다. 운영 설정을 확인해 주세요." },
    { name: "접수 시 자동 분석", status: autoAnalysisEnabled ? "사용 설정됨" : "꺼짐", detail: "문의 등록 후 자동 분석을 시도합니다. 분석이 실패해도 문의는 접수되며, 상담원이 상세에서 다시 실행할 수 있습니다." },
  ];
  return <div className="mx-auto grid max-w-[1200px] gap-4 px-3 py-4 sm:px-4 lg:px-6">
    <div><h1 className="text-xl font-semibold">연동 상태</h1><p className="mt-1 text-sm text-muted-foreground">관리자가 확인할 수 있는 현재 서비스 설정입니다. 설정 변경은 배포 환경에서 관리합니다.</p></div>
    <div className="divide-y rounded-lg border bg-card">{rows.map(row => <section key={row.name} className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{row.name}</h2><Badge variant="secondary">{row.status}</Badge></div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{row.detail}</p>
    </section>)}</div>
    <p className="text-sm text-muted-foreground">이메일 수신함, Slack 알림, 외부 CRM 연결은 현재 제공하지 않습니다.</p>
  </div>;
}
