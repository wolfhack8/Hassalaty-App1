/**
 * Shared OpenRouter integration, extracted from the original single-file
 * implementation in `app/api/chat/route.ts` so both the personal "naqd AI"
 * assistant and the new family-module AI features (kid assistant, parent
 * insights, weekly challenges) call the same tested primitives instead of
 * re-implementing streaming/fallback/error-handling per feature.
 *
 * Deliberately still OpenRouter + raw fetch (not the Vercel AI SDK / a direct
 * OpenAI or Anthropic SDK): the app already ships a working, resilient
 * OpenRouter integration with a primary→fallback→scripted-offline chain and a
 * configured API key surface (`OPENROUTER_API_KEY`). Introducing a second AI
 * client library for the new features would fragment configuration for no
 * functional gain, so this module extends the existing one instead.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_MODEL = "google/gemini-3.5-flash";
export const DEFAULT_FALLBACK_MODEL = "openai/gpt-4o-mini";

export type ChatMessage = { role: "user" | "assistant"; content: string };

const encoder = new TextEncoder();

function openRouterHeaders(apiKey: string): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const siteUrl = process.env.OPENROUTER_SITE_URL;
  const appName = process.env.OPENROUTER_APP_NAME;
  if (siteUrl) headers["HTTP-Referer"] = siteUrl;
  if (appName) headers["X-Title"] = appName;
  return headers;
}

/** Emit a fixed string token-by-token (used for the offline / fallback path). */
export async function emitText(
  controller: ReadableStreamDefaultController<Uint8Array>,
  parts: string[],
  text: string,
): Promise<void> {
  for (const tok of text.split(/(\s+)/)) {
    controller.enqueue(encoder.encode(tok));
    parts.push(tok);
    await new Promise((r) => setTimeout(r, 8));
  }
}

/** Stream one OpenRouter model's reply into `controller`, token by token. */
export async function streamOpenRouterModel(
  controller: ReadableStreamDefaultController<Uint8Array>,
  parts: string[],
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  system: string,
): Promise<void> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: openRouterHeaders(apiKey),
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0.5,
      stream: true,
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`OpenRouter request failed for ${model}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let receivedText = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      const data = trimmed.slice(6);
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
          error?: { message?: string };
        };
        if (parsed.error) throw new Error(parsed.error.message ?? "OpenRouter stream error");

        const text = parsed.choices?.[0]?.delta?.content;
        if (text) {
          receivedText = true;
          controller.enqueue(encoder.encode(text));
          parts.push(text);
        }
      } catch (err) {
        if (err instanceof SyntaxError) continue;
        throw err;
      }
    }
  }

  if (!receivedText) {
    throw new Error(`OpenRouter returned no content for ${model}`);
  }
}

/**
 * Run the standard primary→fallback→offline chain for a *streaming* chat
 * reply, writing tokens into `controller` as they arrive. `offlineText` is
 * whatever the feature's scripted fallback returns (kept feature-specific).
 */
export async function streamWithFallbackChain(
  controller: ReadableStreamDefaultController<Uint8Array>,
  parts: string[],
  messages: ChatMessage[],
  system: string,
  offlineText: string,
): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const primaryModel = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL;

  if (!apiKey) {
    await emitText(controller, parts, offlineText);
    return;
  }
  try {
    await streamOpenRouterModel(controller, parts, apiKey, primaryModel, messages, system);
  } catch {
    try {
      await streamOpenRouterModel(controller, parts, apiKey, fallbackModel, messages, system);
    } catch {
      await emitText(controller, parts, offlineText);
    }
  }
}

/**
 * Non-streaming completion that asks the model to return ONE line of raw
 * JSON (no markdown fences, no prose) matching a shape described in the
 * prompt, then hands the raw text back for the caller to parse + validate.
 * Used by the AI Parent Insights generator and the weekly-challenge
 * generator — both need a structured object, not a chat stream.
 *
 * Returns `null` (never throws) when no API key is configured, or when both
 * the primary and fallback models fail — callers are expected to fall back
 * to a deterministic, rule-based generator in that case, exactly like the
 * chat route falls back to `scriptedReply` when OpenRouter is unavailable.
 */
export async function completeJSON(system: string, user: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const primaryModel = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL;

  for (const model of [primaryModel, fallbackModel]) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: openRouterHeaders(apiKey),
        body: JSON.stringify({
          model,
          max_tokens: 500,
          temperature: 0.4,
          stream: false,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!response.ok) continue;

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) return content;
    } catch {
      // try the next model
    }
  }
  return null;
}
