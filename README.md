# SupportFlow v2

**SupportFlow v2**는 B2B 고객 지원팀을 위한 역할 기반 문의 운영 SaaS입니다.

고객이 문의를 남기고, 상담원이 처리하고, 관리자가 전체 운영 상황을 조정하는 흐름에 AI 보조 기능을 더했습니다. 목표는 “문의 CRUD”가 아니라 실제 지원팀에서 필요한 운영 판단, 권한 분리, 처리 이력, 내부 협업, AI 검토 흐름을 한 제품 안에서 보여주는 것입니다.

배포: https://supportflow-gules.vercel.app/

## 어떤 제품인가

SupportFlow는 고객 문의가 접수된 뒤 해결되기까지의 운영 흐름을 관리합니다.

- 고객은 본인이 등록한 문의와 공개 답변만 확인합니다.
- 상담원은 자신에게 배정된 문의를 처리하고 내부 메모를 남깁니다.
- 관리자는 전체 문의를 보고 담당자, 우선순위, 상태를 조정합니다.
- 모든 주요 변경은 활동 로그로 남습니다.
- AI는 문의 접수 직후 티켓을 요약하고, 카테고리, 감정, 긴급도를 먼저 분류합니다.
- AI 결과는 사람이 확인하거나 수정해야 하며, 자동으로 고객에게 발송되지 않습니다.

즉, SupportFlow v2는 **AI가 상담원을 대체하는 챗봇**이 아니라 **지원 운영자가 더 빨리 판단하도록 돕는 Human-in-the-loop 업무 도구**입니다.

## 제품이 다루는 문제

고객 지원팀의 병목은 단순히 “문의가 많다”가 아닙니다.

실제 운영에서는 다음 문제가 함께 발생합니다.

- 어떤 문의가 급한지 빠르게 판단하기 어렵습니다.
- 부정 감정, 환불, 보안, 결제 분쟁 같은 위험 신호를 놓치기 쉽습니다.
- 고객에게 보여도 되는 답변과 내부 공유용 메모가 섞이면 사고가 납니다.
- 상담원별 업무 범위와 관리자 권한이 분리되어야 합니다.
- AI가 만든 결과를 그대로 믿기보다 사람이 검토하고 승인해야 합니다.
- 목록, 필터, 페이지 상태가 URL에 남아야 운영자가 같은 화면을 공유할 수 있습니다.

SupportFlow는 이 문제들을 하나의 제품 흐름으로 묶었습니다.

## 핵심 사용자

| 역할 | 제품 안에서의 목적 | 가능한 작업 |
| --- | --- | --- |
| 고객 | 문의를 남기고 답변을 확인 | 문의 등록, 내 문의 조회, 공개 답변 확인 |
| 상담원 | 배정된 문의 처리 | 상태 변경, 고객 답변 작성, 내부 메모, AI 분석 확인/수정 |
| 관리자 | 전체 지원 운영 관리 | 전체 문의 조회, 담당자 배정, 우선순위 조정, AI 리뷰 큐, 운영 통계 확인 |

고객 화면에는 AI 분석, 내부 메모, 활동 로그, 담당자 운영 정보가 노출되지 않습니다.

## 주요 업무 흐름

### 1. 문의 접수

고객은 카테고리, 제목, 내용을 입력해 문의를 등록합니다. 등록된 문의는 접수번호를 갖고, 고객은 자신의 문의만 볼 수 있습니다.

문의가 접수되면 서버에서 AI triage가 즉시 실행됩니다. AI는 내용을 기반으로 카테고리, 감정, 긴급도, 신뢰도, 리뷰 필요 여부를 저장하고, 위험하거나 애매한 문의는 운영자가 먼저 확인할 수 있게 표시합니다. 이 분석은 고객 화면에는 노출되지 않습니다.

### 2. 운영자 처리

상담원과 관리자는 문의 목록에서 상태, 우선순위, 카테고리, AI 신호를 기준으로 문의를 탐색합니다. 기본 정렬은 리뷰 필요, 높은 긴급도, 낮은 confidence를 우선해 출근 직후 먼저 처리해야 할 문의가 위로 오도록 설계했습니다.

