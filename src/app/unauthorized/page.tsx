import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-zinc-500">403</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950">
          Unauthorized access
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          Your current role does not have permission to view this workspace area.
        </p>
        <Link className={buttonVariants({ className: "mt-6" })} href="/dashboard">
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
