import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, ShieldAlert } from "lucide-react";
import { Sidebar } from "@/components/admin/Sidebar";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications } from "@/lib/data/admin";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/admin/actions";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    // セッション自体が無ければログインへ。
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) redirect("/admin/login");

    // セッションはあるが利用不可（無効化アカウント）→ ループ回避のため案内＋ログアウト
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
          <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-4 text-lg font-bold text-ink">アカウントが無効です</h1>
          <p className="mt-2 text-sm text-ink-muted">
            このアカウントは現在ご利用いただけません。管理者にお問い合わせください。
          </p>
          <form action={signOut} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700"
            >
              ログアウト
            </button>
          </form>
        </div>
      </div>
    );
  }

  const notifications = await getNotifications();
  const highCount = notifications.filter((n) => n.severity === "high").length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 lg:flex-row">
      <Sidebar user={user} />
      <div className="flex-1 overflow-x-hidden">
        {/* 上部バー（通知ベル） */}
        <div className="flex h-14 items-center justify-end border-b border-slate-200 bg-white px-4 sm:px-6">
          <Link
            href="/admin/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft hover:bg-slate-100"
            aria-label="通知"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span
                className={`absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
                  highCount > 0 ? "bg-red-500" : "bg-brand-500"
                }`}
              >
                {notifications.length}
              </span>
            )}
          </Link>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
