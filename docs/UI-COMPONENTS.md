# 선택 상자 사용 규칙

일반 단일 선택은 `@/components/ui/app-select`의 `AppSelect`를 사용합니다. 화면에서 기본 `<select>`를 직접 작성하면 ESLint가 실패합니다.

```tsx
<AppSelect
  aria-label="카테고리 필터"
  value={category}
  onValueChange={setCategory}
  options={[
    { value: "all", label: "전체 카테고리" },
    { value: "billing", label: "결제" },
  ]}
/>
```

- `options`는 value, label, 선택적인 disabled로 구성합니다. value는 중복되지 않아야 합니다.
- 접근 가능한 이름은 `aria-label` 또는 `id`와 연결된 `Label`로 제공합니다.
- React Hook Form은 `Controller`로 연결합니다. `field.value`, `field.onChange`, `field.onBlur`, `field.ref`, `field.name`을 전달합니다. 오류는 `aria-invalid`, `aria-describedby`로 연결합니다.
- 높이(44px), 글자 줄 높이, 화살표, 선택 표시, 메뉴 간격, 다크 모드와 포커스는 `ui/select.tsx`에서 관리합니다. 화면에서는 너비·배치만 지정합니다.
- 옵션 메뉴는 트리거 아래에 열리며, 키보드 이동·선택·Escape 닫기를 지원합니다. 선택 상태는 제어형 value로 유지합니다.
- 필터 변경은 기존 URL query parameter를 갱신하고 페이지를 초기화합니다. 폼 선택은 제출 또는 기존의 명시된 저장 동작을 따릅니다.
- 상담원 아바타·상태 점 등 복합 콘텐츠가 필요한 티켓 처리 속성은 `TicketPropertySelect`를 사용합니다. 이 컴포넌트도 동일한 `ui/select.tsx` 프리미티브를 사용합니다.

변경 검증: `npm run lint`, `npm run build`, 고객·관리자 필터의 URL 반영, 폼 값 전달, 키보드 선택, 다크 모드 및 모바일 메뉴 넘침을 확인합니다.

## 폼 하단 버튼

접수·생성 폼은 `@/components/common/form-actions`의 `FormActions`를 사용합니다. 보조 동작을 먼저, 제출 동작을 마지막에 배치합니다. 데스크톱에서는 오른쪽 정렬, 모바일에서는 같은 DOM 순서로 전체 너비 세로 배치합니다. 두 버튼 모두 `Button size="form"`으로 높이 48px, 최소 너비 160px, 같은 글자 크기·줄 높이·간격을 사용합니다. 제출 중에는 두 버튼을 비활성화하며, 제출 버튼의 문구와 로딩 아이콘만 바뀝니다. 화면에서 별도 높이·글자 크기를 지정하지 않습니다.

## 티켓 상세의 정보 계층과 색상

참고한 제품 문서:
- Intercom Inbox 구성: https://www.intercom.com/help/en/articles/7911926-customize-the-inbox-to-suit-you-and-how-you-work-best
- Zendesk 고객 맥락 패널: https://support.zendesk.com/hc/en-us/articles/4408836526362-Using-the-context-panel
- Intercom 우선 문의 표시: https://www.intercom.com/help/en/articles/6545655-prioritize-your-most-important-conversations

위 제품의 대화·처리 속성·고객 맥락 분리 방식을 참고하되, 아래 색상과 상태 카드 구성은 SupportFlow에 맞춘 설계입니다.

- `SignalCard`는 아이콘, 항목명, 강조 값, 설명을 한 단위로 표시합니다. 색상만으로 상태를 전달하지 않습니다.
- 상단 운영 요약: 기본 응답 목표, 담당 상담원, 고객 공개 답변 여부를 표시합니다. 고객 계정에는 노출하지 않습니다.
- 빨강은 응답 목표 초과·위험, 주황은 배정·검토 필요, 파랑은 답변 대기·주요 행동, 초록은 실제 답변 등록·긍정 상태에 사용합니다. 정상적인 일반 정보는 중립색을 유지합니다.
- 고객 원문은 파란 세로선과 원문 라벨로 식별합니다. AI 영역은 인디고 배경으로 구분하고 감정·긴급도가 AI 추정값임을 표시합니다. AI 긴급도와 실제 우선순위를 혼동하지 않도록 설명을 둡니다.
- AI 답변 초안은 미전송 상태를 명시합니다. 작성란에 넣기는 입력만 수행하며, 고객에게 보내려면 별도의 답변 등록 동작이 필요합니다.
- 우측은 처리 설정과 고객 연락 정보·태그를 담습니다. 상단에 있는 접수 번호·상태·응답 목표를 텍스트로 반복하지 않습니다.
- 응답 목표는 기존 접수 시각·우선순위 기준이며 영업시간을 반영하지 않습니다. 실제 SLA 엔진이나 예측 정확도 지표로 표시하지 않습니다.

## 문의 일괄 배정

- 관리자 문의함에서 `SelectionCheckbox`로 현재 페이지의 개별 문의 또는 전체를 선택합니다. 필터·정렬·페이지가 바뀌면 선택을 초기화합니다.
- `BulkAssignableTickets`가 선택 상태와 배정 확인창을 관리합니다. 상담원 선택은 공통 `AppSelect`, 확인창은 `ActionDialog`를 사용합니다.
- 확인창에 선택한 문의와 재배정 건수를 표시합니다. 저장 중에는 선택·취소·중복 제출을 막고, 실패 시 선택을 유지합니다.
- `bulk_assign_tickets`는 관리자 권한과 상담원 역할을 DB에서 검사하고, 배정과 각 문의의 활동 기록을 하나의 트랜잭션으로 저장합니다. 동일 담당자는 변경 없이 유지하고 상태·답변은 바꾸지 않습니다.
