import "server-only";

import { createMockAIProvider } from "./mock-ai-provider";
import { createOpenAIAIProvider } from "./openai-ai-provider";

export function getAIProvider() {
  const configuredProvider = process.env.AI_PROVIDER?.trim() || "mock";
  if (configuredProvider !== "mock" && configuredProvider !== "openai") {
    throw new Error("지원하지 않는 AI provider 설정입니다.");
  }

  if (configuredProvider === "openai") {
    return createOpenAIAIProvider();
  }

  return createMockAIProvider();
}
