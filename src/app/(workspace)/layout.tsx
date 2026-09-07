import { CustomerHeader } from "@/components/layout/customer-header";
import { cookies } from "next/headers";
import type { CSSProperties } from "react";

import { WorkspaceHeader } from "@/components/layout/workspace-header";
import {
  isSidebarMode,
  sidebarCookieName,
  sidebarWidths,
  type SidebarMode,
} from "@/components/layout/workspace-sidebar-state";
import { requireServerProfile } from "@/features/auth/api/server-auth";
import { DemoWelcome } from "@/features/demo/components/demo-welcome";
import { isDemoProfile } from "@/features/demo/demo-accounts";

function getInitialSidebarMode(value: string | undefined): SidebarMode {
  if (isSidebarMode(value)) {
    return value;
  }

  return "expanded";
}

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireServerProfile();
  const demoWelcome = isDemoProfile(profile) ? (
    <DemoWelcome key={profile.id} profileId={profile.id} role={profile.role} />
  ) : null;
  if (profile.role === "customer") {
    return (
      <div className="min-h-screen bg-background dark:[--muted-foreground:#b0bed1]">
        <CustomerHeader name={profile.name} profileId={profile.id} />
        <main>
          {demoWelcome}
          {children}
        </main>
      </div>
    );
  }
  const cookieStore = await cookies();
  const initialSidebarMode = getInitialSidebarMode(
    cookieStore.get(sidebarCookieName)?.value,
  );

  return (
    <main
      className="min-h-screen bg-background sf-workspace-main"
      data-workspace-main
      style={
        {
          "--workspace-sidebar-width": sidebarWidths[initialSidebarMode],
        } as CSSProperties
      }
    >
      <WorkspaceHeader
        initialSidebarMode={initialSidebarMode}
        profile={profile}
      />
      {demoWelcome}
      {children}
    </main>
  );
}
