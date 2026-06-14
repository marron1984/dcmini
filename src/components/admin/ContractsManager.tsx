"use client";

import { useState, useTransition } from "react";
import { Plus, FileText, ExternalLink, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_MAP,
  CONTRACT_STATUSES,
  CONTRACT_STATUS_MAP,
} from "@/lib/constants";
import {
  upsertContract,
  deleteContract,
  createRenewalContract,
} from "@/app/admin/actions";
import { formatDate, formatYen, cn } from "@/lib/utils";
import type { Contract } from "@/lib/types";

export function ContractsManager({
  residentId,
  leadId,
  contracts,
}: {
  residentId: string;
  leadId: string | null;
  contracts: Contract[];
}) {
  // null=閉じている / "new"=新規 / Contract=編集中
  const [editing, setEditing] = useState<Contract | "new" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertContract(fd);
      if (res.ok) setEditing(null);
      else setError(res.error ?? "保存に失敗しました");
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      await deleteContract(id, residentId);
    });
  }

  function onRenew(id: string) {
    startTransition(async () => {
      const res = await createRenewalContract(id);
      if (!res.ok) setError(res.error ?? "更新契約の作成に失敗しました");
    });
  }

  const c = editing && editing !== "new" ? editing : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          原本は電子契約システムを正とし、ここでは台帳として管理します。
        </p>
        {editing === null && (
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" />契約を追加
          </Button>
        )}
      </div>

      {editing !== null && (
        <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          {error && <p className="mb-2 text-sm font-semibold text-red-600">{error}</p>}
          <input type="hidden" name="resident_id" value={residentId} />
          {c && <input type="hidden" name="id" value={c.id} />}
          {(c?.lead_id ?? leadId) && (
            <input type="hidden" name="lead_id" value={c?.lead_id ?? leadId ?? ""} />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="契約種別" required>
              <Select name="contract_type" defaultValue={c?.contract_type ?? "residency"}>
                {CONTRACT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="ステータス" required>
              <Select name="status" defaultValue={c?.status ?? "draft"}>
                {CONTRACT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="世代（第N契約）">
              <Input name="generation" defaultValue={c?.generation != null ? String(c.generation) : "1"} inputMode="numeric" />
            </Field>
            <Field label="雛形バージョン">
              <Input name="template_version" defaultValue={c?.template_version ?? ""} placeholder="例: v2024.4" />
            </Field>
            <Field label="タイトル" className="sm:col-span-2">
              <Input name="title" defaultValue={c?.title ?? ""} placeholder="例: 入居契約書（サンライズ西淀川）" />
            </Field>
            <Field label="電子契約サービス">
              <Input name="provider" defaultValue={c?.provider ?? "自社サインシステム"} />
            </Field>
            <Field label="契約ID（電子契約側）">
              <Input name="external_contract_id" defaultValue={c?.external_contract_id ?? ""} />
            </Field>
            <Field label="原本リンク（締結済PDF等）" className="sm:col-span-2">
              <Input name="document_url" type="url" defaultValue={c?.document_url ?? ""} placeholder="https://..." />
            </Field>
            <Field label="締結日">
              <Input name="signed_at" type="date" defaultValue={c?.signed_at ?? ""} />
            </Field>
            <Field label="契約金額（円）">
              <Input name="amount" defaultValue={c?.amount != null ? String(c.amount) : ""} inputMode="numeric" />
            </Field>
            <Field label="契約開始日">
              <Input name="effective_from" type="date" defaultValue={c?.effective_from ?? ""} />
            </Field>
            <Field label="契約満了日">
              <Input name="effective_to" type="date" defaultValue={c?.effective_to ?? ""} />
            </Field>
            <Field label="メモ" className="sm:col-span-2">
              <Textarea name="note" rows={2} defaultValue={c?.note ?? ""} />
            </Field>
          </div>

          <div className="mt-3 flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "保存中..." : c ? "更新する" : "登録する"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { setEditing(null); setError(null); }}>
              キャンセル
            </Button>
          </div>
        </form>
      )}

      {contracts.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">
          契約がまだ登録されていません。
        </p>
      ) : (
        <ul className="space-y-3">
          {contracts.map((ct) => {
            const st = CONTRACT_STATUS_MAP[ct.status];
            return (
              <li key={ct.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">
                    第{ct.generation}契約
                  </span>
                  <span className="font-semibold text-ink">{CONTRACT_TYPE_MAP[ct.contract_type]}</span>
                  <span className={cn("inline-block rounded-full border px-2 py-0.5 text-xs font-semibold", st?.color)}>
                    {st?.label ?? ct.status}
                  </span>
                  {ct.template_version && (
                    <span className="text-xs text-ink-muted">雛形 {ct.template_version}</span>
                  )}
                </div>

                {ct.title && <p className="mt-1.5 text-sm text-ink">{ct.title}</p>}

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                  {(ct.effective_from || ct.effective_to) && (
                    <span>
                      期間 {ct.effective_from ? formatDate(ct.effective_from) : "—"} 〜 {ct.effective_to ? formatDate(ct.effective_to) : "—"}
                    </span>
                  )}
                  {ct.signed_at && <span>締結 {formatDate(ct.signed_at)}</span>}
                  {ct.amount != null && <span>金額 {formatYen(ct.amount)}</span>}
                  {ct.provider && <span>{ct.provider}</span>}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2.5 text-sm">
                  {ct.document_url ? (
                    <a
                      href={ct.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />原本を開く
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                      <FileText className="h-3.5 w-3.5" />原本リンク未登録
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => { setEditing(ct); setError(null); }}
                    className="inline-flex items-center gap-1 font-semibold text-ink-soft hover:text-ink"
                  >
                    <Pencil className="h-3.5 w-3.5" />編集
                  </button>
                  <button
                    type="button"
                    onClick={() => onRenew(ct.id)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1 font-semibold text-ink-soft hover:text-brand-700"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />更新契約を作成
                  </button>
                  <ConfirmDelete onConfirm={() => onDelete(ct.id)} disabled={isPending} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ConfirmDelete({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        <button type="button" onClick={onConfirm} disabled={disabled} className="font-semibold text-red-600 hover:underline">
          削除する
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="text-ink-muted hover:underline">
          取消
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 font-semibold text-slate-400 hover:text-red-600"
    >
      <Trash2 className="h-3.5 w-3.5" />削除
    </button>
  );
}
