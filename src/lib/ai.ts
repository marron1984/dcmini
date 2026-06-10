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

// 単発の生成。固定の指示を system（先頭）に、案件ごとの可変情報を user に置く
// プレフィックスキャッシュ前提の構成。cache_control は system が最小キャッシュ長
// （Opus系は4096トークン）を超えた場合に効く。現状の短い指示では実質no-opだが、
// 指示を拡充した際に自動で効き始めるよう付与している。
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
