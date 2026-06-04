"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  DoorOpen,
  CalendarCheck,
  Handshake,
  Megaphone,
  FileText,
  Newspaper,
  ScrollText,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_NAME, USER_ROLE_MAP } from "@/lib/constants";
import { canAccess, type Section } from "@/lib/permissions";
import type { AppUser } from "@/lib/types";
import { signOut } from "@/app/admin/actions";

const NAV: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  section: Section;
  exact?: boolean;
}[] = [
  { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard, section: "dashboard", exact: true },
  { href: "/admin/leads", label: "案件管理", icon: Users, section: "leads" },
  { href: "/admin/facilities", label: "施設管理", icon: Building2, section: "facilities" },
  { href: "/admin/rooms", label: "部屋・空室管理", icon: DoorOpen, section: "rooms" },
  { href: "/admin/tours", label: "見学管理", icon: CalendarCheck, section: "tours" },
  { href: "/admin/referrers", label: "紹介元管理", icon: Handshake, section: "referrers" },
  { href: "/admin/ads", label: "広告管理", icon: Megaphone, section: "ads" },
  { href: "/admin/lp", label: "LP管理", icon: FileText, section: "lp" },
  { href: "/admin/articles", label: "記事CMS", icon: Newspaper, section: "articles" },
  { href: "/admin/users", label: "ユーザー管理", icon: UserCog, section: "users" },
  { href: "/admin/settings", label: "連携設定", icon: Settings, section: "settings" },
  { href: "/admin/logs", label: "操作ログ", icon: ScrollText, section: "logs" },
];

export function Sidebar({ user }: { user: AppUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // ロールに応じて表示するナビを絞り込み（21. 権限管理）
  const navItems = NAV.filter((item) => canAccess(user.role, item.section));

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
      {navItems.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-all duration-150",
              active
                ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lift"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            )}
          >
            {active && (
              <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent-400" />
            )}
            <item.icon
              className={cn(
                "h-5 w-5 shrink-0 transition-transform",
                active ? "scale-105" : "text-slate-400 group-hover:text-white"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* モバイルヘッダー */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <span className="font-bold text-ink">{SITE_NAME}</span>
        <button
          onClick={() => setOpen(true)}
          aria-label="メニューを開く"
          aria-expanded={open}
          aria-controls="admin-sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* オーバーレイ */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        id="admin-sidebar"
        aria-label="管理メニュー"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-slate-900 to-slate-800 py-5 shadow-xl transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 pb-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-soft">
              DC
            </span>
            <span className="text-sm font-bold tracking-tight text-white">{SITE_NAME}</span>
          </Link>
          <button
            className="text-slate-300 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {nav}

        <div className="mt-auto mx-3 mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-500 text-xs font-bold text-white">
              {user.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="text-xs text-slate-400">{USER_ROLE_MAP[user.role]}</p>
            </div>
          </div>
          <form action={signOut} className="mt-3">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-1 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              ログアウト
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
