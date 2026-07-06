import {
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type WhitepaceLandingProps = {
  workspaceHref: string;
  workspaceLabel: string;
};

function CTAButton({
  children,
  href,
  tone = "blue",
}: {
  children: ReactNode;
  href: string;
  tone?: "blue" | "yellow";
}) {
  return (
    <Link
      className={
        tone === "yellow"
          ? "inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-[#FFE492] px-4 text-sm font-medium leading-none text-[#043873] shadow-sm transition hover:bg-[#ffe070] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#FFE492]/40"
          : "inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-[#4F9CF9] px-4 text-sm font-medium leading-none text-white shadow-sm transition hover:bg-[#3f8ee8] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#4F9CF9]/35"
      }
      href={href}
    >
      {children}
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </Link>
  );
}

function LogoMark() {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-8 place-items-center rounded-md bg-[#4F9CF9] text-white">
        <Sparkles className="size-4" aria-hidden="true" />
      </span>
      <span className="text-xl font-bold tracking-normal text-white">
        SupportFlow
      </span>
    </div>
  );
}

function WaveLines({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 720 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {Array.from({ length: 9 }).map((_, index) => (
        <path
          d={`M-40 ${90 + index * 20}C130 ${10 + index * 14} 300 ${
            170 + index * 8
          } 510 ${70 + index * 18}C610 ${28 + index * 10} 690 ${
            44 + index * 12
          } 780 ${22 + index * 18}`}
          key={index}
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

type ScreenshotVariant =
  | "ai"
  | "dashboard"
  | "reports"
  | "tickets";

const screenshotImages: Record<
  ScreenshotVariant,
  { alt: string; src: string }
> = {
  ai: {
    alt: "SupportFlow 문의 상세와 AI 어시스턴트 화면",
    src: "/landing/screenshots/ticket-detail.png",
  },
  dashboard: {
    alt: "SupportFlow 운영 현황 대시보드 화면",
    src: "/landing/screenshots/dashboard.png",
  },
  reports: {
    alt: "SupportFlow 리포트 화면",
    src: "/landing/screenshots/reports.png",
  },
  tickets: {
    alt: "SupportFlow 문의함 목록 화면",
    src: "/landing/screenshots/tickets.png",
  },
};

function ProductScreenshot({
  title,
  variant,
}: {
  title: string;
  variant: ScreenshotVariant;
}) {
  const screenshot = screenshotImages[variant];

  return (
    <div className="mx-auto w-full max-w-[720px] overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl shadow-[#043873]/30">
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-950 px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#FF5F57]" />
        <span className="size-2.5 rounded-full bg-[#FFBD2E]" />
        <span className="size-2.5 rounded-full bg-[#28C840]" />
        <p className="ml-3 truncate text-[11px] font-semibold text-slate-400">
          {title}
        </p>
      </div>
      <div className="relative aspect-[1.469] bg-slate-950">
        <Image
          src={screenshot.src}
          alt={screenshot.alt}
          fill
          sizes="(min-width: 1024px) 720px, calc(100vw - 40px)"
          className="object-cover object-left-top"
          loading="eager"
        />
      </div>
    </div>
  );
}

function HeroMockup() {
  return (
    <div className="mx-auto w-full max-w-[620px]">
      <ProductScreenshot title="/dashboard" variant="dashboard" />
    </div>
  );
}

function SectionHeading({
  children,
  invert = false,
}: {
  children: ReactNode;
  invert?: boolean;
}) {
  return (
    <h2
      className={`font-heading text-4xl font-bold leading-tight tracking-normal sm:text-5xl ${
        invert ? "text-white" : "text-[#212529]"
      }`}
    >
      {children}
    </h2>
  );
}

function TextSection({
  body,
  dark = false,
  title,
  visual,
  visualSide = "left",
}: {
  body: string;
  dark?: boolean;
  title: ReactNode;
  visual: ReactNode;
  visualSide?: "left" | "right";
}) {
  const visualOrder = visualSide === "right" ? "lg:order-2" : "lg:order-1";
  const textOrder = visualSide === "right" ? "lg:order-1" : "lg:order-2";

  return (
    <section className={dark ? "bg-[#043873]" : "bg-white"}>
      <div className="mx-auto grid max-w-[1480px] items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-16 lg:py-28">
        <div className={visualOrder}>{visual}</div>
        <div className={textOrder}>
          <SectionHeading invert={dark}>{title}</SectionHeading>
          <p
            className={`mt-6 max-w-xl text-base leading-8 ${
              dark ? "text-white/80" : "text-[#212529]"
            }`}
          >
            {body}
          </p>
        </div>
      </div>
    </section>
  );
}

export function WhitepaceLanding({
  workspaceHref,
  workspaceLabel,
}: WhitepaceLandingProps) {
  return (
    <main className="min-h-screen bg-white font-sans">
      <section className="relative overflow-hidden bg-[#043873] text-white">
        <WaveLines className="absolute inset-y-24 left-0 w-[900px] text-white/40" />
        <header className="relative z-10 mx-auto flex max-w-[1480px] items-center justify-between gap-6 px-5 py-5 sm:px-8 lg:px-16">
          <LogoMark />
          <div className="hidden items-center md:flex">
            <CTAButton href={workspaceHref}>{workspaceLabel}</CTAButton>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#4F9CF9] px-4 text-sm font-medium text-white md:hidden"
            href={workspaceHref}
          >
            시작
          </Link>
        </header>

        <div className="relative z-10 mx-auto grid max-w-[1480px] items-center gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-16 lg:pb-28 lg:pt-20">
          <div>
            <h1 className="whitespace-nowrap font-heading text-4xl font-bold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              AI가 지원팀 운영을 도와줍니다.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-white/80">
              SupportFlow는 문의 접수, AI 분류, 답변 초안, 검토 큐와 SLA
              관리를 한 화면에서 연결하는 고객지원 운영 대시보드입니다.
            </p>
          </div>
          <HeroMockup />
        </div>
      </section>

      <TextSection
        title={
          <>
            문의 흐름을
            <br />
            한눈에
          </>
        }
        body="답변 상태, 우선순위, SLA, 담당자와 AI 신호를 한 목록에서 확인합니다. 운영자는 지금 먼저 봐야 할 문의를 빠르게 고를 수 있습니다."
        visual={<ProductScreenshot title="/tickets" variant="tickets" />}
      />

      <TextSection
        dark
        title={
          <>
            AI가 맥락을
            <br />
            정리합니다
          </>
        }
        body="문의 요약, 감정, 긴급도, 답변 초안을 제안합니다. 상담원은 AI 판단을 참고하되 최종 답변은 직접 검토해서 처리합니다."
        visual={<ProductScreenshot title="/tickets/[id]" variant="ai" />}
        visualSide="right"
      />

      <TextSection
        title={
          <>
            운영 신호를
            <br />
            놓치지 않게
          </>
        }
        body="응답 위험, 부정 감정, 카테고리 분포를 리포트로 확인합니다. 팀의 병목과 지원 품질을 운영 관점에서 점검할 수 있습니다."
        visual={<ProductScreenshot title="/reports" variant="reports" />}
      />

      <footer className="bg-[#043873] text-white">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-8 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-16">
          <div>
            <LogoMark />
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/75">
              AI assisted customer support operations dashboard.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
