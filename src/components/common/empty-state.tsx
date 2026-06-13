import { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-zinc-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
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
    <a className={buttonVariants()} href={href}>
      {children}
    </a>
  );
}
