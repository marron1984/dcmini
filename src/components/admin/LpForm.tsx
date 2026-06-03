"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { upsertLpPage } from "@/app/admin/actions";
import type { LpPage, LpFaqItem } from "@/lib/types";

export function LpForm({ lp }: { lp?: LpPage }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [faq, setFaq] = useState<LpFaqItem[]>(lp?.faq ?? []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("faq", JSON.stringify(faq.filter((f) => f.q || f.a)));
    startTransition(async () => {
      const res = await upsertLpPage(fd);
      if (res.ok) router.push("/admin/lp");
      else setError(res.error ?? "保存に失敗しました");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {lp && <input type="hidden" name="id" value={lp.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="タイトル" required className="sm:col-span-2">
          <Input name="title" defaultValue={lp?.title ?? ""} required placeholder="認知症の方の入居相談｜大阪" />
        </Field>
        <Field label="URLスラッグ" required>
          <Input name="slug" defaultValue={lp?.slug ?? ""} required placeholder="dementia-osaka" />
        </Field>
        <Field label="ターゲットキーワード">
          <Input name="target_keyword" defaultValue={lp?.target_keyword ?? ""} placeholder="認知症 老人ホーム 大阪" />
        </Field>
        <Field label="公開状態">
          <Select name="status" defaultValue={lp?.status ?? "draft"}>
            <option value="draft">下書き</option>
            <option value="published">公開</option>
          </Select>
        </Field>
      </div>

      <Field label="キャッチコピー（ファーストビュー）">
        <Textarea name="hero_copy" rows={2} defaultValue={lp?.hero_copy ?? ""} placeholder="認知症が進み、自宅での介護が難しくなった方へ" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="対象者">
          <Textarea name="target_audience" rows={4} defaultValue={lp?.target_audience ?? ""} placeholder="改行区切りで入力&#10;認知症の診断を受けている&#10;徘徊・昼夜逆転がある" />
        </Field>
        <Field label="解決できる悩み">
          <Textarea name="problems" rows={4} defaultValue={lp?.problems ?? ""} placeholder="改行区切りで入力&#10;認知症対応可の施設をご紹介&#10;ご家族の負担を軽減" />
        </Field>
      </div>
      <Field label="本文">
        <Textarea name="body" rows={6} defaultValue={lp?.body ?? ""} placeholder="LPの説明文（任意）" />
      </Field>

      {/* FAQ 動的編集 */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-soft">よくある質問</p>
          <Button type="button" size="sm" variant="outline" onClick={() => setFaq([...faq, { q: "", a: "" }])}>
            <Plus className="h-4 w-4" />追加
          </Button>
        </div>
        <div className="space-y-3">
          {faq.length === 0 && <p className="text-sm text-ink-muted">FAQはまだありません。</p>}
          {faq.map((item, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    value={item.q}
                    onChange={(e) => {
                      const next = [...faq];
                      next[i] = { ...next[i], q: e.target.value };
                      setFaq(next);
                    }}
                    placeholder="質問"
                  />
                  <Textarea
                    rows={2}
                    value={item.a}
                    onChange={(e) => {
                      const next = [...faq];
                      next[i] = { ...next[i], a: e.target.value };
                      setFaq(next);
                    }}
                    placeholder="回答"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFaq(faq.filter((_, idx) => idx !== i))}
                  className="mt-2 text-slate-400 hover:text-red-600"
                  aria-label="削除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : lp ? "更新する" : "作成する"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
