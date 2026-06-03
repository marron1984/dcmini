"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { LeadStatus, RoomStatus, TourResult } from "@/lib/types";

// 編集権限チェック（admin / consultant のみ書き込み可）
async function assertCanEdit() {
  const user = await getCurrentUser();
  if (!user || !["admin", "consultant"].includes(user.role)) {
    throw new Error("権限がありません");
  }
  return user;
}

// 広告・LP管理の編集権限（admin / ad_manager）
async function assertCanManageAds() {
  const user = await getCurrentUser();
  if (!user || !["admin", "ad_manager"].includes(user.role)) {
    throw new Error("権限がありません");
  }
  return user;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---- 案件 ----
export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const user = await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  // ステータス変更を履歴に残す
  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    user_id: user.id,
    activity_type: "status_change",
    content: `ステータスを変更しました`,
  });
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function assignLead(leadId: string, userId: string | null) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ assigned_user_id: userId })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function assignReferrer(leadId: string, referrerId: string | null) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ referrer_id: referrerId })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true };
}

export async function updateLeadFields(leadId: string, formData: FormData) {
  await assertCanEdit();
  const supabase = createClient();

  const str = (k: string) => {
    const v = (formData.get(k) as string)?.trim();
    return v ? v : null;
  };
  const num = (k: string) => {
    const v = (formData.get(k) as string)?.trim();
    if (!v) return null;
    const n = Number(v.replace(/[^0-9]/g, ""));
    return Number.isNaN(n) ? null : n;
  };
  const bool = (k: string) => {
    const v = formData.get(k) as string;
    if (v === "yes") return true;
    if (v === "no") return false;
    return null;
  };

  const update = {
    consultant_name: str("consultant_name") ?? "",
    consultant_name_kana: str("consultant_name_kana"),
    consultant_phone: str("consultant_phone"),
    consultant_email: str("consultant_email"),
    relationship: str("relationship"),
    consultant_area: str("consultant_area"),
    resident_name: str("resident_name"),
    resident_age: num("resident_age"),
    resident_gender: str("resident_gender"),
    resident_current_area: str("resident_current_area"),
    care_level: str("care_level"),
    dementia_status: bool("dementia_status"),
    welfare_status: bool("welfare_status"),
    medical_needs: bool("medical_needs"),
    mental_illness: bool("mental_illness"),
    has_guarantor: bool("has_guarantor"),
    desired_move_in_date: str("desired_move_in_date"),
    budget: num("budget"),
    desired_area: str("desired_area"),
    note: str("note"),
  };

  const { error } = await supabase.from("leads").update(update).eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true };
}

export async function updateLeadHearing(leadId: string, hearing: Record<string, unknown>) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ hearing })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true };
}

export async function setLostReason(
  leadId: string,
  lostReason: string,
  reapproachDate: string | null
) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      status: "lost",
      lost_reason: lostReason,
      reapproach_date: reapproachDate,
    })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function addActivity(leadId: string, formData: FormData) {
  const user = await assertCanEdit();
  const supabase = createClient();
  const content = (formData.get("content") as string)?.trim();
  const activityType = (formData.get("activity_type") as string) || "note";
  const nextActionDate = (formData.get("next_action_date") as string) || null;
  if (!content) return { ok: false, error: "内容を入力してください" };
  const { error } = await supabase.from("lead_activities").insert({
    lead_id: leadId,
    user_id: user.id,
    activity_type: activityType,
    content,
    next_action_date: nextActionDate,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true };
}

export async function addProposal(leadId: string, facilityId: string, note: string) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase
    .from("lead_facility_proposals")
    .insert({ lead_id: leadId, facility_id: facilityId, note: note || null });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true };
}

