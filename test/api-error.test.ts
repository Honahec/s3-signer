import { afterEach, describe, expect, it } from "vitest";
import { jsonError } from "@/lib/api";

const originalMode = process.env.MODE;

describe("api errors", () => {
  afterEach(() => {
    process.env.MODE = originalMode;
  });

  it("hides internal error details by default", async () => {
    process.env.MODE = "production";

    const response = jsonError(new Error("database exploded"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ message: "Internal server error" });
  });

  it("includes internal error details in debug mode", async () => {
    process.env.MODE = "debug";

    const response = jsonError(new Error("[archives:archive-create] NoSuchKey"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe("Internal server error");
    expect(body.error.message).toBe("[archives:archive-create] NoSuchKey");
  });
});
