import { randomUUID } from "node:crypto";

export function sanitizeZipEntryName(name: string) {
  const cleaned = name
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");

  return cleaned || `object-${randomUUID()}`;
}
