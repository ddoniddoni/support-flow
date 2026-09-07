"use client";
import { useState, type ComponentProps } from "react";
import { Eye, EyeOff, CircleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import styles from "./auth.module.css";

type AuthFieldProps = ComponentProps<"input"> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};
export function AuthField({
  id,
  label,
  error,
  hint,
  type = "text",
  ...props
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const description = error || hint;
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.inputWrap}>
        <Input
          {...props}
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={description ? `${id}-message` : undefined}
          className={isPassword ? styles.passwordInput : undefined}
        />
        {isPassword ? (
          <button
            type="button"
            className={styles.visibilityButton}
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
            aria-controls={id}
            aria-pressed={visible}
          >
            {visible ? (
              <EyeOff size={19} aria-hidden="true" />
            ) : (
              <Eye size={19} aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>
      <div
        className={styles.fieldMessage}
        aria-live="polite"
        aria-atomic="true"
      >
        {description ? (
          <p
            id={`${id}-message`}
            className={error ? styles.fieldError : styles.hint}
          >
            {error ? <CircleAlert size={13} aria-hidden="true" /> : null}
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
