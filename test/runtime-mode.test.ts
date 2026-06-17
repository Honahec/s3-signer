import { describe, expect, it } from "vitest";
import { getRuntimeMode, isDebugMode } from "@/lib/runtime-mode";

describe("runtime mode", () => {
  it("defaults to production", () => {
    expect(getRuntimeMode({ NODE_ENV: "development" })).toBe("production");
    expect(isDebugMode({ NODE_ENV: "development" })).toBe(false);
  });

  it("enables debug when requested", () => {
    expect(getRuntimeMode({ MODE: "debug", NODE_ENV: "production" })).toBe(
      "debug"
    );
    expect(isDebugMode({ MODE: "debug", NODE_ENV: "production" })).toBe(true);
  });
});
