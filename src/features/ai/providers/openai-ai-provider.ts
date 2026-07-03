import type { AIProvider } from "./ai-provider";

export function createOpenAIAIProvider(): AIProvider {
  return {
    provider: "openai",
    model: process.env.AI_MODEL ?? null,
    async analyzeTicket() {
      throw new Error(
        "OpenAI provider is not configured in this portfolio demo. Use AI_PROVIDER=mock for the full local flow.",
      );
    },
  };
}
