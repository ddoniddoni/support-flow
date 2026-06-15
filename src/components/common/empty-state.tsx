import { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center shadow-inner">
      <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
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
