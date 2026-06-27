import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import {
  GROQ_MODEL,
  OPENROUTER_BASE_URL,
  OPENROUTER_FALLBACK_MODELS,
  REQUEST_TIMEOUT_MS,
} from "@/lib/llm-config";

/**
 * Shared, resilient chat-model factory for all agent workflows.
 *
 * Why this exists:
 * The Groq free tier enforces a tokens-per-day (TPD) limit. Once it is hit,
 * Groq returns HTTP 429 with a multi-minute `Retry-After`. With the default
 * client settings the request would *wait* on that header (hanging for minutes),
 * which in turn makes the Telegram webhook time out and get retried by Telegram
 * (duplicate processing / "the bot isn't responding").
 *
 * To avoid that we:
 *   1. Disable Groq retries (`maxRetries: 0`) and cap each request with a timeout,
 *      so a rate-limited/slow request fails fast instead of hanging.
 *   2. Fall back through a chain of OpenRouter models (several free models first,
 *      then a reliable paid model) so the agent keeps working even after the Groq
 *      daily limit is exhausted. Each fallback also fails fast and moves on.
 *
 * The fallback chain is configured in `lib/llm-config.ts`.
 */

function makeGroq(temperature: number): ChatGroq {
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: GROQ_MODEL,
    temperature,
    // Fail fast: do not sleep on a multi-minute Retry-After. Resilience comes
    // from the OpenRouter fallback chain below, not from blocking retries.
    maxRetries: 0,
    timeout: REQUEST_TIMEOUT_MS,
  });
}

function makeOpenRouter(modelId: string, temperature: number, isLast: boolean): ChatOpenAI {
  return new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    model: modelId,
    temperature,
    // Free models are flaky; fail fast and let the next one take over.
    // The final (paid) model gets one retry for reliability.
    maxRetries: isLast ? 1 : 0,
    timeout: REQUEST_TIMEOUT_MS,
    configuration: { baseURL: OPENROUTER_BASE_URL },
  });
}

/** Build the ordered list of OpenRouter fallback models, or [] if no key. */
function makeOpenRouterChain(temperature: number): ChatOpenAI[] {
  if (!process.env.OPENROUTER_API_KEY) return [];
  return OPENROUTER_FALLBACK_MODELS.map((id, i) =>
    makeOpenRouter(id, temperature, i === OPENROUTER_FALLBACK_MODELS.length - 1)
  );
}

/**
 * A chat model that transparently falls back through OpenRouter (free models
 * first, paid last) when Groq is rate-limited or fails. Drop-in replacement
 * for `new ChatGroq(...)` for plain `.invoke([...])` calls.
 */
export function createChatModel(opts: { temperature?: number } = {}) {
  const temperature = opts.temperature ?? 0.5;
  const groq = makeGroq(temperature);
  const fallbacks = makeOpenRouterChain(temperature);
  return fallbacks.length ? groq.withFallbacks(fallbacks) : groq;
}

/**
 * A tool-calling model with the same Groq -> OpenRouter fallback chain.
 * Tools are bound to the primary and every fallback model.
 */
export function createToolModel(tools: any[], opts: { temperature?: number } = {}) {
  const temperature = opts.temperature ?? 0.5;
  const groq = makeGroq(temperature).bindTools(tools);
  const fallbacks = makeOpenRouterChain(temperature).map((m) => m.bindTools(tools));
  return fallbacks.length ? groq.withFallbacks(fallbacks) : groq;
}
