"use client";
import { useState } from "react";
import Image from "next/image";
import { LayoutDashboard, Inbox, Sparkles, ArrowUpRight } from "lucide-react";
import styles from "./supportflow-home.module.css";
const views = [
  {
    id: "tickets",
    icon: Inbox,
    label: "문의 관리",
    title: "먼저 확인할 문의부터, 한눈에.",
    text: "답변 상태와 우선순위, 담당자를 함께 확인하고 필요한 문의만 찾아보세요.",
    src: "/landing/screenshots/tickets.png",
    alt: "상태, 우선순위, 담당자와 AI 검토 여부를 보여주는 SupportFlow 문의 목록",
  },
  {
    id: "ai",
    icon: Sparkles,
    label: "AI 어시스턴트",
    title: "긴 대화의 맥락을 짚고, 답변을 준비해요.",
    text: "요약과 답변 초안을 참고하고, 확인이 필요한 AI 분석은 직접 검토하세요.",
    src: "/landing/screenshots/ticket-detail.png",
    alt: "문의 요약과 검토가 필요한 분석, 답변 초안이 표시된 SupportFlow 문의 상세",
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "운영 대시보드",
    title: "개별 문의를 넘어, 팀 전체의 흐름까지.",
    text: "응답이 필요한 문의와 배정 현황을 확인하고 팀의 다음 행동을 정하세요.",
    src: "/landing/screenshots/dashboard.png",
    alt: "응답할 문의와 답변 상태 분포, 담당자 현황을 보여주는 SupportFlow 운영 대시보드",
  },
];
export function ProductTour() {
  const [selected, setSelected] = useState(views[0]);
  return (
    <div className={styles.productTour}>
      <div
        className={styles.tourControls}
        role="group"
        aria-label="제품 미리보기 화면 선택"
      >
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            aria-pressed={selected.id === view.id}
            aria-controls="product-preview"
            onClick={() => setSelected(view)}
          >
            <view.icon size={18} aria-hidden="true" />
            {view.label}
          </button>
        ))}
      </div>
      <div className={styles.tourCaption} aria-live="polite">
        <div>
          <h3>{selected.title}</h3>
          <p>{selected.text}</p>
        </div>
        <a
          href={selected.src}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${selected.label} 이미지 크게 보기 (새 탭)`}
        >
          크게 보기
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </div>
      <figure id="product-preview" className={styles.productFrame}>
        <div className={styles.windowBar}>
          <span />
          <span />
          <span />
          <p>SupportFlow / {selected.label}</p>
          <small>제품 미리보기</small>
        </div>
        <div className={styles.screenImage}>
          <Image
            key={selected.id}
            src={selected.src}
            alt={selected.alt}
            width={1440}
            height={980}
            sizes="(max-width: 1200px) 94vw, 1120px"
            className={styles.screenshot}
          />
        </div>
        <figcaption>데모 데이터가 포함된 제품 화면입니다.</figcaption>
      </figure>
    </div>
  );
}
