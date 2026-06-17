import { describe, expect, it } from "vitest";
import { ARCHIVE_LAYOUTS } from "@/lib/archive-layout";
import { buildArchiveEntryNames } from "@/lib/archive-entry-names";

describe("archive layout", () => {
  it("preserves bucket folders by default", () => {
    expect(
      buildArchiveEntryNames(
        ["reports/a.txt", "images/b.txt"],
        ARCHIVE_LAYOUTS.preserve
      )
    ).toEqual(["reports/a.txt", "images/b.txt"]);
  });

  it("flattens archive entries to the top level", () => {
    expect(
      buildArchiveEntryNames(
        ["reports/a.txt", "images/a.txt", "reports/b.txt"],
        ARCHIVE_LAYOUTS.flat
      )
    ).toEqual(["a.txt", "a-2.txt", "b.txt"]);
  });
});
