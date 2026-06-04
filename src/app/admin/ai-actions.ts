"use server";

import { getCurrentUser } from "@/lib/auth";
import { getLead, getLeadActivities } from "@/lib/data/admin";
import { isAiEnabled, generate } from "@/lib/ai";
import { buildLeadContext, AI_TASKS, type AiTaskKey } from "@/lib/ai-prompts";
import { logAction } from "@/lib/audit";

export interface AiResult {
  ok: boolean;
  text?: string;
  error?: string;
}

async function runTask(leadId: string, task: AiTaskKey): Promise<AiResult> {
  const user = await getCurrentUser();
  if (!user || !["admin", "consultant"].includes(user.role)) {
    return { ok: false, error: "権限がありません" };
  }
  if (!isAiEnabled()) {
    return {
      ok: false,
      error: "AI連携が未設定です。環境変数 ANTHROPIC_API_KEY を設定してください。",
    };
  }

  const lead = await getLead(leadId);
  if (!lead) return { ok: false, error: "案件が見つかりません" };

  const activities = await getLeadActivities(leadId);
  const context = buildLeadContext(lead, activities);
  const { system, instruction } = AI_TASKS[task];

  try {
    const text = await generate({ system, user: `${instruction}\n\n${context}` });
    await logAction(`ai.${task}`, { entity: "lead", entityId: leadId });
    if (!text) return { ok: false, error: "AIの応答が空でした。再度お試しください。" };
    return { ok: true, text };
  } catch (e) {
    console.error("AI generate error", e);
    return {
      ok: false,
      error: "AIの生成に失敗しました。時間をおいて再度お試しください。",
    };
  }
}

export async function aiSummarize(leadId: string): Promise<AiResult> {
  return runTask(leadId, "summary");
}
export async function aiMatchingReasons(leadId: string): Promise<AiResult> {
  return runTask(leadId, "matching");
}
export async function aiFamilyExplanation(leadId: string): Promise<AiResult> {
  return runTask(leadId, "family");
}
export async function aiCareManagerReport(leadId: string): Promise<AiResult> {
  return runTask(leadId, "caremanager");
}
