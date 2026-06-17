export const devBypassUser = {
  id: "local-dev",
  name: "Local Dev",
  email: "local-dev@s3-signer.local",
  groups: ["admins"],
} as const;

export function isDevAuthBypassEnabled(env: NodeJS.ProcessEnv = process.env) {
  return (
    env.LOCAL_DEV_AUTH_BYPASS === "true" &&
    !isProductionBuild(env) &&
    hasLocalAppUrl(env)
  );
}

export function getDevBypassUser(env: NodeJS.ProcessEnv = process.env) {
  if (!isDevAuthBypassEnabled(env)) {
    return null;
  }

  return devBypassUser;
}

function hasLocalAppUrl(env: NodeJS.ProcessEnv) {
  const appUrl =
    env.AUTH_URL ?? env.NEXTAUTH_URL ?? env.PUBLIC_APP_URL ?? "http://localhost";

  try {
    const hostname = new URL(appUrl).hostname;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    );
  } catch {
    return false;
  }
}

function isProductionBuild(env: NodeJS.ProcessEnv) {
  return (
    env.NEXT_PHASE === "phase-production-build" ||
    env.npm_lifecycle_event === "build"
  );
}
