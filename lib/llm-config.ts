/**
 * Shared LLM provider configuration used by both the LangChain agent
 * (`agent/model.ts`) and the lightweight webhook helper (`lib/llm.ts`).
 *
 * Strategy: Groq is the primary provider. When it fails (e.g. 429 once the
 * free-tier daily token limit is hit), we fall back through a chain of
 * OpenRouter models, tried in order:
 *   - Several FREE models first (cost $0, but individually flaky / often
 *     upstream rate-limited — chaining several makes overall success high).
 *   - One reliable PAID model last, as a guaranteed final fallback.
 *
 * All chosen models support tool-calling, so the same chain works for the
 * tool-bound agent graph and for plain chat workflows.
 */

export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const GROQ_MODEL = "llama-3.3-70b-versatile";

export const REQUEST_TIMEOUT_MS = 30000;

/**
 * OpenRouter fallback chain, tried in order. Free models first, reliable
 * paid model last. Edit this list to add/remove fallbacks in one place.
 */
export const OPENROUTER_FALLBACK_MODELS: string[] = [
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct", // paid, reliable final fallback
];
