import Anthropic from "@anthropic-ai/sdk";
import type { ParsedExpense } from "./types";

const MODEL = "claude-haiku-4-5-20251001";

const PROMPT = `You are reading a screenshot of an Apple Pay / Apple Wallet transaction history.
Extract every individual transaction you can see.
Respond with ONLY a JSON array, no prose, in this exact shape:
[{"merchant": string, "amount": number, "date": string}]
- "amount" is the transaction total as a positive number (no currency symbol).
- "date" is the transaction date as YYYY-MM-DD if visible, otherwise an empty string.
Ignore pending balances, totals, and anything that is not a single purchase.`;

/** Parse "Jun 1, 2026", "2026-06-01", etc. into YYYY-MM-DD, or null. */
function toISODate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a number or messy money string ("₪1,234.50") into a number, or NaN. */
function toAmount(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return NaN;
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  return cleaned === "" ? NaN : Number(cleaned);
}

/**
 * Normalise the (untrusted) model output into clean, valid expense rows.
 * Pure and defensive: tolerates wrapper objects, string amounts, bad dates,
 * and drops anything without a positive amount.
 */
export function normalizeParsedExpenses(raw: unknown): ParsedExpense[] {
  let list: unknown = raw;
  if (!Array.isArray(list) && raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    list = obj.expenses ?? obj.transactions ?? obj.items;
  }
  if (!Array.isArray(list)) return [];

  const result: ParsedExpense[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const amount = toAmount(e.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const merchantRaw = typeof e.merchant === "string" ? e.merchant.trim() : "";
    result.push({
      merchant: merchantRaw || "Unknown",
      amount: Math.round(amount * 100) / 100,
      date: toISODate(e.date),
    });
  }
  return result;
}

/** Send an image to Claude vision and return normalised expense rows. */
export async function parseScreenshot(
  base64Data: string,
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif",
  apiKey = process.env.ANTHROPIC_API_KEY
): Promise<ParsedExpense[]> {
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    return normalizeParsedExpenses(JSON.parse(jsonMatch[0]));
  } catch {
    return [];
  }
}
