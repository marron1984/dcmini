"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { parseLooseInt } from "@/lib/utils";
import { LEAD_STATUS_MAP, LEAD_CHANNELS } from "@/lib/constants";
import type { LeadStatus, RoomStatus, TourResult, LeadChannel, ResidentStatus } from "@/lib/types";

const CHANNEL_VALUES = LEAD_CHANNELS.map((c) => c.value) as string[];

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
  // 失注は理由の記録が必須のため、専用フロー（setLostReason）経由に限定する
  if (status === "lost") {
    return {
      ok: false,
      error: "失注にする場合は「失注登録」タブから理由を添えて登録してください",
    };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    // 失注から復帰する場合は失注理由・再アプローチ日をクリア（古い情報の残留防止）
    .update({
      status,
      status_changed_at: new Date().toISOString(),
      lost_reason: null,
      reapproach_date: null,
    })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  // ステータス変更を履歴に残す（変更先のラベル付きでタイムラインに表示される）
  const statusLabel = LEAD_STATUS_MAP[status]?.label ?? status;
  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    user_id: user.id,
    activity_type: "status_change",
    content: `ステータスを「${statusLabel}」に変更しました`,
  });
  await logAction("lead.status_change", { entity: "lead", entityId: leadId, detail: { status } });
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
  await logAction("lead.assign", { entity: "lead", entityId: leadId, detail: { userId } });
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
  await logAction("lead.referrer_change", { entity: "lead", entityId: leadId, detail: { referrerId } });
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true };
}

