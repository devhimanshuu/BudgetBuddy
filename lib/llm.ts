/**
 * Lightweight chat-completion helper with a Groq -> OpenRouter fallback chain.
 *
 * Used by webhook handlers (e.g. the Telegram bot) that make raw, one-shot
 * LLM calls outside the LangChain agent. Mirrors the agent's resilience:
 * if Groq is rate-limited (429 TPD) or fails, it walks through a chain of
 * OpenRouter models (several free, then a reliable paid one) until one works,
 * so basic features (expense parsing, split parsing) keep working.
 *
 * Every call is time-boxed with AbortController so a slow/hanging provider
 * never blocks a webhook response (which would cause Telegram to retry and
 * double-process the update). The provider/model chain lives in lib/llm-config.
 */

import {
  GROQ_BASE_URL,
  GROQ_MODEL,
  OPENROUTER_BASE_URL,
  OPENROUTER_FALLBACK_MODELS,
  REQUEST_TIMEOUT_MS,
} from "./llm-config";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function callProvider(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature: number
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${url}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, temperature }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Run a chat completion, preferring Groq and falling back through the
 * OpenRouter model chain (free models first, paid last).
 * Returns the assistant message content (may be an empty string).
 * Throws only if no provider is configured or every provider/model fails.
 */
export async function completeChat(
  messages: ChatMessage[],
  opts: { temperature?: number } = {}
): Promise<string> {
  const temperature = opts.temperature ?? 0;
  const errors: string[] = [];

  // 1. Primary: Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const content = await callProvider(GROQ_BASE_URL, process.env.GROQ_API_KEY, GROQ_MODEL, messages, temperature);
      if (content) return content;
      errors.push("groq: empty response");
    } catch (err: any) {
      errors.push(`groq: ${err?.message || err}`);
    }
  }

  // 2. Fallback chain: OpenRouter (free models first, paid last)
  if (process.env.OPENROUTER_API_KEY) {
    for (const model of OPENROUTER_FALLBACK_MODELS) {
      try {
        const content = await callProvider(
          OPENROUTER_BASE_URL,
          process.env.OPENROUTER_API_KEY,
          model,
          messages,
          temperature
        );
        if (content) return content;
        errors.push(`${model}: empty response`);
      } catch (err: any) {
        errors.push(`${model}: ${err?.message || err}`);
      }
    }
  }

  if (errors.length === 0) {
    throw new Error("No LLM provider configured (set GROQ_API_KEY or OPENROUTER_API_KEY)");
  }
  throw new Error(`All LLM providers failed: ${errors.join(" | ")}`);
}
