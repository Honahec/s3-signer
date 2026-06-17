import { ARCHIVE_LAYOUTS, type ArchiveLayout } from "@/lib/archive-layout";
import { sanitizeZipEntryName } from "@/lib/zip-entry-name";

export function buildArchiveEntryNames(
  objectKeys: readonly string[],
  layout: ArchiveLayout
) {
  const usedNames = new Map<string, number>();

  return objectKeys.map((objectKey) =>
    uniqueEntryName(
      layout === ARCHIVE_LAYOUTS.flat
        ? basenameEntryName(objectKey)
        : sanitizeZipEntryName(objectKey),
      usedNames
    )
  );
}

function basenameEntryName(objectKey: string) {
  const sanitized = sanitizeZipEntryName(objectKey);
  const segments = sanitized.split("/");
  return segments[segments.length - 1] ?? sanitized;
}

function uniqueEntryName(name: string, usedNames: Map<string, number>) {
  const count = usedNames.get(name) ?? 0;
  usedNames.set(name, count + 1);
  if (count === 0) {
    return name;
  }

  const dotIndex = name.lastIndexOf(".");
  if (dotIndex <= 0) {
    return `${name}-${count + 1}`;
  }

  return `${name.slice(0, dotIndex)}-${count + 1}${name.slice(dotIndex)}`;
}
