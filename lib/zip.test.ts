import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import {
  createStoredZipStream,
  sanitizeZipEntryName,
} from "@/lib/zip";

async function collect(stream: Readable) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

describe("zip", () => {
  it("streams a stored zip archive with sanitized entry names", async () => {
    const bytes = await collect(
      createStoredZipStream([
        {
          name: "../reports/a.txt",
          body: async () => Readable.from([Buffer.from("hello")]),
        },
        {
          name: "images\\b.txt",
          body: async () => Readable.from([Buffer.from("world")]),
        },
      ])
    );

    expect(bytes.subarray(0, 4).toString("binary")).toBe("PK\u0003\u0004");
    expect(bytes.includes(Buffer.from("hello"))).toBe(true);
    expect(bytes.includes(Buffer.from("world"))).toBe(true);
    expect(bytes.includes(Buffer.from("reports/a.txt"))).toBe(true);
    expect(bytes.includes(Buffer.from("images/b.txt"))).toBe(true);
    expect(bytes.subarray(bytes.length - 22, bytes.length - 18).toString("binary")).toBe(
      "PK\u0005\u0006"
    );
  });

  it("removes traversal segments from entry names", () => {
    expect(sanitizeZipEntryName("../a/./b.txt")).toBe("a/b.txt");
    expect(sanitizeZipEntryName("/tmp/../../c.txt")).toBe("tmp/c.txt");
  });
});
