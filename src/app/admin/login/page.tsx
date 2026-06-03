import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: "ログイン",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white">
            DC
          </span>
          <h1 className="mt-4 text-xl font-bold text-ink">{SITE_NAME}</h1>
          <p className="mt-1 text-sm text-ink-muted">管理画面ログイン</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-ink-muted">
          社内スタッフ専用の画面です。
        </p>
      </div>
    </div>
  );
}
