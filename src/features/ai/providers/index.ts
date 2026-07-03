import { createMockAIProvider } from "./mock-ai-provider";
import { createOpenAIAIProvider } from "./openai-ai-provider";

export function getAIProvider() {
  const configuredProvider =
    typeof window === "undefined" ? process.env.AI_PROVIDER : undefined;

  if (configuredProvider === "openai") {
    return createOpenAIAIProvider();
  }

  return createMockAIProvider();
}
