export function formatAIVisibleText(value: string | null | undefined) {
  return value?.replace(/\bmock ai\b/gi, "AI") ?? "";
}