// ---- 施設 ----
export async function upsertFacility(formData: FormData) {
  await assertCanEdit();
  const supabase = createClient();
  const id = (formData.get("id") as string) || null;

  const str = (k: string) => {
    const v = (formData.get(k) as string)?.trim();
    return v ? v : null;
  };
  const num = (k: string) => {
    const v = (formData.get(k) as string)?.trim();
    if (!v) return null;
    const n = Number(v.replace(/[^0-9]/g, ""));
    return Number.isNaN(n) ? null : n;
  };

  const record = {
    name: str("name") ?? "",
    type: str("type"),
    area: str("area"),
    address: str("address"),
    nearest_station: str("nearest_station"),
    capacity: num("capacity"),
    monthly_fee: num("monthly_fee"),
    initial_fee: num("initial_fee"),
    max_care_level: str("max_care_level"),
    accepts_dementia: formData.get("accepts_dementia") === "on",
    accepts_welfare: formData.get("accepts_welfare") === "on",
    end_of_life_care: formData.get("end_of_life_care") === "on",
    is_published: formData.get("is_published") === "on",
    medical_support: formData.getAll("medical_support").map(String),
    description: str("description"),
    note: str("note"),
  };

  if (!record.name) return { ok: false, error: "施設名を入力してください" };

  if (id) {
    const { error } = await supabase.from("facilities").update(record).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("facilities").insert(record);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/admin/facilities");
  if (id) revalidatePath(`/admin/facilities/${id}`);
  return { ok: true };
}

// ---- 部屋 ----
export async function upsertRoom(formData: FormData) {
  await assertCanEdit();
  const supabase = createClient();
  const id = (formData.get("id") as string) || null;
  const facilityId = formData.get("facility_id") as string;

  const num = (k: string) => {
    const v = (formData.get(k) as string)?.trim();
    if (!v) return null;
    const n = Number(v.replace(/[^0-9]/g, ""));
    return Number.isNaN(n) ? null : n;
  };
  const str = (k: string) => {
    const v = (formData.get(k) as string)?.trim();
    return v ? v : null;
  };

  const record = {
    facility_id: facilityId,
    room_number: str("room_number") ?? "",
    floor: num("floor"),
    rent: num("rent"),
    common_fee: num("common_fee"),
    meal_fee: num("meal_fee"),
    management_fee: num("management_fee"),
    status: (formData.get("status") as RoomStatus) || "vacant",
    note: str("note"),
  };

  if (!record.room_number) return { ok: false, error: "部屋番号を入力してください" };

  if (id) {
    const { error } = await supabase.from("rooms").update(record).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("rooms").insert(record);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/facilities/${facilityId}`);
  return { ok: true };
}

export async function updateRoomStatus(roomId: string, status: RoomStatus) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase.from("rooms").update({ status }).eq("id", roomId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/rooms");
  return { ok: true };
}

// ---- 見学 ----
export async function upsertTour(formData: FormData) {
  await assertCanEdit();
  const supabase = createClient();
  const id = (formData.get("id") as string) || null;

  const str = (k: string) => {
    const v = (formData.get(k) as string)?.trim();
    return v ? v : null;
  };

  const record = {
    lead_id: formData.get("lead_id") as string,
    facility_id: str("facility_id"),
    scheduled_at: str("scheduled_at"),
    staff_id: str("staff_id"),
    participants: str("participants"),
    meeting_place: str("meeting_place"),
    result: (formData.get("result") as TourResult) || "pending",
    next_action: str("next_action"),
    note: str("note"),
  };

  if (!record.lead_id) return { ok: false, error: "案件を選択してください" };

  if (id) {
    const { error } = await supabase.from("tours").update(record).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("tours").insert(record);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/admin/tours");
  if (record.lead_id) revalidatePath(`/admin/leads/${record.lead_id}`);
  return { ok: true };
}

// ---- 紹介元（16）----
export async function upsertReferrer(formData: FormData) {
  await assertCanEdit();
  const supabase = createClient();
  const id = (formData.get("id") as string) || null;

  const str = (k: string) => {
    const v = (formData.get(k) as string)?.trim();
    return v ? v : null;
  };

  const record = {
    type: (formData.get("type") as string) || "web",
    name: str("name") ?? "",
    contact_person: str("contact_person"),
    phone: str("phone"),
    email: str("email"),
    address: str("address"),
    note: str("note"),
    last_contacted_at: str("last_contacted_at"),
  };

  if (!record.name) return { ok: false, error: "紹介元名を入力してください" };

  if (id) {
    const { error } = await supabase.from("referrers").update(record).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("referrers").insert(record);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/admin/referrers");
  if (id) revalidatePath(`/admin/referrers/${id}`);
  return { ok: true };
}

// ---- 広告レポート（17）----
export async function upsertAdReport(formData: FormData) {
  await assertCanManageAds();
  const supabase = createClient();
  const id = (formData.get("id") as string) || null;

  const num = (k: string) => {
    const v = (formData.get(k) as string)?.trim();
    if (!v) return null;
    const n = Number(v.replace(/[^0-9.-]/g, ""));
    return Number.isNaN(n) ? null : Math.round(n);
  };
  const str = (k: string) => {
    const v = (formData.get(k) as string)?.trim();
    return v ? v : null;
  };

  const record = {
    date: str("date") ?? new Date().toISOString().slice(0, 10),
    campaign_name: str("campaign_name"),
    ad_group_name: str("ad_group_name"),
    keyword: str("keyword"),
    cost: num("cost"),
    impressions: num("impressions"),
    clicks: num("clicks"),
    conversions: num("conversions"),
    tours: num("tours"),
    move_ins: num("move_ins"),
  };

  if (id) {
    const { error } = await supabase.from("ad_reports").update(record).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("ad_reports").insert(record);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/admin/ads");
  return { ok: true };
}

export async function deleteAdReport(id: string) {
  await assertCanManageAds();
  const supabase = createClient();
  const { error } = await supabase.from("ad_reports").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/ads");
  return { ok: true };
}

// ---- ランディングページ（LP CMS / 第2フェーズ）----
export async function upsertLpPage(formData: FormData) {
  await assertCanManageAds();
  const supabase = createClient();
  const id = (formData.get("id") as string) || null;

  const str = (k: string) => {
    const v = (formData.get(k) as string)?.trim();
    return v ? v : null;
  };

  const slug = (str("slug") ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!str("title")) return { ok: false, error: "タイトルを入力してください" };
  if (!slug) return { ok: false, error: "URLスラッグを入力してください（半角英数字）" };

  // FAQはJSON文字列で受け取る
  let faq: { q: string; a: string }[] = [];
  try {
    const raw = formData.get("faq") as string;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        faq = parsed
          .filter((f) => f && (f.q || f.a))
          .map((f) => ({ q: String(f.q ?? ""), a: String(f.a ?? "") }));
      }
    }
  } catch {
    faq = [];
  }

  const record = {
    title: str("title") ?? "",
    slug,
    target_keyword: str("target_keyword"),
    hero_copy: str("hero_copy"),
    target_audience: str("target_audience"),
    problems: str("problems"),
    body: str("body"),
    faq,
    status: (formData.get("status") as string) === "published" ? "published" : "draft",
  };

  if (id) {
    const { error } = await supabase.from("lp_pages").update(record).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("lp_pages").insert(record);
    if (error) {
      if (error.code === "23505") return { ok: false, error: "このスラッグは既に使われています" };
      return { ok: false, error: error.message };
    }
  }
  revalidatePath("/admin/lp");
  revalidatePath(`/lp/${slug}`);
  return { ok: true };
}

export async function deleteLpPage(id: string) {
  await assertCanManageAds();
  const supabase = createClient();
  const { error } = await supabase.from("lp_pages").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/lp");
  return { ok: true };
}