// 流入チャネル（集客経路）を設定（KPI集計の根拠）
export async function setLeadChannel(leadId: string, channel: LeadChannel | null) {
  await assertCanEdit();
  if (channel !== null && !CHANNEL_VALUES.includes(channel)) {
    return { ok: false, error: "不正なチャネルです" };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({ channel })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  await logAction("lead.channel_change", { entity: "lead", entityId: leadId, detail: { channel } });
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function updateLeadFields(leadId: string, formData: FormData) {
  await assertCanEdit();
  const supabase = createClient();

  const str = (k: string) => {
    const v = (formData.get(k) as string)?.trim();
    return v ? v : null;
  };
  const num = (k: string) => parseLooseInt(formData.get(k) as string);
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
  await logAction("lead.update", { entity: "lead", entityId: leadId });
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
  await logAction("lead.hearing_update", { entity: "lead", entityId: leadId });
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
      status_changed_at: new Date().toISOString(),
    })
    .eq("id", leadId);
  if (error) return { ok: false, error: error.message };
  await logAction("lead.lost", { entity: "lead", entityId: leadId, detail: { lostReason, reapproachDate } });
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
  await logAction("lead.proposal_add", { entity: "lead", entityId: leadId, detail: { facilityId } });
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
  const num = (k: string) => parseLooseInt(formData.get(k) as string);

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
  await logAction(id ? "facility.update" : "facility.create", { entity: "facility", entityId: id, detail: { name: record.name } });
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

  const num = (k: string) => parseLooseInt(formData.get(k) as string);
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
  await logAction(id ? "room.update" : "room.create", { entity: "room", entityId: id, detail: { facilityId, room: record.room_number, status: record.status } });
  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/facilities/${facilityId}`);
  return { ok: true };
}

export async function updateRoomStatus(roomId: string, status: RoomStatus) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase.from("rooms").update({ status }).eq("id", roomId);
  if (error) return { ok: false, error: error.message };
  await logAction("room.status_change", { entity: "room", entityId: roomId, detail: { status } });
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
  await logAction(id ? "tour.update" : "tour.create", { entity: "tour", entityId: id, detail: { leadId: record.lead_id } });
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
  await logAction(id ? "referrer.update" : "referrer.create", { entity: "referrer", entityId: id, detail: { name: record.name } });
  revalidatePath("/admin/referrers");
  if (id) revalidatePath(`/admin/referrers/${id}`);
  return { ok: true };
}

// ---- 入居者管理 ----
const RESIDENT_STATUS_VALUES: ResidentStatus[] = ["scheduled", "residing", "moved_out"];

export async function upsertResident(formData: FormData) {
  await assertCanEdit();
  const supabase = createClient();
  const id = (formData.get("id") as string) || null;

  const str = (k: string) => {
    const v = (formData.get(k) as string)?.trim();
    return v ? v : null;
  };
  const num = (k: string) => parseLooseInt(formData.get(k) as string);

  const status = (formData.get("status") as ResidentStatus) || "residing";

  const record = {
    name: str("name") ?? "",
    name_kana: str("name_kana"),
    age: num("age"),
    gender: str("gender"),
    care_level: str("care_level"),
    lead_id: str("lead_id"),
    facility_id: str("facility_id"),
    room_id: str("room_id"),
    status: RESIDENT_STATUS_VALUES.includes(status) ? status : "residing",
    admission_date: str("admission_date"),
    contract_date: str("contract_date"),
    move_out_date: str("move_out_date"),
    monthly_fee: num("monthly_fee"),
    guarantor: str("guarantor"),
    emergency_contact: str("emergency_contact"),
    note: str("note"),
  };

  if (!record.name) return { ok: false, error: "入居者名を入力してください" };

  if (id) {
    const { error } = await supabase.from("residents").update(record).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("residents").insert(record);
    if (error) return { ok: false, error: error.message };
  }
  await logAction(id ? "resident.update" : "resident.create", {
    entity: "resident",
    entityId: id,
    detail: { name: record.name, status: record.status },
  });
  revalidatePath("/admin/residents");
  if (id) revalidatePath(`/admin/residents/${id}`);
  return { ok: true };
}

export async function deleteResident(id: string) {
  await assertCanEdit();
  const supabase = createClient();
  // 締結済みの契約台帳がある入居者は削除不可（FKのcascadeで契約記録が消えるため）
  const { count } = await supabase
    .from("contracts")
    .select("id", { count: "exact", head: true })
    .eq("resident_id", id)
    .eq("status", "signed");
  if (count && count > 0) {
    return {
      ok: false,
      error: `締結済みの契約が${count}件あるため削除できません。先に契約を整理してください。`,
    };
  }
  const { error } = await supabase.from("residents").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logAction("resident.delete", { entity: "resident", entityId: id });
  revalidatePath("/admin/residents");
  return { ok: true };
}

// 案件（入居完了）から入居者レコードを作成。案件の入居予定者情報を引き継ぐ。
export async function createResidentFromLead(leadId: string) {
  await assertCanEdit();
  const supabase = createClient();

  // 既に同一案件由来の入居者がいれば、その編集画面へ誘導
  const { data: existing } = await supabase
    .from("residents")
    .select("id")
    .eq("lead_id", leadId)
    .maybeSingle();
  if (existing?.id) {
    return { ok: true, id: existing.id as string, existed: true };
  }

  const { data: lead } = await supabase
    .from("leads")
    .select(
      "id, resident_name, resident_age, resident_gender, care_level, has_guarantor, consultant_name, consultant_phone, desired_move_in_date, budget"
    )
    .eq("id", leadId)
    .single();
  if (!lead) return { ok: false, error: "案件が見つかりません" };

  const record = {
    lead_id: leadId,
    name: (lead.resident_name as string) || (lead.consultant_name as string) || "（未入力）",
    age: lead.resident_age ?? null,
    gender: lead.resident_gender ?? null,
    care_level: lead.care_level ?? null,
    status: "scheduled" as ResidentStatus,
    admission_date: null,
    monthly_fee: lead.budget ?? null,
    emergency_contact: lead.consultant_phone
      ? `${lead.consultant_name ?? ""} ${lead.consultant_phone}`.trim()
      : null,
    note: lead.desired_move_in_date ? `希望入居時期: ${lead.desired_move_in_date}` : null,
  };

  const { data: created, error } = await supabase
    .from("residents")
    .insert(record)
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  // 案件のタイムラインに変換の痕跡を残す
  const editor = await getCurrentUser();
  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    user_id: editor?.id ?? null,
    activity_type: "note",
    content: "入居者台帳に登録しました",
  });
  await logAction("resident.create_from_lead", {
    entity: "resident",
    entityId: created?.id,
    detail: { leadId },
  });
  revalidatePath("/admin/residents");
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true, id: created?.id as string, existed: false };
}

// ---- 契約管理台帳（メタデータ＋世代管理）----
const CONTRACT_TYPE_VALUES = ["residency", "renewal", "important_matters", "memorandum", "other"];
const CONTRACT_STATUS_VALUES = ["draft", "sent", "signed", "expired", "cancelled"];

export async function upsertContract(formData: FormData) {
  await assertCanEdit();
  const supabase = createClient();
  const id = (formData.get("id") as string) || null;
  const residentId = (formData.get("resident_id") as string) || null;

  const str = (k: string) => {
    const v = (formData.get(k) as string)?.trim();
    return v ? v : null;
  };
  const num = (k: string) => parseLooseInt(formData.get(k) as string);

  if (!residentId) return { ok: false, error: "入居者が指定されていません" };

  const contractType = (formData.get("contract_type") as string) || "residency";
  const status = (formData.get("status") as string) || "draft";

  const record = {
    resident_id: residentId,
    lead_id: str("lead_id"),
    contract_type: CONTRACT_TYPE_VALUES.includes(contractType) ? contractType : "residency",
    title: str("title"),
    template_version: str("template_version"),
    generation: num("generation") ?? 1,
    status: CONTRACT_STATUS_VALUES.includes(status) ? status : "draft",
    provider: str("provider") ?? "自社サインシステム",
    external_contract_id: str("external_contract_id"),
    document_url: str("document_url"),
    signed_at: str("signed_at"),
    effective_from: str("effective_from"),
    effective_to: str("effective_to"),
    amount: num("amount"),
    note: str("note"),
  };

  if (id) {
    const { error } = await supabase.from("contracts").update(record).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("contracts").insert(record);
    if (error) return { ok: false, error: error.message };
  }
  await logAction(id ? "contract.update" : "contract.create", {
    entity: "contract",
    entityId: id,
    detail: { residentId, type: record.contract_type, status: record.status },
  });
  revalidatePath(`/admin/residents/${residentId}`);
  return { ok: true };
}

export async function deleteContract(id: string, residentId: string) {
  await assertCanEdit();
  const supabase = createClient();
  const { error } = await supabase.from("contracts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logAction("contract.delete", { entity: "contract", entityId: id, detail: { residentId } });
  revalidatePath(`/admin/residents/${residentId}`);
  return { ok: true };
}

// 既存契約から次世代（更新契約）を作成。世代・期間・金額を引き継ぐ。
export async function createRenewalContract(contractId: string) {
  await assertCanEdit();
  const supabase = createClient();

  const { data: prev } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", contractId)
    .single();
  if (!prev) return { ok: false, error: "元の契約が見つかりません" };

  // 旧契約の満了日翌日を新契約の開始日に（同一期間を1年延長して提案）
  const nextFrom = prev.effective_to
    ? new Date(new Date(prev.effective_to).getTime() + 24 * 60 * 60 * 1000)
    : null;
  const nextTo = nextFrom
    ? new Date(nextFrom.getTime()).setFullYear(nextFrom.getFullYear() + 1)
    : null;

  const record = {
    resident_id: prev.resident_id,
    lead_id: prev.lead_id,
    contract_type: "renewal" as const,
    title: prev.title,
    template_version: prev.template_version,
    generation: (prev.generation ?? 1) + 1,
    renewal_of: prev.id,
    status: "draft" as const,
    provider: prev.provider,
    amount: prev.amount,
    effective_from: nextFrom ? nextFrom.toISOString().slice(0, 10) : null,
    effective_to: nextTo ? new Date(nextTo).toISOString().slice(0, 10) : null,
  };

  const { error } = await supabase.from("contracts").insert(record);
  if (error) return { ok: false, error: error.message };
  await logAction("contract.renew", {
    entity: "contract",
    entityId: contractId,
    detail: { residentId: prev.resident_id, generation: record.generation },
  });
  revalidatePath(`/admin/residents/${prev.resident_id}`);
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
  await logAction(id ? "ad_report.update" : "ad_report.create", { entity: "ad_report", entityId: id, detail: { date: record.date } });
  revalidatePath("/admin/ads");
  return { ok: true };
}

export async function deleteAdReport(id: string) {
  await assertCanManageAds();
  const supabase = createClient();
  const { error } = await supabase.from("ad_reports").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logAction("ad_report.delete", { entity: "ad_report", entityId: id });
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
  await logAction(id ? "lp.update" : "lp.create", { entity: "lp_page", entityId: id, detail: { slug, status: record.status } });
  revalidatePath("/admin/lp");
  revalidatePath(`/lp/${slug}`);
  return { ok: true };
}

export async function deleteLpPage(id: string) {
  await assertCanManageAds();
  const supabase = createClient();
  const { error } = await supabase.from("lp_pages").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logAction("lp.delete", { entity: "lp_page", entityId: id });
  revalidatePath("/admin/lp");
  return { ok: true };
}

// ---- SEO記事CMS（articles / 第2フェーズ）----
export async function upsertArticle(formData: FormData) {
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

  const status = (formData.get("status") as string) === "published" ? "published" : "draft";

  const record: Record<string, unknown> = {
    title: str("title") ?? "",
    slug,
    excerpt: str("excerpt"),
    body: str("body"),
    cover_image_url: str("cover_image_url"),
    category: str("category"),
    keywords: str("keywords"),
    status,
  };

  // 公開時に published_at を初回設定
  if (status === "published") {
    if (id) {
      const { data: existing } = await supabase
        .from("articles")
        .select("published_at")
        .eq("id", id)
        .single();
      if (!existing?.published_at) record.published_at = new Date().toISOString();
    } else {
      record.published_at = new Date().toISOString();
    }
  }

  if (id) {
    const { error } = await supabase.from("articles").update(record).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("articles").insert(record);
    if (error) {
      if (error.code === "23505") return { ok: false, error: "このスラッグは既に使われています" };
      return { ok: false, error: error.message };
    }
  }
  await logAction(id ? "article.update" : "article.create", { entity: "article", entityId: id, detail: { slug, status } });
  revalidatePath("/admin/articles");
  revalidatePath(`/column/${slug}`);
  revalidatePath("/column");
  return { ok: true };
}

export async function deleteArticle(id: string) {
  await assertCanManageAds();
  const supabase = createClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logAction("article.delete", { entity: "article", entityId: id });
  revalidatePath("/admin/articles");
  revalidatePath("/column");
  return { ok: true };
}

// ---- ユーザー管理（21. 権限管理 / admin専用）----
async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("権限がありません");
  }
  return user;
}

export async function updateUserRole(userId: string, role: string) {
  await assertAdmin();
  const allowed = ["admin", "consultant", "viewer", "ad_manager"];
  if (!allowed.includes(role)) return { ok: false, error: "不正な権限です" };
  const supabase = createClient();
  const { error } = await supabase.from("users").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  await logAction("user.role_change", { entity: "user", entityId: userId, detail: { role } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const admin = await assertAdmin();
  if (admin.id === userId && !isActive) {
    return { ok: false, error: "自分自身を無効化することはできません" };
  }
  const supabase = createClient();
  const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  await logAction("user.active_change", { entity: "user", entityId: userId, detail: { isActive } });
  revalidatePath("/admin/users");
  return { ok: true };
}

// ---- サイト設定 / 外部連携設定（6・3 / admin専用）----
export async function updateSiteSettings(formData: FormData) {
  await assertAdmin();
  const supabase = createClient();

  const keys = [
    "phone_number",
    "line_url",
    "business_hours",
    "ga_id",
    "gtm_id",
    "google_ads_id",
  ];

  const rows = keys.map((key) => ({
    key,
    value: ((formData.get(key) as string) ?? "").trim(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };

  await logAction("settings.update", { entity: "site_settings" });
  // 公開サイト全体に影響するため広くrevalidate
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true };
}
