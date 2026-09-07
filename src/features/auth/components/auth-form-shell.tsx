import {
  Activity,
  ArrowLeft,
  CheckCheck,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./auth.module.css";
type AuthFormShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footerText: string;
  footerHref: string;
  footerLinkText: string;
};
export function AuthFormShell({
  title,
  description,
  children,
  footerText,
  footerHref,
  footerLinkText,
}: AuthFormShellProps) {
  return (
    <main className={styles.page}>
      <aside className={styles.story} aria-label="SupportFlow 소개">
        <Link href="/" className={styles.brand} aria-label="SupportFlow 홈">
          <span>
            <Activity size={23} aria-hidden="true" />
          </span>
          SupportFlow.
        </Link>
        <div className={styles.storyContent}>
          <p className={styles.eyebrow}>BETTER SUPPORT, TOGETHER</p>
          <h2>
            고객과 더 가까이.
            <br />
            업무는 더 명확하게.
          </h2>
          <p>
            문의부터 해결까지 이어지는 흐름.
            <br />
            SupportFlow에서 함께 시작하세요.
          </p>
          <div className={styles.journey}>
            <div>
              <span>
                <MessageSquareText size={19} aria-hidden="true" />
              </span>
              <p>
                <strong>고객의 이야기를 한곳에</strong>
                <small>문의와 답변, 필요한 맥락까지</small>
              </p>
            </div>
            <div>
              <span>
                <Sparkles size={19} aria-hidden="true" />
              </span>
              <p>
                <strong>AI와 함께 준비하는 답변</strong>
                <small>맥락을 정리하고, 사람이 검토하고</small>
              </p>
            </div>
            <div>
              <span>
                <CheckCheck size={19} aria-hidden="true" />
              </span>
              <p>
                <strong>팀과 함께 완성하는 지원</strong>
                <small>담당자와 처리 현황을 명확하게</small>
              </p>
            </div>
          </div>
        </div>
        <p className={styles.storyFooter}>
          고객의 이야기와 팀의 다음 행동을 연결합니다.
        </p>
      </aside>
      <section className={styles.formSide} aria-labelledby="auth-title">
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          홈으로 돌아가기
        </Link>
        <div className={styles.formContainer}>
          <div className={styles.formHeading}>
            <span className={styles.formMark}>
              <Activity size={23} aria-hidden="true" />
            </span>
            <p>SUPPORTFLOW ACCOUNT</p>
            <h1 id="auth-title">{title}</h1>
            <p className={styles.description}>{description}</p>
          </div>
          {children}
          <p className={styles.footerLink}>
            {footerText} <Link href={footerHref}>{footerLinkText}</Link>
          </p>
        </div>
        <p className={styles.copyright}>© SupportFlow</p>
      </section>
    </main>
  );
}
