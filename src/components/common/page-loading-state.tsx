import { cn } from "@/lib/utils";

type PageLoadingStateProps = {
  className?: string;
};

export function PageLoadingState({ className }: PageLoadingStateProps) {
  return (
    <div
      className={cn(
        "grid min-h-screen place-items-center bg-background p-6",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label="불러오는 중"
    >
      <div className="grid justify-items-center gap-3">
        <span className="size-9 rounded-full border-2 border-muted border-t-primary motion-safe:animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">
          불러오는 중
        </p>
      </div>
    </div>
  );
}
