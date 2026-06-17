import { describe, expect, it } from "vitest";
import { getDevBypassUser, isDevAuthBypassEnabled } from "@/lib/dev-auth";

describe("dev auth bypass", () => {
  it("enables local bypass only when explicitly requested on localhost", () => {
    const user = getDevBypassUser({
      AUTH_URL: "http://localhost:3000",
      LOCAL_DEV_AUTH_BYPASS: "true",
      NODE_ENV: "development",
    });

    expect(isDevAuthBypassEnabled({
      AUTH_URL: "http://localhost:3000",
      LOCAL_DEV_AUTH_BYPASS: "true",
      NODE_ENV: "development",
    })).toBe(true);
    expect(user?.id).toBe("local-dev");
    expect(user?.groups).toContain("admins");
  });

  it("keeps bypass disabled by default", () => {
    expect(
      getDevBypassUser({
        AUTH_URL: "http://localhost:3000",
        NODE_ENV: "development",
      })
    ).toBeNull();
  });

  it("allows local production-mode startup when explicitly requested", () => {
    const user = getDevBypassUser({
      AUTH_URL: "http://127.0.0.1:3000",
      LOCAL_DEV_AUTH_BYPASS: "true",
      NODE_ENV: "production",
    });

    expect(user?.id).toBe("local-dev");
  });

  it("keeps bypass disabled while building production output", () => {
    expect(
      getDevBypassUser({
        AUTH_URL: "http://127.0.0.1:3000",
        LOCAL_DEV_AUTH_BYPASS: "true",
        NEXT_PHASE: "phase-production-build",
        NODE_ENV: "production",
      })
    ).toBeNull();
  });

  it("never enables bypass on non-local app URLs", () => {
    expect(
      getDevBypassUser({
        AUTH_URL: "https://gurl.honahec.cc",
        LOCAL_DEV_AUTH_BYPASS: "true",
        NODE_ENV: "production",
      })
    ).toBeNull();
  });
});
