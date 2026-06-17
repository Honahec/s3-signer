"use client";

import type { ReactNode } from "react";
import { FolderOpenIcon, Loader2Icon } from "lucide-react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PublicOssProfile } from "@/lib/types";
import type { LinkOptionProps } from "@/app/generate-link-types";

export function ProfileField({
  profiles,
  selectedProfileId,
  onProfileChange,
}: {
  readonly profiles: readonly PublicOssProfile[];
  readonly selectedProfileId: string;
  readonly onProfileChange: (profileId: string) => void;
}) {
  return (
    <Field>
      <FieldLabel>OSS profile</FieldLabel>
      <Select
        value={selectedProfileId}
        onValueChange={(value) => onProfileChange(value ?? "")}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select profile" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.name} · {profile.bucket}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

export function ObjectKeyField({
  objectKey,
  selectedProfileId,
  isObjectSearchBusy,
  onObjectKeyChange,
  onOpenObjectBrowser,
}: {
  readonly objectKey: string;
  readonly selectedProfileId: string;
  readonly isObjectSearchBusy: boolean;
  readonly onObjectKeyChange: (objectKey: string) => void;
  readonly onOpenObjectBrowser: () => void;
}) {
  return (
    <Field>
      <FieldLabel>Object key</FieldLabel>
      <InputGroup>
        <InputGroupInput
          value={objectKey}
          onChange={(event) => onObjectKeyChange(event.target.value)}
          placeholder="archives/report.zip"
          required
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            onClick={onOpenObjectBrowser}
            disabled={!selectedProfileId || isObjectSearchBusy}
          >
            <BusyIcon
              busy={isObjectSearchBusy}
              idle={<FolderOpenIcon data-icon="inline-start" />}
            />
            Browse
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}

export function LinkOptions({
  validForSeconds,
  maxDownloads,
  downloadFilename,
  filenamePlaceholder,
  onValidForSecondsChange,
  onMaxDownloadsChange,
  onDownloadFilenameChange,
}: LinkOptionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Field>
        <FieldLabel>Valid for</FieldLabel>
        <Select
          value={validForSeconds}
          onValueChange={(value) => onValidForSecondsChange(value ?? "86400")}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="3600">1 hour</SelectItem>
              <SelectItem value="86400">1 day</SelectItem>
              <SelectItem value="604800">7 days</SelectItem>
              <SelectItem value="2592000">30 days</SelectItem>
              <SelectItem value="Permanent">Permanent</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Max downloads</FieldLabel>
        <Input
          value={maxDownloads}
          onChange={(event) => onMaxDownloadsChange(event.target.value)}
          inputMode="numeric"
          placeholder="Unlimited"
        />
      </Field>
      <Field>
        <FieldLabel>Filename</FieldLabel>
        <Input
          value={downloadFilename}
          onChange={(event) => onDownloadFilenameChange(event.target.value)}
          placeholder={filenamePlaceholder}
        />
      </Field>
    </div>
  );
}

export function BusyIcon({
  busy,
  idle,
}: {
  readonly busy: boolean;
  readonly idle: ReactNode;
}) {
  if (busy) {
    return <Loader2Icon data-icon="inline-start" className="animate-spin" />;
  }

  return idle;
}
