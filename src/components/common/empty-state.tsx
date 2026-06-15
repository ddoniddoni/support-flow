import { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center shadow-inner">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5 w-full sm:w-auto">{action}</div> : null}
    </div>
  );
}

export function EmptyStateAction({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <a className={buttonVariants({ className: "w-full sm:w-auto" })} href={href}>
      {children}
    </a>
  );
}
