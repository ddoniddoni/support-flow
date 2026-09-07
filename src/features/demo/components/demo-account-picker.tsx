"use client";
import { Inbox, MessageSquareText, UsersRound, Check } from "lucide-react";
import type { Role } from "@/types/domain";
import { demoAccounts, getDemoAccount } from "../demo-accounts";
import styles from "./demo-account-picker.module.css";
const icons = { customer: MessageSquareText, agent: Inbox, admin: UsersRound };
export function DemoAccountPicker({
  selectedRole,
  onSelect,
  disabled,
}: {
  selectedRole: Role | null;
  onSelect: (role: Role) => void;
  disabled: boolean;
}) {
  const selected = getDemoAccount(selectedRole);
  return (
    <section className={styles.picker} aria-labelledby="demo-picker-title">
      <div className={styles.heading}>
        <h2 id="demo-picker-title">계정 없이, 역할별로 둘러보세요</h2>
        <span>DEMO</span>
      </div>
      <p className={styles.intro}>
        역할을 선택하면 데모 계정이 자동 입력됩니다.
      </p>
      <div className={styles.options} role="group" aria-label="데모 역할 선택">
        {demoAccounts.map((account) => {
          const Icon = icons[account.role];
          return (
            <button
              key={account.role}
              type="button"
              aria-pressed={account.role === selectedRole}
              aria-label={`${account.label} 데모 계정 선택`}
              onClick={() => onSelect(account.role)}
              disabled={disabled}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{account.label}</span>
              {account.role === selectedRole ? (
                <Check className={styles.check} size={12} aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>
      <p className={styles.selectedDescription} aria-live="polite">
        {selected ? (
          <>
            <strong>{selected.label} 체험</strong>
            <span>{selected.description}</span>
          </>
        ) : (
          "이메일 인증이나 새 계정 생성 없이 체험할 수 있습니다."
        )}
      </p>
      <p className={styles.note}>
        공개된 공용 계정입니다. 테스트 내용으로 이용해 주세요.
      </p>
    </section>
  );
}
