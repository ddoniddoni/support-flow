# SupportFlow

SupportFlow는 B2B 고객 지원팀을 위한 **역할 기반 티켓 관리 SaaS 대시보드**입니다.

단순 문의 게시판이나 CRUD 예제가 아니라, 실제 운영 도구에 가까운 프론트엔드 구조를 보여주기 위해 만든 포트폴리오 프로젝트입니다. 인증, 권한 분기, 티켓 테이블, URL 기반 필터링, 서버 상태 관리, 폼 검증, 로딩/에러/빈 상태까지 실제 업무형 대시보드에서 자주 마주치는 문제를 다루는 것을 목표로 합니다.

## 프로젝트가 보여주려는 것

SupportFlow의 핵심 목표는 “실무에서 다룰 법한 관리자 화면을 안정적으로 설계하고 구현할 수 있는가”를 보여주는 것입니다.

- 고객, 상담원, 관리자 역할에 따라 다른 화면과 액션을 제공하는 구조
- 검색, 필터, 정렬, 페이지네이션을 갖춘 티켓 운영 테이블
- 티켓 생성, 상세 조회, 상태 변경, 담당자 배정 흐름
- 고객에게 보이는 답변과 내부 운영 메모의 분리
- 활동 로그를 통한 변경 이력 추적
- 로딩, 에러, 빈 결과, 권한 없음 상태를 고려한 UX
- 기능 단위로 분리된 유지보수 가능한 폴더 구조

## 주요 사용자 흐름

### Customer

고객은 계정을 만들고 로그인한 뒤, 문의 티켓을 생성하고 본인이 만든 티켓의 진행 상태와 답변을 확인할 수 있습니다.

### Agent

상담원은 자신에게 배정된 티켓을 확인하고, 고객에게 답변하거나 내부 메모를 남기며, 티켓 상태를 `open`에서 `in_progress`, `resolved` 등으로 변경할 수 있습니다.

### Admin

관리자는 전체 티켓을 조회하고, 우선순위와 상태를 변경하며, 상담원을 배정하고, 대시보드 통계를 통해 지원팀의 운영 상태를 확인할 수 있습니다.

## 기술 스택

| 기술 | 사용 이유 |
| --- | --- |
| Next.js App Router | 인증 기반 라우팅과 대시보드 화면 구성을 위한 React 프레임워크 |
| TypeScript | 도메인 타입과 API 응답을 안전하게 다루기 위해 사용 |
| Tailwind CSS | 빠르고 일관된 대시보드 UI 스타일링 |
| shadcn/ui | 테이블, 버튼, 카드, 입력 요소 등 재사용 가능한 UI 기반 |
| Supabase | 인증, 프로필, 티켓 데이터 저장소 |
| TanStack Query | 서버 상태 캐싱, 로딩/에러 상태, 데이터 갱신 관리 |
| React Hook Form | 폼 상태를 가볍고 명확하게 관리 |
| Zod | 사용자 입력값 검증과 타입 추론 |
| Zustand | 모달, 사이드바 같은 작은 UI 상태만 관리 |
| Vercel | 배포 대상 플랫폼 |

## 핵심 기능

- 이메일 기반 로그인 및 회원가입
- Supabase Auth 기반 로그아웃
- 고객, 상담원, 관리자 역할 모델
- 보호 라우트와 권한 없음 페이지
- 티켓 생성 폼
- 티켓 목록 테이블
- 검색, 상태 필터, 우선순위 필터, 정렬, 페이지네이션
- URL query parameter 기반 목록 상태 관리
- 티켓 상세 페이지
- 상태 변경 및 담당자 배정
- 고객 공개 답변과 내부 메모
- 티켓 활동 로그
- 대시보드 통계 카드
- 테이블 스켈레톤, 상세 스켈레톤, 에러 상태, 빈 상태

## 현재 구현 상태