지원팀은 문의 상세에서 다음 작업을 수행합니다.

- 상태 변경
- 우선순위 변경
- 상담원 배정
- 고객 공개 답변 작성
- 내부 메모 작성
- 활동 로그 확인

### 3. AI Assistant

상담원 또는 관리자는 티켓 상세의 **AI Assistant**에서 자동 분석 결과를 확인하고, 필요하면 다시 분석할 수 있습니다.

AI Assistant는 다음을 제안합니다.

- 문의 요약
- 카테고리
- 감정
- 긴급도
- 고객 의도
- 추천 우선순위
- 추천 상태
- 답변 초안
- 신뢰도
- 검토 필요 여부

AI 답변 초안은 바로 발송되지 않습니다. 상담원이 “답변에 사용”을 눌러 작성란에 불러온 뒤 직접 확인하고 제출해야 합니다.

### 4. Human-in-the-loop 리뷰

신뢰도가 낮거나 위험 신호가 있는 AI 결과는 **AI 리뷰 큐**로 이동합니다.

리뷰 대상 예시는 다음과 같습니다.

- 낮은 confidence
- critical urgency
- 환불, 취소, 법적 위협, 보안, 개인정보, 결제 분쟁 키워드
- 부정 감정 + 긴급 우선순위
- AI 응답 검증 실패 후 fallback 사용

관리자와 담당 상담원은 리뷰 큐에서 AI 결과를 승인, 수정, 거절할 수 있습니다.

### 5. 운영 대시보드

대시보드는 일반 지원 지표와 AI 운영 지표를 함께 보여줍니다.

일반 운영 지표:

- 전체 문의 수
- 열린 문의 수
- 진행 중 문의 수
- 긴급 문의 수
- 상태 분포
- 카테고리 분포
- 최근 업데이트 문의

AI 운영 지표:

- AI 리뷰 필요 건수
- 부정 감정 건수
- 높은/긴급 긴급도 건수
- 평균 confidence
- 이번 주 AI 분석 수
- 상위 AI 카테고리

## v2 AI 기능

SupportFlow v2에서 추가된 AI 기능은 기존 문의 처리 흐름을 대체하지 않고 보조합니다.

| 기능 | 설명 |
| --- | --- |
| AI Intake Triage | 문의 접수 직후 AI가 카테고리, 감정, 긴급도, 리뷰 필요 여부를 자동 분류 |
| AI Ticket Analysis | 티켓 내용을 기반으로 요약, 감정, 긴급도, 의도, 추천 작업을 생성 |
| AI Assistant Panel | 티켓 상세에서 상담원/관리자만 볼 수 있는 AI 보조 패널 |
| Reply Draft Workflow | AI 답변 초안을 복사하거나 답변 폼에 불러와 사람이 최종 작성 |
| AI Review Queue | low-confidence 또는 risky output을 별도 큐에서 검토 |
| AI Filters | 티켓 목록에서 AI 리뷰 필요, 감정, 긴급도 기준으로 필터링 |
| AI Dashboard Insights | 지원 운영 현황에 AI 신호를 함께 표시 |
| Prompt Version Tracking | 분석 결과가 어떤 prompt/provider/model 기준인지 추적 |
| Mock AI Provider | 실제 AI 키 없이도 전체 데모 플로우 동작 |
| Zod Validation | AI 출력은 저장 전 schema로 검증하고 실패 시 fallback 처리 |

## AI를 다루는 방식

이 프로젝트에서 AI는 “자동화 엔진”이 아니라 “운영 제안자”입니다.

- AI는 고객에게 직접 답변하지 않습니다.
- AI는 티켓 상태나 우선순위를 조용히 바꾸지 않습니다.
- AI는 접수 직후 운영자용 triage 신호를 저장하지만, 고객에게 분석 내용을 보여주지 않습니다.
- AI 분석 결과는 Zod schema를 통과해야 저장됩니다.
- 검증 실패나 위험 신호가 있으면 리뷰 대상으로 표시됩니다.
- 원본 AI 응답은 내부 추적용으로 저장됩니다.
- 답변 초안 사용 여부도 활동 로그로 남습니다.

