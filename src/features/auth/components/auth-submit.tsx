import { ArrowRight, Loader2, CircleAlert } from "lucide-react";
import styles from "./auth.module.css";
export function AuthSubmit({
  pending,
  label,
  error,
}: {
  pending: boolean;
  label: string;
  error?: string;
}) {
  return (
    <>
      {error ? (
        <div role="alert" className={styles.formError}>
          <CircleAlert size={17} aria-hidden="true" />
          <p>{error}</p>
        </div>
      ) : null}
      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2
              size={18}
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            처리 중…
          </>
        ) : (
          <>
            {label}
            <ArrowRight size={17} aria-hidden="true" />
          </>
        )}
      </button>
    </>
  );
}
