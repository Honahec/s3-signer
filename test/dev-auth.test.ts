import { describe, expect, it } from "vitest";
import { getDevBypassUser, isDevAuthBypassEnabled } from "@/lib/dev-auth";

describe("dev auth bypass", () => {
  it("enables local bypass only when explicitly requested outside production", () => {
    const user = getDevBypassUser({
      LOCAL_DEV_AUTH_BYPASS: "true",
      NODE_ENV: "development",
    });

    expect(isDevAuthBypassEnabled({
      LOCAL_DEV_AUTH_BYPASS: "true",
      NODE_ENV: "development",
    })).toBe(true);
    expect(user?.id).toBe("local-dev");
    expect(user?.groups).toContain("admins");
  });

  it("keeps bypass disabled by default", () => {
    expect(getDevBypassUser({ NODE_ENV: "development" })).toBeNull();
  });

  it("never enables bypass in production", () => {
    expect(
      getDevBypassUser({
        LOCAL_DEV_AUTH_BYPASS: "true",
        NODE_ENV: "production",
      })
    ).toBeNull();
  });
});