현재는 Next.js 프로젝트 기반과 주요 라우트, UI 컴포넌트, 도메인 타입, Supabase 클라이언트, TanStack Query Provider, 티켓 폼 스키마, 기본 페이지 구조가 준비되어 있습니다.

Supabase 테이블 초안과 TypeScript Database 타입도 함께 준비되어 있고, 로그인/회원가입/로그아웃 흐름은 Supabase Auth와 연결되어 있습니다. 보호가 필요한 주요 업무 화면은 로그인 전 접근 시 로그인 화면으로 이동합니다.

## 폴더 구조

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
    ui/
    common/
    layout/

  features/
    auth/
    tickets/
      schemas/
    dashboard/
    users/

  lib/
    supabase/
    query-client.ts
    env.ts
    utils.ts

  types/
    domain.ts
```

## 환경 변수

`.env.example`을 복사해 `.env.local`을 만든 뒤 Supabase 값을 입력합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

환경 변수를 수정한 뒤에는 개발 서버를 다시 시작해야 합니다.

초기 테이블은 Supabase SQL editor에서 `docs/SUPABASE_SCHEMA.sql`을 실행해 준비할 수 있습니다.

## 실행 방법

```bash
npm install
npm run dev
```

PowerShell 실행 정책 때문에 `npm`이 막히는 경우에는 아래처럼 실행할 수 있습니다.

```bash
npm.cmd run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 됩니다.

## 개발 규칙

- 서버에서 가져오는 데이터는 TanStack Query hook으로 관리합니다.
- 검색, 필터, 정렬, 페이지네이션 상태는 가능한 URL query parameter에 둡니다.
- 사용자 입력 폼은 React Hook Form과 Zod를 함께 사용합니다.
- Zustand는 모달, 사이드바처럼 작은 UI 상태에만 사용합니다.
- `any`는 피하고, 도메인 타입을 명확히 정의합니다.
- 주요 화면마다 로딩, 에러, 빈 상태, 권한 없음 상태를 함께 고려합니다.

## Git 작업 방식

이 프로젝트는 `master`를 사용하지 않고, `develop`을 기본 통합 브랜치처럼 사용합니다.

Phase 단위 작업은 항상 별도 브랜치에서 진행합니다.

```bash
git checkout develop
git pull origin develop
git checkout -b phase/03-auth
```

작업이 끝나면 검증 후 Phase 브랜치를 원격에 push하고, `develop`에 merge한 뒤 `develop`도 다시 push합니다.

```bash
npm.cmd run lint
npm.cmd run build
git push -u origin phase/03-auth
git checkout develop
git merge phase/03-auth
git push origin develop
```

## 데모 계정

Supabase 인증과 seed data가 준비되면 아래 형식으로 데모 계정을 추가할 예정입니다.

| 역할 | 이메일 | 비밀번호 |
| --- | --- | --- |
| Customer | 준비 예정 | 준비 예정 |
| Agent | 준비 예정 | 준비 예정 |
| Admin | 준비 예정 | 준비 예정 |

## 문제 해결

| 상황 | 해결 방법 |
| --- | --- |
| PowerShell에서 `npm` 실행이 막힘 | `npm.cmd run dev`처럼 `npm.cmd`를 사용합니다. |
| Supabase 요청이 실패함 | `.env.local` 값이 있는지 확인하고 dev server를 재시작합니다. |
| `/_next/webpack-hmr` cross-origin 경고가 보임 | `next.config.ts`의 `allowedDevOrigins` 설정을 확인합니다. |
| 스타일이 깨져 보임 | `src/app/globals.css`와 Tailwind 설정이 유지되어 있는지 확인합니다. |

## 배포

배포 대상은 Vercel입니다.

첫 preview 또는 production 배포 후 이곳에 배포 링크를 추가할 예정입니다.

```txt
Deployment URL: 준비 예정
```

## 참고 문서

프로젝트 기획과 작업 목록은 아래 문서에서 관리합니다.

- `docs/PROJECT_SPEC.md`
- `docs/SUPABASE_SCHEMA.sql`
- `docs/TASKS.md`
