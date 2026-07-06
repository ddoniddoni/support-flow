export type SidebarMode = "compact" | "expanded" | "hidden";

export const sidebarStorageKey = "supportflow:workspace-sidebar";
export const sidebarCookieName = "supportflow_workspace_sidebar";

export const sidebarWidths: Record<SidebarMode, string> = {
  compact: "4.5rem",
  expanded: "16rem",
  hidden: "2.25rem",
};

export function isSidebarMode(
  value: string | null | undefined,
): value is SidebarMode {
  return value === "expanded" || value === "compact" || value === "hidden";
}
