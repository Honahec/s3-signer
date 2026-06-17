"use client";

import { Progress } from "@/components/ui/progress";

export const archiveStages = [
  "Preparing object list",
  "Opening source streams",
  "Writing ZIP archive",
  "Uploading archive object",
  "Signing download link",
] as const;

export function ArchiveProgressIndicator({
  visible,
  value,
  stage,
}: {
  readonly visible: boolean;
  readonly value: number;
  readonly stage: string;
}) {
  if (!visible) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Building archive</p>
          <p className="truncate text-xs text-muted-foreground">{stage}</p>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {Math.round(value)}%
        </span>
      </div>
      <Progress className="mt-3" value={value} />
    </div>
  );
}
