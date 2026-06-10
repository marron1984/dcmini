"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// 管理画面のエラーバウンダリ
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h2 className="mt-4 text-lg font-bold text-ink">
        エラーが発生しました
      </h2>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        画面の読み込み中に問題が発生しました。時間をおいて再度お試しください。
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>再読み込み</Button>
        <a
          href="/admin"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 font-semibold text-ink hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700"
        >
          ダッシュボードへ
        </a>
      </div>
    </div>
  );
}
