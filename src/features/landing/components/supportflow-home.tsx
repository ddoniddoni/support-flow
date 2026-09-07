import Link from "next/link";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  Clock3,
  Inbox,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { ProductTour } from "./product-tour";
import styles from "./supportflow-home.module.css";

function Brand() {
  return (
    <span className={styles.brand}>
      <span className={styles.brandMark}>
        <Activity size={22} aria-hidden="true" />
      </span>
      SupportFlow<span className={styles.brandDot}>.</span>
    </span>
  );
}
function DemoLink() {
  return (
    <Link href="/login" className={styles.primaryButton}>
      데모 시작하기
      <ArrowRight size={17} aria-hidden="true" />
    </Link>
  );
}
function ConversationPreview() {
  return (
    <div
      className={styles.conversation}
      aria-label="문의 접수부터 답변까지의 예시"
    >
      <div className={styles.previewHeading}>
        <span>
          <span className={styles.liveDot} />
          하나의 문의, 연결된 흐름
        </span>
        <span>예시</span>
      </div>
      <div className={styles.messageCard}>
        <div className={styles.messageMeta}>
          <span className={styles.avatar}>지</span>
          <div>
            <strong>김지윤 고객</strong>
            <span>새 문의 · 결제</span>
          </div>
          <MessageSquareText size={20} aria-hidden="true" />
        </div>
        <p>
          결제가 두 번 되었어요.
          <br /> 확인해 주실 수 있을까요?
        </p>
        <span className={styles.messageTime}>방금 접수</span>
      </div>
      <div className={styles.flowConnector}>
        <span />
        <ArrowDown size={16} aria-hidden="true" />
        <span />
      </div>
      <div className={styles.analysisCard}>
        <div className={styles.analysisHeading}>
          <Sparkles size={17} aria-hidden="true" />
          <strong>AI가 맥락을 정리했어요</strong>
          <span>검토 필요</span>
        </div>
        <p>중복 결제 확인과 환불을 요청한 문의입니다.</p>
        <div className={styles.analysisTags}>
          <span>결제 문의</span>
          <span>환불 요청</span>
          <span>답변 초안 준비</span>
        </div>
      </div>
      <div className={styles.flowConnector}>
        <span />
        <ArrowDown size={16} aria-hidden="true" />
        <span />
      </div>
      <div className={styles.replyCard}>
        <span className={styles.replyIcon}>
          <CheckCheck size={22} aria-hidden="true" />
        </span>
        <div>
          <strong>검토는 꼼꼼하게, 답변은 명확하게.</strong>
          <p>담당 상담원이 확인한 답변을 고객에게 보냅니다.</p>
        </div>
      </div>
      <p className={styles.previewFootnote}>
        <ShieldCheck size={14} aria-hidden="true" />
        AI 초안은 상담원의 검토 후에만 전달됩니다.
      </p>
    </div>
  );
}
const roles = [
  {
    icon: MessageSquareText,
    label: "고객",
    title: "문의는 간편하게.\n답변은 한곳에서.",
    text: "문의와 첨부파일을 남기고, 내 문의의 답변과 처리 상황을 확인합니다.",
    items: ["내 문의와 공개 답변", "응답 기한 안내", "추가 질문과 답변 평가"],
  },
  {
    icon: Inbox,
    label: "상담원",
    title: "내가 맡은 문의에\n온전히 집중하도록.",
    text: "배정된 문의의 맥락을 빠르게 파악하고, 팀과 함께 정확한 답변을 준비합니다.",
    items: [
      "내 배정 문의와 AI 초안",
      "내부 메모와 답변 템플릿",
      "동시 작성 안내와 초안 보존",
    ],
  },
  {
    icon: UsersRound,
    label: "관리자",
    title: "팀의 흐름과\n고객 경험을 함께.",
    text: "누가 무엇을 처리하는지 확인하고, 지원팀의 업무와 운영 기준을 관리합니다.",
    items: [
      "문의 일괄 배정과 사용자 관리",
      "영업시간과 응답 목표 설정",
      "운영 리포트와 고객 만족도",
    ],
  },
];
const questions = [
  {
    title: "AI가 고객에게 자동으로 답변하나요?",
    answer:
      "아니요. AI는 문의 요약, 분류, 긴급도와 답변 초안을 제안합니다. 상담원이 내용을 검토하고 직접 등록한 답변만 고객에게 공개됩니다. 검토가 필요한 분석은 별도로 확인할 수 있습니다.",
  },
  {
    title: "고객과 상담원은 같은 화면을 사용하나요?",
    answer:
      "역할에 맞는 화면을 사용합니다. 고객은 문의 등록과 내 문의 확인을, 상담원은 자신에게 배정된 문의 처리를, 관리자는 전체 문의와 팀 운영 관리를 할 수 있습니다. 내부 메모와 AI 분석은 고객에게 공개되지 않습니다.",
  },
  {
    title: "응답 목표는 우리 팀의 운영시간에 맞출 수 있나요?",
    answer:
      "관리자가 우선순위별 응답 목표, 운영 요일과 시간, 휴일을 설정할 수 있습니다. 응답 기한이 가까워지거나 초과하면 담당자 또는 관리자에게 앱 내 알림을 보냅니다.",
  },
  {
    title: "데모에서는 어떤 기능을 볼 수 있나요?",
    answer:
      "로그인 후 계정 역할에 따라 문의 등록, 상담 답변, AI 분석과 운영 대시보드를 확인할 수 있습니다. AI는 예시 규칙으로 분석하는 데모 모드를 지원하며, 실제 고객의 개인정보 대신 테스트 내용을 사용해 주세요.",
  },
];
export function SupportFlowHome() {
  return (
    <div className={styles.home}>
      <a href="#main-content" className={styles.skipLink}>
        본문으로 바로가기
      </a>
      <header className={styles.header}>
        <div className={styles.navBar}>
          <Link href="/" aria-label="SupportFlow 홈">
            <Brand />
          </Link>
          <nav aria-label="홈페이지 메뉴" className={styles.navLinks}>
            <a href="#product">제품 살펴보기</a>
            <a href="#workflow">함께 일하는 방식</a>
            <a href="#faq">자주 묻는 질문</a>
          </nav>
          <Link href="/login" className={styles.headerCta}>
            데모 시작하기
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </header>
      <main id="main-content">
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>
                <span />
                AI와 함께하는 고객지원
              </p>
              <h1>
                고객의 한마디가,
                <br /> 팀의 <span>다음 행동으로.</span>
              </h1>
              <p className={styles.heroDescription}>
                문의가 쌓여도, 중요한 이야기는 놓치지 않도록.
                <br className={styles.desktopBreak} /> 접수부터 AI 검토, 담당자
                배정과 답변까지
                <br className={styles.desktopBreak} /> 하나의 흐름으로
                연결하세요.
              </p>
              <div className={styles.heroActions}>
                <DemoLink />
                <a href="#product" className={styles.textLink}>
                  제품 살펴보기
                  <ArrowDown size={16} aria-hidden="true" />
                </a>
              </div>
              <p className={styles.heroNote}>
                고객 · 상담원 · 관리자, 각자의 역할에 맞는 워크스페이스
              </p>
            </div>
            <ConversationPreview />
          </div>
        </section>
        <section
          className={styles.workflowStrip}
          aria-label="고객지원 업무 흐름"
        >
          <div className={styles.container}>
            <div>
              <MessageSquareText aria-hidden="true" />
              <span>
                <strong>흩어지지 않는 문의</strong>
                <small>대화와 첨부파일을 한곳에</small>
              </span>
            </div>
            <ArrowRight className={styles.stripArrow} aria-hidden="true" />
            <div>
              <Sparkles aria-hidden="true" />
              <span>
                <strong>맥락을 짚어주는 AI</strong>
                <small>요약부터 답변 초안까지</small>
              </span>
            </div>
            <ArrowRight className={styles.stripArrow} aria-hidden="true" />
            <div>
              <CheckCheck aria-hidden="true" />
              <span>
                <strong>사람이 완성하는 답변</strong>
                <small>검토하고, 전달하고, 확인하기</small>
              </span>
            </div>
          </div>
        </section>
        <section id="product" className={styles.productSection}>
          <div className={styles.container}>
            <div className={styles.sectionIntro}>
              <div>
                <p className={styles.eyebrow}>제품 살펴보기</p>
                <h2>
                  지금 해야 할 일이
                  <br /> 선명하게 보이는 공간.
                </h2>
              </div>
              <p>
                문의 목록에서 팀 전체의 흐름까지.
                <br /> 필요한 정보를 찾는 시간을 줄이고,
                <br /> 고객의 문제를 해결하는 데 집중하세요.
              </p>
            </div>
            <ProductTour />
          </div>
        </section>
        <section id="workflow" className={styles.rolesSection}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>함께 일하는 방식</p>
            <h2>
              하나의 서비스.
              <br className={styles.mobileBreak} /> 각자에게 필요한 화면.
            </h2>
            <p className={styles.sectionDescription}>
              고객의 편리함과 지원팀의 효율을 같은 흐름 안에서 생각했습니다.
            </p>
            <div className={styles.roles}>
              {roles.map(({ icon: Icon, label, title, text, items }) => (
                <article className={styles.role} key={label}>
                  <div className={styles.roleLabel}>
                    <Icon size={21} aria-hidden="true" />
                    {label}
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <ul>
                    {items.map((item) => (
                      <li key={item}>
                        <Check size={15} aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className={styles.assuranceSection}>
          <div className={styles.container}>
            <div>
              <p className={styles.eyebrow}>작은 디테일까지, 함께</p>
              <h2>
                빠른 답변만큼,
                <br /> 놓치지 않는 지원.
              </h2>
              <p>
                문의가 늘고 여러 사람이 함께 일해도
                <br /> 고객과의 약속을 지킬 수 있도록 돕습니다.
              </p>
            </div>
            <div className={styles.assurances}>
              <article>
                <Clock3 aria-hidden="true" />
                <div>
                  <h3>우리 팀의 시간에 맞춘 응답 목표</h3>
                  <p>
                    영업시간과 휴일을 반영하고, 응답이 늦어지기 전에 알려줍니다.
                  </p>
                </div>
              </article>
              <article>
                <UsersRound aria-hidden="true" />
                <div>
                  <h3>엇갈리는 답변 없이, 자연스러운 협업</h3>
                  <p>
                    다른 상담원의 작성 상태를 확인하고, 새 대화가 생기면 전송
                    전에 다시 검토합니다.
                  </p>
                </div>
              </article>
              <article>
                <ShieldCheck aria-hidden="true" />
                <div>
                  <h3>고객에게 보여줄 내용만 명확하게</h3>
                  <p>
                    공개 답변과 내부 메모를 구분하고, AI의 제안은 사람이
                    확인합니다.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>
        <section id="faq" className={styles.faqSection}>
          <div className={styles.container}>
            <div>
              <p className={styles.eyebrow}>자주 묻는 질문</p>
              <h2>
                시작하기 전에
                <br /> 궁금한 이야기.
              </h2>
            </div>
            <div className={styles.questions}>
              {questions.map((q) => (
                <details key={q.title}>
                  <summary>
                    {q.title}
                    <ChevronDown size={19} aria-hidden="true" />
                  </summary>
                  <p>{q.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className={styles.finalCta}>
          <div className={styles.container}>
            <div>
              <p className={styles.eyebrow}>더 명확한 고객지원의 시작</p>
              <h2>
                다음 문의부터,
                <br /> SupportFlow와 함께.
              </h2>
            </div>
            <div>
              <DemoLink />
              <Link href="/signup" className={styles.signupLink}>
                새 계정 만들기
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div>
            <Link href="/" aria-label="SupportFlow 홈">
              <Brand />
            </Link>
            <p>고객의 이야기와 팀의 다음 행동을 연결합니다.</p>
          </div>
          <nav aria-label="하단 메뉴">
            <a href="#product">제품 소개</a>
            <a href="#faq">FAQ</a>
            <Link href="/login">로그인</Link>
          </nav>
          <span className={styles.copyright}>© SupportFlow</span>
        </div>
      </footer>
    </div>
  );
}
