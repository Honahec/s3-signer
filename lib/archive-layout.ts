export const ARCHIVE_LAYOUTS = {
  preserve: "preserve",
  flat: "flat",
} as const;

export type ArchiveLayout = (typeof ARCHIVE_LAYOUTS)[keyof typeof ARCHIVE_LAYOUTS];
