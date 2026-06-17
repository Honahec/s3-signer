export const devBypassUser = {
  id: "local-dev",
  name: "Local Dev",
  email: "local-dev@s3-signer.local",
  groups: ["admins"],
} as const;

export function isDevAuthBypassEnabled(env: NodeJS.ProcessEnv = process.env) {
  return (
    env.NODE_ENV !== "production" && env.LOCAL_DEV_AUTH_BYPASS === "true"
  );
}

export function getDevBypassUser(env: NodeJS.ProcessEnv = process.env) {
  if (!isDevAuthBypassEnabled(env)) {
    return null;
  }

  return devBypassUser;
}
