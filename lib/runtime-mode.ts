const DEFAULT_MODE = "production";

export type RuntimeMode = "debug" | "production";

export function getRuntimeMode(
  env: Readonly<Partial<NodeJS.ProcessEnv>> = process.env
): RuntimeMode {
  return env.MODE === "debug" ? "debug" : DEFAULT_MODE;
}

export function isDebugMode(
  env: Readonly<Partial<NodeJS.ProcessEnv>> = process.env
) {
  return getRuntimeMode(env) === "debug";
}
