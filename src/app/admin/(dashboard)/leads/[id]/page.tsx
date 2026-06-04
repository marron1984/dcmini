import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { LeadStatusBadge } from "@/components/admin/StatusBadge";
import { StatusAssignBar } from "@/components/admin/leads/StatusAssignBar";
import { LeadEditForm } from "@/components/admin/leads/LeadEditForm";
import { HearingForm } from "@/components/admin/leads/HearingForm";
import { ActivityForm } from "@/components/admin/leads/ActivityForm";
import { ProposalForm } from "@/components/admin/leads/ProposalForm";
import { LostReasonForm } from "@/components/admin/leads/LostReasonForm";
import { TourForm } from "@/components/admin/TourForm";
import { TourResultBadge } from "@/components/admin/StatusBadge";
import { ReferrerSelect } from "@/components/admin/leads/ReferrerSelect";
import { MatchList } from "@/components/admin/leads/MatchList";
import { matchFacilities, scoreColor } from "@/lib/matching";
import {
  getLead,
  getLeadActivities,
  getLeadProposals,
  getLeadTours,
  getStaffUsers,
  getFacilities,
  getReferrers,
} from "@/lib/data/admin";
import { ACTIVITY_TYPE_MAP } from "@/lib/constants";
import { formatDate, formatDateTime, formatYen } from "@/lib/utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <span className="shrink-0 text-sm text-ink-muted">{label}</span>
      <span className="text-right text-sm font-semibold text-ink">{value || "—"}</span>
    </div>
  );
}

