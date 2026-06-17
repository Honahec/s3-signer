"use client";

import { SearchIcon } from "lucide-react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ObjectInfo, PublicOssProfile } from "@/lib/types";
import { BusyIcon, LinkOptions, ProfileField } from "@/app/generate-link-shared";

export function ArchiveLinkFields({
  profiles,
  selectedProfileId,
  objectSearch,
  objects,
  archiveObjectKeys,
  archiveObjectKeysInput,
  archiveFilename,
  preserveArchivePaths,
  validForSeconds,
  maxDownloads,
  isObjectSearchBusy,
  onProfileChange,
  onObjectSearchChange,
  onArchiveObjectKeysInputChange,
  onArchiveFilenameChange,
  onPreserveArchivePathsChange,
  onSearchArchiveObjects,
  onValidForSecondsChange,
  onMaxDownloadsChange,
  onAppendObjectKey,
  onRemoveObjectKey,
}: {
  readonly profiles: readonly PublicOssProfile[];
  readonly selectedProfileId: string;
  readonly objectSearch: string;
  readonly objects: readonly ObjectInfo[];
  readonly archiveObjectKeys: readonly string[];
  readonly archiveObjectKeysInput: string;
  readonly archiveFilename: string;
  readonly preserveArchivePaths: boolean;
  readonly validForSeconds: string;
  readonly maxDownloads: string;
  readonly isObjectSearchBusy: boolean;
  readonly onProfileChange: (profileId: string) => void;
  readonly onObjectSearchChange: (query: string) => void;
  readonly onArchiveObjectKeysInputChange: (value: string) => void;
  readonly onArchiveFilenameChange: (value: string) => void;
  readonly onPreserveArchivePathsChange: (preserve: boolean) => void;
  readonly onSearchArchiveObjects: () => void;
  readonly onValidForSecondsChange: (seconds: string) => void;
  readonly onMaxDownloadsChange: (downloads: string) => void;
  readonly onAppendObjectKey: (objectKey: string) => void;
  readonly onRemoveObjectKey: (objectKey: string) => void;
}) {
  return (
    <>
      <ProfileField
        profiles={profiles}
        selectedProfileId={selectedProfileId}
        onProfileChange={onProfileChange}
      />
      <Field>
        <FieldLabel>Object keys</FieldLabel>
        <Textarea
          value={archiveObjectKeysInput}
          onChange={(event) => onArchiveObjectKeysInputChange(event.target.value)}
          placeholder={"reports/a.pdf\nreports/b.csv\nimages/chart.png"}
          rows={6}
          required
        />
      </Field>
      <Field>
        <FieldLabel>Search objects</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={objectSearch}
            onChange={(event) => onObjectSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSearchArchiveObjects();
              }
            }}
            placeholder="Search objects in the bucket"
          />
          <InputGroupAddon align="inline-end">
            <BusyIcon
              busy={isObjectSearchBusy}
              idle={<SearchIcon data-icon="inline-start" />}
            />
          </InputGroupAddon>
        </InputGroup>
      </Field>
      {objects.length ? (
        <div className="grid gap-2 md:grid-cols-2">
          {objects.map((object) => (
            <ArchiveObjectCandidate
              key={object.key}
              objectKey={object.key}
              selected={archiveObjectKeys.includes(object.key)}
              onAppendObjectKey={onAppendObjectKey}
              onRemoveObjectKey={onRemoveObjectKey}
            />
          ))}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>No objects yet</EmptyTitle>
            <EmptyDescription>
              Press Enter to search and add files from the bucket.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      )}
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Keep bucket folders</FieldTitle>
          <FieldDescription>
            Turn off to place every selected file at the ZIP root.
          </FieldDescription>
        </FieldContent>
        <Switch
          checked={preserveArchivePaths}
          onCheckedChange={onPreserveArchivePathsChange}
        />
      </Field>
      <LinkOptions
        validForSeconds={validForSeconds}
        maxDownloads={maxDownloads}
        downloadFilename={archiveFilename}
        filenamePlaceholder="bundle.zip"
        onValidForSecondsChange={onValidForSecondsChange}
        onMaxDownloadsChange={onMaxDownloadsChange}
        onDownloadFilenameChange={onArchiveFilenameChange}
      />
    </>
  );
}

function ArchiveObjectCandidate({
  objectKey,
  selected,
  onAppendObjectKey,
  onRemoveObjectKey,
}: {
  readonly objectKey: string;
  readonly selected: boolean;
  readonly onAppendObjectKey: (objectKey: string) => void;
  readonly onRemoveObjectKey: (objectKey: string) => void;
}) {
  return (
    <button
      type="button"
      className={`flex min-w-0 items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
        selected ? "border-primary bg-primary/5" : ""
      }`}
      onClick={() =>
        selected ? onRemoveObjectKey(objectKey) : onAppendObjectKey(objectKey)
      }
    >
      <span className="min-w-0 truncate">{objectKey}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {selected ? "Added" : "Add"}
      </span>
    </button>
  );
}
