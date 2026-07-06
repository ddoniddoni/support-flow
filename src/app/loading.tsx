import { Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="grid justify-items-center gap-4 text-center">
        <span className="grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">SupportFlow</p>
          <p className="mt-1 text-sm text-muted-foreground">
            화면을 준비하고 있습니다.
          </p>
        </div>
      </div>
    </main>
  );
}
