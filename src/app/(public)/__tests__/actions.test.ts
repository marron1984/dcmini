import { describe, it, expect, vi, beforeEach } from "vitest";

// Supabase admin クライアントをモック（insert呼び出しとpayloadを捕捉）
const insertMock = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({ insert: insertMock }),
  }),
}));

import { submitContact } from "@/app/(public)/actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  insertMock.mockReset();
  insertMock.mockResolvedValue({ error: null });
});

describe("submitContact", () => {
  it("ハニーポットに値があればinsertせず成功を返す（静かに破棄）", async () => {
    const res = await submitContact(form({ company: "bot", consultant_name: "X" }));
    expect(res.ok).toBe(true);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("氏名が空ならバリデーションエラー", async () => {
    const res = await submitContact(form({ consultant_phone: "09012345678" }));
    expect(res.ok).toBe(false);
    expect(res.error).toContain("お名前");
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("電話もメールも無ければエラー", async () => {
    const res = await submitContact(form({ consultant_name: "山田太郎" }));
    expect(res.ok).toBe(false);
    expect(res.error).toContain("電話番号またはメール");
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("正常時はleadsへ正しく変換したpayloadをinsertする", async () => {
    const res = await submitContact(
      form({
        consultant_name: "山田太郎",
        consultant_phone: "09012345678",
        resident_age: "85歳",
        budget: "130,000円",
        dementia_status: "yes",
        welfare_status: "no",
        medical_needs: "",
        lp_name: "認知症LP",
        utm_source: "google",
      })
    );
    expect(res.ok).toBe(true);
    expect(insertMock).toHaveBeenCalledTimes(1);
    const payload = insertMock.mock.calls[0][0];
    expect(payload.status).toBe("new");
    expect(payload.consultant_name).toBe("山田太郎");
    expect(payload.resident_age).toBe(85); // 全角単位を除去して数値化
    expect(payload.budget).toBe(130000); // カンマ・単位を除去
    expect(payload.dementia_status).toBe(true);
    expect(payload.welfare_status).toBe(false);
    expect(payload.medical_needs).toBeNull(); // 未選択はnull
    expect(payload.lp_name).toBe("認知症LP");
    expect(payload.utm_source).toBe("google");
  });

  it("氏名は100字・相談内容は2000字で上限が掛かる", async () => {
    const res = await submitContact(
      form({
        consultant_name: "あ".repeat(200),
        consultant_email: "a@example.com",
        note: "い".repeat(5000),
      })
    );
    expect(res.ok).toBe(true);
    const payload = insertMock.mock.calls[0][0];
    expect(payload.consultant_name).toHaveLength(100);
    expect(payload.note).toHaveLength(2000);
  });

  it("insertがエラーを返したら失敗を返す", async () => {
    insertMock.mockResolvedValue({ error: { message: "db error" } });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await submitContact(
      form({ consultant_name: "山田太郎", consultant_phone: "09012345678" })
    );
    expect(res.ok).toBe(false);
    expect(res.error).toContain("送信に失敗");
  });
});
