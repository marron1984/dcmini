"use client";

import { useState, useTransition } from "react";
import { Sparkles, Copy, Check, FileText, Building2, HeartHandshake, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  aiSummarize,
  aiMatchingReasons,
  aiFamilyExplanation,
  aiCareManagerReport,
  type AiResult,
} from "@/app/admin/ai-actions";

const TASKS: { key: string; label: string; icon: typeof FileText; fn: (id: string) => Promise<AiResult> }[] = [
  { key: "summary", label: "相談内容を要約", icon: ClipboardList, fn: aiSummarize },
  { key: "matching", label: "施設選定のポイント", icon: Building2, fn: aiMatchingReasons },
  { key: "family", label: "家族向け説明文", icon: HeartHandshake, fn: aiFamilyExplanation },
  { key: "caremanager", label: "ケアマネ向け報告文", icon: FileText, fn: aiCareManagerReport },
];

export function AiAssist({ leadId, enabled }: { leadId: string; enabled: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function run(task: (typeof TASKS)[number]) {
    setError(null);
    setText("");
    setCopied(false);
    setActiveKey(task.key);
    startTransition(async () => {
      const res = await task.fn(leadId);
      if (res.ok) setText(res.text ?? "");
      else setError(res.error ?? "生成に失敗しました");
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-ink-soft">
        <Sparkles className="h-4 w-4 text-brand-500" />
        ヒアリング・対応履歴をもとに、AIが下書きを生成します。内容は必ず担当者がご確認ください。
      </div>

      {!enabled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          AI連携が未設定です。環境変数 <code>ANTHROPIC_API_KEY</code> を設定すると利用できます。
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TASKS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => run(t)}
            disabled={!enabled || isPending}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-sm font-semibold transition-all disabled:opacity-50",
              activeKey === t.key
                ? "border-brand-300 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-ink-soft hover:border-brand-200 hover:bg-brand-50/40"
            )}
          >
            <t.icon className="h-5 w-5" />
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {isPending && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink-muted">
          <Sparkles className="h-4 w-4 animate-pulse text-brand-500" />
          AIが生成しています…
        </div>
      )}

      {text && !isPending && (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-sm font-bold text-ink">生成結果（下書き）</span>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "コピーしました" : "コピー"}
            </button>
          </div>
          <p className="whitespace-pre-wrap px-4 py-4 text-sm leading-relaxed text-ink">{text}</p>
        </div>
      )}
    </div>
  );
}
