import pg from "pg";
import { describe, expect, it } from "vitest";
import { toJsonbParam } from "@/lib/db-json";

describe("jsonb database parameters", () => {
  it("encodes arrays as JSON instead of PostgreSQL array literals", () => {
    const objectKeys = [
      "uploads/2024/11/17/Yf31hpTJ_.山东省2025年普通高等学校招生考试信息平台 - 报名信息确认.pdf.qspace-replacing",
      "uploads/2024/12/03/4Y3ORwGh_高中语文文言文300实词 18虚词全总结.docx",
    ];

    const encoded = toJsonbParam(objectKeys);

    expect(encoded).toBe(JSON.stringify(objectKeys));
    expect(pg.types.getTypeParser(3802, "text")(encoded)).toEqual(objectKeys);
  });
});
