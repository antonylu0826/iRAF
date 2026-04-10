import type { IAiProvider } from "./types.js"
import { ClaudeProvider } from "./claude.js"
import { OpenAIProvider } from "./openai.js"
import { GeminiProvider } from "./gemini.js"

export function createProviderInstance(
  provider: "anthropic" | "openai" | "gemini",
  apiKey: string,
  model?: string,
): IAiProvider {
  switch (provider) {
    case "anthropic":
      return new ClaudeProvider(apiKey, model)
    case "openai":
      return new OpenAIProvider(apiKey, model)
    case "gemini":
      return new GeminiProvider(apiKey, model)
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}
