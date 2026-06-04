import { describe, it, expect } from "vitest";
import { csvCell, ynLabel, buildCsv } from "@/lib/csv";

describe("csvCell", () => {
  it("空値は空文字を返す", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("通常の文字列・数値はそのまま", () => {
    expect(csvCell("山田")).toBe("山田");
    expect(csvCell(1200)).toBe("1200");
  });

  it("カンマ・改行・引用符を含む場合はクォートしエスケープする", () => {
    expect(csvCell("大阪, 西淀川")).toBe('"大阪, 西淀川"');
    expect(csvCell('彼は"是非"と言った')).toBe('"彼は""是非""と言った"');
    expect(csvCell("一行目\n二行目")).toBe('"一行目\n二行目"');
  });
});

describe("ynLabel", () => {
  it("true/false/未設定を日本語化する", () => {
    expect(ynLabel(true)).toBe("あり");
    expect(ynLabel(false)).toBe("なし");
    expect(ynLabel(null)).toBe("");
    expect(ynLabel(undefined)).toBe("");
  });
});

describe("buildCsv", () => {
  it("BOM付きでヘッダと行をCRLF結合する", () => {
    const csv = buildCsv(["氏名", "電話"], [["山田", "09012345678"]]);
    expect(csv.startsWith("﻿")).toBe(true);
    const withoutBom = csv.slice(1);
    expect(withoutBom).toBe("氏名,電話\r\n山田,09012345678");
  });

  it("セル内のカンマを正しくクォートする", () => {
    const csv = buildCsv(["a"], [["x,y"]]).slice(1);
    expect(csv).toBe('a\r\n"x,y"');
  });
});