이 구조는 실제 제품에서 AI 기능을 붙일 때 중요한 책임 경계와 감사 가능성을 보여주기 위한 설계입니다.

## 화면 구성

### 공개/인증 흐름

- 공개 랜딩 페이지
- 로그인
- 회원가입
- 권한 없음 페이지

### 고객 화면

- 문의 등록
- 내 문의 목록
- 문의 상세
- 공개 답변 확인

### 상담원/관리자 화면

- 운영 대시보드
- 문의 목록
- 문의 상세
- 운영 액션 패널
- AI Assistant
- AI 리뷰 큐

스크린샷은 `docs/screenshots` 폴더에 있습니다.

![SupportFlow 홈 화면](docs/screenshots/home.png)

![SupportFlow 로그인 화면](docs/screenshots/login.png)

## 권한 설계

SupportFlow는 UI에서만 숨기는 방식이 아니라 Supabase Row Level Security까지 함께 사용합니다.

| 데이터 | 고객 | 상담원 | 관리자 |
| --- | --- | --- | --- |
| tickets | 본인 문의만 | 배정 문의만 | 전체 |
| ticket_replies | 본인 문의의 공개 답변 | 배정 문의 답변/내부 메모 | 전체 |
| ticket_logs | 접근 불가 | 배정 문의 로그 | 전체 |
| ticket_ai_analyses | 접근 불가 | 배정 문의 AI 분석 | 전체 |
| ticket_ai_review_events | 접근 불가 | 배정 문의 리뷰 이벤트 | 전체 |

고객은 AI 분석, 내부 메모, 활동 로그, 운영자용 우선순위를 볼 수 없습니다.

## URL 기반 운영 UX

목록 화면은 검색, 필터, 정렬, 페이지 상태를 URL query parameter에 유지합니다.

예시:

```txt
/tickets?status=open&priority=high&category=technical&sort=updated_desc&page=2
/tickets?ai_review=yes&ai_sentiment=negative&ai_urgency=critical
/tickets/ai-review?sentiment=negative&urgency=critical&page=1
```

운영자는 같은 조건의 화면을 공유하거나 새로고침 후에도 맥락을 잃지 않습니다.

## 구현에서 신경 쓴 점

### 서버 상태 관리

TanStack Query로 서버 상태를 관리합니다.

- `["tickets", filters]`
- `["ticket", ticketId]`
- `["ticket-ai-analysis", ticketId]`
- `["ai-review-queue", filters]`
- `["dashboard-stats"]`
- `["ai-dashboard-stats"]`

상태 변경, 답변 등록, AI 분석, 리뷰 이벤트 이후 관련 query를 invalidate합니다.

### 폼과 검증

React Hook Form과 Zod를 사용해 입력값을 검증합니다.

- 로그인/회원가입
- 문의 등록
- 고객 답변
- 내부 메모
- AI 분석 수정
- AI 출력 schema 검증

### 화면 상태

주요 화면은 다음 상태를 고려합니다.

- 로딩
- 에러
- 빈 상태
- 권한 없음
- 찾을 수 없음
- 제출/저장 중 pending 상태

### 제품형 UI

운영 도구답게 정보 밀도를 유지하되, 고객 화면과 운영자 화면의 정보량을 분리했습니다.

- 고객 화면: 문의 내용과 공개 답변 중심
- 상담원/관리자 화면: 상태, 우선순위, 담당자, 로그, AI 분석 중심
- AI 리뷰 큐: 빠른 판단을 위한 confidence, sentiment, urgency 배지
- 대시보드: 카드와 분포 중심의 운영 요약

## 기술 구성

| 영역 | 사용 기술 |
| --- | --- |
| 애플리케이션 | Next.js App Router, TypeScript |
| UI | Tailwind CSS, shadcn/ui, lucide-react |
| 인증/DB | Supabase Auth, Postgres, Row Level Security |
| 서버 상태 | TanStack Query |
| 폼/검증 | React Hook Form, Zod |
| 배포 | Vercel |
| AI 구조 | Provider abstraction, Mock provider, optional real provider |