const yn = (v: boolean | null) => (v === true ? "あり" : v === false ? "なし" : "—");

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const lead = await getLead(params.id);
  if (!lead) notFound();

  const [activities, proposals, tours, staff, facilities, referrers] = await Promise.all([
    getLeadActivities(params.id),
    getLeadProposals(params.id),
    getLeadTours(params.id),
    getStaffUsers(),
    getFacilities(),
    getReferrers(),
  ]);

  const facilityOptions = facilities.map((f) => ({ id: f.id, name: f.name }));

  // 施設マッチング（ルールベース・上位8件）
  const matches = matchFacilities(lead, facilities)
    .slice(0, 8)
    .map((m) => ({
      facilityId: m.facility.id,
      facilityName: m.facility.name,
      type: m.facility.type,
      area: m.facility.area,
      monthlyFee: m.facility.monthly_fee,
      score: m.score,
      scoreColor: scoreColor(m.score),
      reasons: m.reasons.map((r) => ({ label: r.label, ok: r.ok })),
    }));

  return (
    <>
      <Link href="/admin/leads" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> 案件一覧へ戻る
      </Link>

      <PageHeader
        title={lead.consultant_name}
        description={`相談者 / 登録日 ${formatDate(lead.created_at)}`}
        action={<LeadStatusBadge status={lead.status} />}
      />

      <Card className="mb-6">
        <CardContent>
          <StatusAssignBar
            leadId={lead.id}
            status={lead.status}
            assignedUserId={lead.assigned_user_id}
            staff={staff}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左: サマリー */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>相談者情報</CardTitle></CardHeader>
            <CardContent>
              <Row label="お名前" value={lead.consultant_name} />
              <Row label="フリガナ" value={lead.consultant_name_kana} />
              <Row label="電話" value={lead.consultant_phone && (
                <a href={`tel:${lead.consultant_phone}`} className="flex items-center gap-1 text-brand-700">
                  <Phone className="h-3.5 w-3.5" />{lead.consultant_phone}
                </a>
              )} />
              <Row label="メール" value={lead.consultant_email && (
                <a href={`mailto:${lead.consultant_email}`} className="flex items-center gap-1 text-brand-700">
                  <Mail className="h-3.5 w-3.5" />{lead.consultant_email}
                </a>
              )} />
              <Row label="続柄" value={lead.relationship} />
              <Row label="相談地域" value={lead.consultant_area} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>入居予定者情報</CardTitle></CardHeader>
            <CardContent>
              <Row label="お名前" value={lead.resident_name} />
              <Row label="年齢" value={lead.resident_age ? `${lead.resident_age}歳` : null} />
              <Row label="性別" value={lead.resident_gender} />
              <Row label="現在の居住地" value={lead.resident_current_area} />
              <Row label="要介護度" value={lead.care_level} />
              <Row label="認知症" value={yn(lead.dementia_status)} />
              <Row label="生活保護" value={yn(lead.welfare_status)} />
              <Row label="医療行為" value={yn(lead.medical_needs)} />
              <Row label="精神疾患" value={yn(lead.mental_illness)} />
              <Row label="身元保証人" value={yn(lead.has_guarantor)} />
              <Row label="希望入居時期" value={lead.desired_move_in_date} />
              <Row label="月額予算" value={formatYen(lead.budget)} />
              <Row label="希望地域" value={lead.desired_area} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-500" />流入元情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <ReferrerSelect
                  leadId={lead.id}
                  referrerId={lead.referrer_id}
                  referrers={referrers}
                />
              </div>
              <Row label="LP" value={lead.lp_name} />
              <Row label="utm_source" value={lead.utm_source} />
              <Row label="utm_medium" value={lead.utm_medium} />
              <Row label="utm_campaign" value={lead.utm_campaign} />
              <Row label="gclid" value={lead.gclid ? "あり" : null} />
            </CardContent>
          </Card>
        </div>

        {/* 右: タブ */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              <Tabs
                tabs={[
                  {
                    id: "activity",
                    label: "対応履歴",
                    content: (
                      <div className="space-y-6">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <ActivityForm leadId={lead.id} />
                        </div>
                        <ul className="space-y-3">
                          {activities.length === 0 && (
                            <li className="text-sm text-ink-muted">まだ履歴がありません。</li>
                          )}
                          {activities.map((a) => (
                            <li key={a.id} className="flex gap-3 border-b border-slate-100 pb-3 last:border-0">
                              <span className="mt-1 inline-flex h-fit shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                                {ACTIVITY_TYPE_MAP[a.activity_type]}
                              </span>
                              <div className="flex-1">
                                <p className="whitespace-pre-wrap text-sm text-ink">{a.content}</p>
                                <p className="mt-1 text-xs text-ink-muted">
                                  {a.user?.name ?? "—"} ・ {formatDateTime(a.created_at)}
                                  {a.next_action_date && (
                                    <span className="ml-2 text-amber-600">次回: {formatDate(a.next_action_date)}</span>
                                  )}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ),
                  },
                  {
                    id: "hearing",
                    label: "ヒアリング",
                    content: <HearingForm leadId={lead.id} initial={lead.hearing} />,
                  },
                  {
                    id: "matching",
                    label: "施設マッチング",
                    content: <MatchList leadId={lead.id} matches={matches} />,
                  },
                  {
                    id: "edit",
                    label: "基本情報の編集",
                    content: <LeadEditForm lead={lead} />,
                  },
                  {
                    id: "proposals",
                    label: `施設提案 (${proposals.length})`,
                    content: (
                      <div className="space-y-5">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <ProposalForm leadId={lead.id} facilities={facilityOptions} />
                        </div>
                        <ul className="space-y-2">
                          {proposals.length === 0 && (
                            <li className="text-sm text-ink-muted">提案施設はまだありません。</li>
                          )}
                          {proposals.map((p) => (
                            <li key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                              <div>
                                <p className="font-semibold text-ink">{p.facility?.name ?? "—"}</p>
                                {p.note && <p className="text-xs text-ink-muted">{p.note}</p>}
                              </div>
                              <span className="text-sm font-semibold text-brand-700">
                                {formatYen(p.facility?.monthly_fee)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ),
                  },
                  {
                    id: "tours",
                    label: `見学 (${tours.length})`,
                    content: (
                      <div className="space-y-5">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <TourForm fixedLeadId={lead.id} facilities={facilityOptions} staff={staff} />
                        </div>
                        <ul className="space-y-2">
                          {tours.length === 0 && (
                            <li className="text-sm text-ink-muted">見学予定はありません。</li>
                          )}
                          {tours.map((t) => (
                            <li key={t.id} className="rounded-xl border border-slate-200 px-4 py-3">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-ink">{t.facility?.name ?? "施設未定"}</p>
                                <TourResultBadge result={t.result} />
                              </div>
                              <p className="mt-1 text-sm text-ink-soft">{formatDateTime(t.scheduled_at)}</p>
                              {t.note && <p className="mt-1 text-xs text-ink-muted">{t.note}</p>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ),
                  },
                  {
                    id: "lost",
                    label: "失注登録",
                    content: (
                      <div className="max-w-md">
                        <p className="mb-4 text-sm text-ink-soft">
                          失注理由と再アプローチ予定日を登録します。ステータスは「失注」になります。
                        </p>
                        <LostReasonForm
                          leadId={lead.id}
                          currentReason={lead.lost_reason}
                          currentReapproach={lead.reapproach_date}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
