# SupportFlow

**SupportFlow**는 B2B 고객 지원팀을 위한 역할 기반 문의 관리 SaaS 대시보드입니다.

단순히 문의를 등록하고 목록으로 보여주는 CRUD 앱이 아니라, 고객 문의가 접수된 뒤 상담원에게 배정되고, 상태가 변경되고, 고객 답변과 내부 메모가 분리되며, 활동 로그로 처리 이력이 남는 실제 지원 운영 흐름을 기준으로 만들었습니다.

## 프로젝트 한눈에 보기

| 항목 | 내용 |
| --- | --- |
| 프로젝트 유형 | 포트폴리오용 B2B 고객 지원 운영 대시보드 |
| 핵심 사용자 | 고객, 상담원, 관리자 |
| 주요 기능 | 인증, 권한 분기, 문의 생성/조회, 필터링, 답변, 내부 메모, 활동 로그, 운영 통계 |
| 프론트엔드 | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| 백엔드/데이터 | Supabase Auth, Postgres, Row Level Security |
| 상태/폼 | TanStack Query, React Hook Form, Zod |
| 배포 | [Vercel](https://supportflow-gules.vercel.app/) |

## 만든 이유

고객 문의 게시판은 포트폴리오에서 흔한 소재입니다. 그래서 SupportFlow는 단순 게시판처럼 보이지 않도록 실제 사내 운영 도구에서 자주 요구되는 문제를 함께 다뤘습니다.

- 고객은 본인이 등록한 문의만 볼 수 있어야 합니다.
- 상담원은 자신에게 배정된 문의만 처리해야 합니다.
- 관리자는 전체 문의를 보고 담당자, 우선순위, 상태를 조정할 수 있어야 합니다.
- 고객에게 보이는 답변과 팀 내부 메모는 분리되어야 합니다.
- 중요한 변경 사항은 활동 로그로 남아야 합니다.
- 목록 화면의 검색, 필터, 정렬, 페이지 상태는 URL에 남아야 합니다.
- 로딩, 에러, 빈 상태, 권한 없음 상태가 모두 준비되어야 합니다.

## 역할별 사용 흐름

| 역할 | 가능한 작업 |
| --- | --- |
| 고객 | 문의 등록, 내 문의 목록 조회, 내 문의 상세 조회, SupportFlow 지원팀의 공개 답변 확인 |
| 상담원 | 배정된 문의 조회, 상태 변경, 고객 공개 답변 등록, 내부 메모 작성 |
| 관리자 | 전체 문의 조회, 상담원 배정, 우선순위 변경, 상태 변경, 운영 통계 확인 |

고객 화면에서는 내부 운영 정보가 노출되지 않도록 조정했습니다. 예를 들어 UUID 형태의 접수번호, 고객 ID, 담당자 ID, 우선순위 같은 값은 고객 화면에서 숨기고, 상담원/관리자 화면에서만 확인할 수 있습니다.

## 주요 기능

### 인증과 권한

- Supabase Auth 기반 이메일/비밀번호 로그인
- 서버 라우트 보호
- 로그인 상태에 따른 리다이렉트
- `customer`, `agent`, `admin` 역할 분기
- Supabase Row Level Security를 통한 데이터 접근 제한
- 만료되거나 꼬인 Supabase refresh token 처리

### 문의 관리

- 고객 문의 생성
- 역할별 문의 목록 조회
- 문의 상세 화면
- 상태 변경: `open`, `in_progress`, `resolved`, `closed`
- 우선순위 변경: `low`, `medium`, `high`, `urgent`
- 관리자 상담원 배정
- 고객 공개 답변
- 지원팀 내부 메모
- 활동 로그 기록

### 목록 UX

- 제목 검색
- 상태 필터
- 우선순위 필터
- 카테고리 필터
- 정렬
- 페이지네이션
- URL query parameter 기반 목록 상태 유지
- 테이블 스켈레톤
- 빈 상태와 에러 상태

예시:

```txt
/tickets?status=open&priority=high&category=technical&sort=updated_desc&page=2
```

### 대시보드

- 역할 범위에 맞는 문의 통계
- 전체 문의 수
- 열린 문의 수
- 진행 중 문의 수
- 해결된 문의 수
- 긴급 문의 수
- 상태 분포
- 카테고리 분포
- 최근 업데이트 문의

## 실무형으로 신경 쓴 부분

### 1. 서버 상태는 TanStack Query로 관리

문의 목록, 상세, 답변, 액션, 대시보드 통계는 TanStack Query 훅으로 분리했습니다.

- `useTickets`
- `useTicket`
- `useCreateTicket`
- `useUpdateTicketAction`
- `useCreateTicketReply`
- `useDashboardStats`

변경 작업 이후에는 관련 query를 invalidate하고, 문의 상태 변경은 optimistic update와 rollback을 고려했습니다.

### 2. 폼은 React Hook Form + Zod

로그인, 회원가입, 문의 등록, 답변, 내부 메모 폼은 React Hook Form과 Zod schema를 사용했습니다.

- 입력값 검증
- 필드별 에러 메시지
- 제출 중 버튼 비활성화
- pending 상태 표시

### 3. 권한은 UI와 DB 양쪽에서 방어

클라이언트에서 역할에 따라 화면을 숨기는 것에 그치지 않고, Supabase RLS 정책으로 데이터 접근도 제한했습니다.

- 고객은 본인 문의만 조회
- 상담원은 배정된 문의만 조회
- 관리자는 전체 문의 조회
- 고객은 내부 메모와 활동 로그 조회 불가
- 답변 생성은 상담원/관리자만 가능

### 4. 고객 화면과 운영자 화면의 정보 밀도 분리

고객에게는 이해하기 쉬운 문의 상태와 답변 중심으로 보여주고, 운영자에게는 상태, 우선순위, 담당자, 활동 로그 같은 처리 정보를 보여줍니다.

고객 답변 작성자도 개인 이메일이 아니라 `SupportFlow 지원팀`으로 표시되도록 다듬었습니다.

### 5. 화면 상태 처리

주요 화면마다 다음 상태를 고려했습니다.

- 로딩 상태
- 에러 상태
- 빈 상태
- 권한 없음 상태
- 찾을 수 없음 상태
- 폼 제출 중 상태

## 기술 스택

| 기술 | 사용 이유 |
| --- | --- |
| Next.js | App Router, 서버 컴포넌트, 보호 페이지, Vercel 배포 흐름 |
| TypeScript | 도메인 타입, API 응답, 폼 입력, 컴포넌트 props 타입 안정성 |
| Tailwind CSS | 대시보드 UI를 빠르고 일관되게 구성 |
| shadcn/ui | 접근성 있는 버튼, 카드, 테이블, 입력, 뱃지, 스켈레톤 구성 |
| Supabase | 인증, Postgres, RLS, RPC 기반 비즈니스 로직 |
| TanStack Query | 서버 상태 캐싱, 로딩/에러 처리, invalidation |
| React Hook Form | 폼 상태 관리와 제출 처리 |
| Zod | 런타임 검증과 TypeScript 타입 추론 |
| Zustand | 필요한 경우 가벼운 UI 상태에만 사용하기 위한 선택지 |

## 화면

스크린샷은 `docs/screenshots` 폴더에 있습니다.

| 화면 | 파일 |
| --- | --- |
| 홈 | `docs/screenshots/home.png` |
| 로그인 | `docs/screenshots/login.png` |

![SupportFlow 홈 화면](docs/screenshots/home.png)

![SupportFlow 로그인 화면](docs/screenshots/login.png)

## 프로젝트 구조

```txt
src/
  app/
    login/
    signup/
    dashboard/
    tickets/
      page.tsx
      new/
      [id]/
    admin/
    unauthorized/

  components/
    common/
    layout/
    ui/

  features/
    auth/
      api/
      components/
      schemas/
      types/
    dashboard/
      api/
      components/
      hooks/
    tickets/
      api/
      components/
      hooks/
      schemas/
      types/

  lib/
    supabase/
    env.ts
    query-client.ts
    utils.ts

  types/
    database.ts
    domain.ts
```

## 로컬 실행

의존성을 설치합니다.

```bash
npm install
```

`.env.local` 파일을 생성합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

개발 서버를 실행합니다.

```bash
npm.cmd run dev
```

브라우저에서 접속합니다.

```txt
http://localhost:3000
```

## Supabase 설정

Supabase SQL Editor에서 아래 파일을 실행합니다.

```txt
docs/SUPABASE_SCHEMA.sql
```

기존 Supabase 프로젝트에 접수번호를 추가할 때는 아래 SQL을 한 번 실행합니다.

```txt
docs/TICKET_NUMBER_MIGRATION.sql
```

스키마에는 다음 내용이 포함되어 있습니다.

- `profiles`
- `tickets`
- `ticket_replies`
- `ticket_logs`
- 역할, 상태, 우선순위 enum
- 고객/상담원/관리자 RLS 정책
- 답변 생성용 `create_ticket_reply` RPC
- 회원가입 시 profile 생성 trigger
- 티켓 수정 시간 갱신 trigger

## 데모 계정

아래 계정은 포트폴리오 시연용입니다. 샘플 데이터만 포함되어 있으며 실제 고객 정보는 사용하지 않습니다.

Supabase SQL Editor에서 `docs/DEMO_ACCOUNTS.sql`을 실행하면 아래 계정이 생성됩니다.

| 역할 | 이메일 | 비밀번호 |
| --- | --- | --- |
| 고객 | `customer@test.com` | `11111111` |
| 상담원 | `agent@test.com` | `11111111` |
| 관리자 | `admin@test.com` | `11111111` |

## 유용한 명령어

```bash
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

## 문제 해결

| 문제 | 확인할 것 |
| --- | --- |
| Supabase 요청 실패 | `.env.local` 값, Supabase URL/Anon Key, RLS 정책 확인 |
| 로그인 후 역할이 이상함 | `profiles.role` 값 확인 |
| 상담원 계정에서 문의가 안 보임 | 해당 상담원에게 문의가 배정되어 있는지 확인 |
| 관리자가 상담원 목록을 못 불러옴 | 관리자 role과 profiles select policy 확인 |
| 고객이 답변을 못 봄 | 고객이 해당 문의의 소유자인지, 공개 답변인지 확인 |
| 답변 생성이 실패함 | `create_ticket_reply` RPC와 grant 재확인 |
| Invalid Refresh Token 오류 | 브라우저의 오래된 Supabase 쿠키 삭제 후 다시 로그인 |
| PowerShell에서 npm 실행 문제 | `npm.cmd run dev`, `npm.cmd run lint`, `npm.cmd run build` 사용 |

## 배포

배포 대상은 Vercel입니다.

```txt
Deployment URL: https://supportflow-gules.vercel.app/
```

Vercel 환경 변수:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 현재 완료 상태

- 프로젝트 초기 설정
- Supabase 스키마와 RLS 구성
- 인증
- 역할 기반 라우팅
- 문의 등록
- 문의 목록
- 검색, 필터, 정렬, 페이지네이션
- 문의 상세
- 상태 변경
- 상담원 배정
- 우선순위 변경
- 고객 공개 답변
- 내부 메모
- 활동 로그
- 운영 대시보드
- 로딩/에러/빈 상태
- 권한 없음/404 페이지
- 고객-facing 정보 노출 정리
- 제품형 UI polish
- README 한글 문서화