기술 선택은 “포트폴리오용 UI 데모”가 아니라 실제 SaaS 프론트엔드에서 자주 만나는 인증, 권한, 서버 상태, 폼, 검증, 운영 UI 문제를 보여주기 위한 방향으로 정했습니다.

## 프로젝트 구조

```txt
src/
  app/
    dashboard/
    login/
    signup/
    tickets/
      page.tsx
      ai-review/
      new/
      [id]/
    unauthorized/

  components/
    common/
    layout/
    ui/

  features/
    ai/
      api/
      components/
      hooks/
      providers/
      schemas/
      types/
      utils/
    auth/
    dashboard/
    tickets/

  lib/
    supabase/
    query-client.ts
    utils.ts

  types/
    database.ts
    domain.ts
```

## 데이터 모델 요약

핵심 테이블:

- `profiles`
- `tickets`
- `ticket_replies`
- `ticket_logs`

AI 확장 테이블:

- `ai_prompt_versions`
- `ticket_ai_analyses`
- `ticket_ai_review_events`

티켓에는 목록 필터와 대시보드 집계를 위한 최신 AI 분석 요약 필드도 포함됩니다.

- `latest_ai_analysis_id`
- `ai_needs_review`
- `ai_sentiment`
- `ai_urgency`
- `ai_confidence`

## 데모에서 볼 수 있는 포인트

1. 고객 계정으로 문의를 등록합니다.
2. 관리자 또는 상담원 계정으로 문의를 확인합니다.
3. 티켓 상세에서 AI Assistant로 분석을 실행합니다.
4. AI 요약, 감정, 긴급도, 답변 초안을 확인합니다.
5. 위험하거나 낮은 confidence 결과는 AI 리뷰 큐에서 검토합니다.
6. 티켓 목록에서 AI 필터로 리뷰 대상 또는 부정 감정 문의를 찾습니다.
7. 대시보드에서 일반 운영 지표와 AI 운영 지표를 함께 확인합니다.

## 데모 계정

아래 계정은 제품 데모용입니다. 샘플 데이터만 포함되어 있으며 실제 고객 정보는 사용하지 않습니다.

| 역할 | 이메일 | 비밀번호 |
| --- | --- | --- |
| 고객 | `customer@test.com` | `11111111` |
| 상담원 | `agent@test.com` | `11111111` |
| 관리자 | `admin@test.com` | `11111111` |

## 설정 참고

이 문서는 실행환경 안내가 아니라 제품 설명을 우선합니다. 다만 데모를 재현하려면 아래 값이 필요합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AI_PROVIDER=mock
AI_CONFIDENCE_REVIEW_THRESHOLD=0.7
```

Supabase SQL 문서는 `docs/`에 있습니다.

- `docs/SUPABASE_SCHEMA.sql`
- `docs/TICKET_NUMBER_MIGRATION.sql`
- `docs/AI_SCHEMA_MIGRATION.sql`
- `docs/DEMO_ACCOUNTS.sql`

## 포트폴리오 관점의 핵심 메시지

SupportFlow v2는 다음 역량을 보여주기 위한 프로젝트입니다.

- 인증과 역할 기반 접근 제어가 있는 SaaS 대시보드 구현
- RLS를 고려한 Supabase 기반 데이터 설계
- TanStack Query 기반 서버 상태 관리
- React Hook Form과 Zod를 활용한 검증 흐름
- 운영자용 테이블, 필터, 페이지네이션, 상세 화면 구성
- 고객 공개 정보와 내부 운영 정보의 분리
- AI 기능을 무책임하게 자동화하지 않고 검토 가능한 workflow로 통합
- mock provider로 실제 API key 없이도 데모 가능한 AI 제품 설계

한 줄로 요약하면, **SupportFlow v2는 기존 B2B 지원 운영 대시보드에 실무적인 AI 보조 기능을 안전하게 확장한 포트폴리오 프로젝트**입니다.
