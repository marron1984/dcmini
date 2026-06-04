import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// =============================================================
// 20. AI機能（Anthropic Claude）— サーバー専用
// ANTHROPIC_API_KEY が無い場合は無効化（isAiEnabled で判定）。
// 鍵はクライアントへ渡さない（NEXT_PUBLIC_ 接頭辞は付けない）。
// =============================================================

const MODEL = "claude-opus-4-8";

export function isAiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic(); // ANTHROPIC_API_KEY を環境から解決
  return client;
}

// 単発の生成。system は固定の指示（プロンプトキャッシュ対象）、
// user に案件ごとの可変情報を置く（プレフィックスキャッシュを効かせる設計）。
export async function generate(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    thinking: { type: "adaptive" },
    system: [
      { type: "text", text: opts.system, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: opts.user }],
  });

  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
