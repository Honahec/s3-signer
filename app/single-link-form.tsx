"use client";

import { CopyIcon } from "lucide-react";
import {
  BusyIcon,
  LinkOptions,
  ObjectKeyField,
  ProfileField,
} from "@/app/generate-link-shared";
import type { GenerateLinkPanelProps } from "@/app/generate-link-types";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

export function SingleLinkForm({
  profiles,
  selectedProfileId,
  objectKey,
  validForSeconds,
  maxDownloads,
  downloadFilename,
  isObjectSearchBusy,
  isSingleLinkBusy,
  onProfileChange,
  onObjectKeyChange,
  onValidForSecondsChange,
  onMaxDownloadsChange,
  onDownloadFilenameChange,
  onOpenObjectBrowser,
  onCreateSingleLink,
}: Omit<
  GenerateLinkPanelProps,
  | "selectedProfile"
  | "objects"
  | "objectSearch"
  | "isArchiveBusy"
  | "onObjectSearchChange"
  | "onOpenProfile"
  | "onCreateArchiveLink"
>) {
  return (
    <form onSubmit={onCreateSingleLink}>
      <FieldGroup>
        <ProfileField
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          onProfileChange={onProfileChange}
        />
        <ObjectKeyField
          objectKey={objectKey}
          selectedProfileId={selectedProfileId}
          isObjectSearchBusy={isObjectSearchBusy}
          onObjectKeyChange={onObjectKeyChange}
          onOpenObjectBrowser={onOpenObjectBrowser}
        />
        <LinkOptions
          validForSeconds={validForSeconds}
          maxDownloads={maxDownloads}
          downloadFilename={downloadFilename}
          filenamePlaceholder="Optional"
          onValidForSecondsChange={onValidForSecondsChange}
          onMaxDownloadsChange={onMaxDownloadsChange}
          onDownloadFilenameChange={onDownloadFilenameChange}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSingleLinkBusy || !profiles.length}>
            <BusyIcon
              busy={isSingleLinkBusy}
              idle={<CopyIcon data-icon="inline-start" />}
            />
            Generate and copy
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
