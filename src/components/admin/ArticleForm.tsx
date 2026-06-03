"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { upsertArticle } from "@/app/admin/actions";
import type { Article } from "@/lib/types";

export function ArticleForm({ article }: { article?: Article }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertArticle(fd);
      if (res.ok) router.push("/admin/articles");
      else setError(res.error ?? "保存に失敗しました");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {article && <input type="hidden" name="id" value={article.id} />}

      <Field label="タイトル" required>
        <Input name="title" defaultValue={article?.title ?? ""} required placeholder="老人ホームの費用相場を分かりやすく解説" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="URLスラッグ" required>
          <Input name="slug" defaultValue={article?.slug ?? ""} required placeholder="cost-guide" />
        </Field>
        <Field label="公開状態">
          <Select name="status" defaultValue={article?.status ?? "draft"}>
            <option value="draft">下書き</option>
            <option value="published">公開</option>
          </Select>
        </Field>
        <Field label="カテゴリ">
          <Input name="category" defaultValue={article?.category ?? ""} placeholder="費用 / 認知症 / 手続き など" />
        </Field>
        <Field label="想定検索キーワード">
          <Input name="keywords" defaultValue={article?.keywords ?? ""} placeholder="老人ホーム 費用 相場" />
        </Field>
        <Field label="アイキャッチ画像URL" className="sm:col-span-2">
          <Input name="cover_image_url" defaultValue={article?.cover_image_url ?? ""} placeholder="https://..." />
        </Field>
      </div>

      <Field label="抜粋（一覧・meta description）">
        <Textarea name="excerpt" rows={2} defaultValue={article?.excerpt ?? ""} placeholder="記事の概要を120文字程度で" />
      </Field>

      <Field label="本文">
        <Textarea name="body" rows={16} defaultValue={article?.body ?? ""} placeholder="本文を入力してください。空行で段落が分かれます。" />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : article ? "更新する" : "作成する"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
