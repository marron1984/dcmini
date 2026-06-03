import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { Sidebar } from "@/components/admin/Sidebar";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications } from "@/lib/data/admin";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

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
