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
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_NAME, USER_ROLE_MAP } from "@/lib/constants";
import type { AppUser } from "@/lib/types";
import { signOut } from "@/app/admin/actions";

const NAV = [
  { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard, exact: true },
  { href: "/admin/leads", label: "案件管理", icon: Users },
  { href: "/admin/facilities", label: "施設管理", icon: Building2 },
  { href: "/admin/rooms", label: "部屋・空室管理", icon: DoorOpen },
  { href: "/admin/tours", label: "見学管理", icon: CalendarCheck },
  { href: "/admin/referrers", label: "紹介元管理", icon: Handshake },
  { href: "/admin/ads", label: "広告管理", icon: Megaphone },
];

export function Sidebar({ user }: { user: AppUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold transition-colors",
              active
                ? "bg-brand-600 text-white"
                : "text-slate-200 hover:bg-slate-700/60"
            )}
          >
            <item.icon className="h-5 w-5" />
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
        <button onClick={() => setOpen(true)} aria-label="メニュー">
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
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-800 py-5 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 pb-5">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              DC
            </span>
            <span className="text-sm font-bold text-white">{SITE_NAME}</span>
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

        <div className="mt-auto border-t border-slate-700 px-5 pt-4">
          <p className="text-sm font-semibold text-white">{user.name}</p>
          <p className="text-xs text-slate-400">{USER_ROLE_MAP[user.role]}</p>
          <form action={signOut} className="mt-3">
            <button
              type="submit"
              className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
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
