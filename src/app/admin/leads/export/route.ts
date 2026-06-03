import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLeads, type LeadFilters } from "@/lib/data/admin";
import { LEAD_STATUS_MAP } from "@/lib/constants";

// 第2フェーズ: 案件のCSV出力（一覧の絞り込み条件を引き継ぐ）
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const yn = (v: boolean | null) => (v === true ? "あり" : v === false ? "なし" : "");

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const sp = request.nextUrl.searchParams;
  const filters: LeadFilters = {
    q: sp.get("q") ?? undefined,
    status: sp.get("status") ?? undefined,
    assigned: sp.get("assigned") ?? undefined,
    care_level: sp.get("care_level") ?? undefined,
    welfare: sp.get("welfare") ?? undefined,
    dementia: sp.get("dementia") ?? undefined,
    area: sp.get("area") ?? undefined,
  };

  const leads = await getLeads(filters);

  const headers = [
    "登録日", "ステータス", "担当者", "相談者氏名", "フリガナ", "電話番号",
    "メール", "続柄", "相談地域", "入居予定者氏名", "年齢", "性別",
    "要介護度", "認知症", "生活保護", "医療行為", "精神疾患", "身元保証人",
    "希望入居時期", "月額予算", "希望地域", "流入元", "utm_source", "utm_campaign", "相談内容",
  ];

  const rows = leads.map((l) => [
    new Date(l.created_at).toLocaleString("ja-JP"),
    LEAD_STATUS_MAP[l.status]?.label ?? l.status,
    l.assigned_user?.name ?? "",
    l.consultant_name,
    l.consultant_name_kana,
    l.consultant_phone,
    l.consultant_email,
    l.relationship,
    l.consultant_area,
    l.resident_name,
    l.resident_age,
    l.resident_gender,
    l.care_level,
    yn(l.dementia_status),
    yn(l.welfare_status),
    yn(l.medical_needs),
    yn(l.mental_illness),
    yn(l.has_guarantor),
    l.desired_move_in_date,
    l.budget,
    l.desired_area,
    l.lp_name,
    l.utm_source,
    l.utm_campaign,
    l.note,
  ]);

  const body =
    "﻿" + // Excel向けBOM
    [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");

  const filename = `leads_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
