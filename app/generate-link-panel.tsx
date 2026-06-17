"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  ArchiveIcon,
  CopyIcon,
  FileArchiveIcon,
  PlusIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ArchiveLinkFields } from "@/app/archive-link-fields";
import {
  ArchiveProgressIndicator,
  archiveStages,
} from "@/app/archive-progress-indicator";
import {
  BusyIcon,
} from "@/app/generate-link-shared";
import type {
  ArchiveCreatePayload,
  GenerateLinkPanelProps,
} from "@/app/generate-link-types";
import { SingleLinkForm } from "@/app/single-link-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function GenerateLinkPanel({
  profiles,
  selectedProfileId,
  selectedProfile,
  objects,
  objectKey,
  objectSearch,
  validForSeconds,
  maxDownloads,
  downloadFilename,
  isObjectSearchBusy,
  isSingleLinkBusy,
  isArchiveBusy,
  onProfileChange,
  onObjectKeyChange,
  onObjectSearchChange,
  onValidForSecondsChange,
  onMaxDownloadsChange,
  onDownloadFilenameChange,
  onOpenProfile,
  onOpenObjectBrowser,
  onCreateSingleLink,
  onCreateArchiveLink,
}: GenerateLinkPanelProps) {
  const [archiveObjectKeysInput, setArchiveObjectKeysInput] = useState("");
  const [archiveFilename, setArchiveFilename] = useState("bundle.zip");
  const [archiveProgress, setArchiveProgress] = useState(0);
  const [archiveStageIndex, setArchiveStageIndex] = useState(0);

  const archiveObjectKeys = useMemo(
    () => parseObjectKeys(archiveObjectKeysInput),
    [archiveObjectKeysInput],
  );

  async function createArchiveLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (archiveObjectKeys.length === 0) {
      toast.error("Add at least one object key.");
      return;
    }

    setArchiveProgress(12);
    setArchiveStageIndex(0);
    const tick = window.setInterval(() => {
      setArchiveProgress((current) => Math.min(current + 8, 88));
      setArchiveStageIndex((current) =>
        Math.min(current + 1, archiveStages.length - 2),
      );
    }, 900);

    const succeeded = await onCreateArchiveLink({
      objectKeys: archiveObjectKeys,
      downloadFilename: archiveFilename.trim() || null,
    });

    window.clearInterval(tick);
    if (succeeded) {
      setArchiveProgress(100);
      setArchiveStageIndex(archiveStages.length - 1);
      window.setTimeout(() => {
        setArchiveProgress(0);
        setArchiveStageIndex(0);
      }, 1400);
    } else {
      setArchiveProgress(0);
      setArchiveStageIndex(0);
    }
  }

  function appendObjectKey(nextObjectKey: string) {
    setArchiveObjectKeysInput((current) => {
      const objectKeys = parseObjectKeys(current);
      if (objectKeys.includes(nextObjectKey)) {
        return current;
      }
      return [...objectKeys, nextObjectKey].join("\n");
    });
  }

  function removeObjectKey(nextObjectKey: string) {
    setArchiveObjectKeysInput((current) =>
      parseObjectKeys(current)
        .filter((item) => item !== nextObjectKey)
        .join("\n"),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Link</CardTitle>
        <CardDescription>
          {selectedProfile
            ? `${selectedProfile.bucket} · ${selectedProfile.endpoint}`
            : "No OSS profile selected"}
        </CardDescription>
        <CardAction>
          <Button type="button" variant="outline" size="sm" onClick={onOpenProfile}>
            <PlusIcon data-icon="inline-start" />
            Profile
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="single">
          <TabsList>
            <TabsTrigger value="single">
              <CopyIcon data-icon="inline-start" />
              Single
            </TabsTrigger>
            <TabsTrigger value="archive">
              <ArchiveIcon data-icon="inline-start" />
              ZIP batch
            </TabsTrigger>
          </TabsList>
          <TabsContent value="single">
            <SingleLinkForm
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              objectKey={objectKey}
              validForSeconds={validForSeconds}
              maxDownloads={maxDownloads}
              downloadFilename={downloadFilename}
              isObjectSearchBusy={isObjectSearchBusy}
              isSingleLinkBusy={isSingleLinkBusy}
              onProfileChange={onProfileChange}
              onObjectKeyChange={onObjectKeyChange}
              onValidForSecondsChange={onValidForSecondsChange}
              onMaxDownloadsChange={onMaxDownloadsChange}
              onDownloadFilenameChange={onDownloadFilenameChange}
              onOpenObjectBrowser={onOpenObjectBrowser}
              onCreateSingleLink={onCreateSingleLink}
            />
          </TabsContent>
          <TabsContent value="archive">
            <form onSubmit={createArchiveLink}>
              <FieldGroup>
                <ArchiveLinkFields
                  profiles={profiles}
                  selectedProfileId={selectedProfileId}
                  objectSearch={objectSearch}
                  objects={objects}
                  archiveObjectKeys={archiveObjectKeys}
                  archiveObjectKeysInput={archiveObjectKeysInput}
                  archiveFilename={archiveFilename}
                  validForSeconds={validForSeconds}
                  maxDownloads={maxDownloads}
                  isObjectSearchBusy={isObjectSearchBusy}
                  onProfileChange={onProfileChange}
                  onObjectSearchChange={onObjectSearchChange}
                  onArchiveObjectKeysInputChange={setArchiveObjectKeysInput}
                  onArchiveFilenameChange={setArchiveFilename}
                  onValidForSecondsChange={onValidForSecondsChange}
                  onMaxDownloadsChange={onMaxDownloadsChange}
                  onOpenObjectBrowser={onOpenObjectBrowser}
                  onAppendObjectKey={appendObjectKey}
                  onRemoveObjectKey={removeObjectKey}
                />
                <ArchiveProgressIndicator
                  visible={isArchiveBusy || archiveProgress > 0}
                  value={archiveProgress}
                  stage={archiveStages[archiveStageIndex]}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={
                      isArchiveBusy ||
                      !profiles.length ||
                      archiveObjectKeys.length === 0
                    }
                  >
                    <BusyIcon
                      busy={isArchiveBusy}
                      idle={<FileArchiveIcon data-icon="inline-start" />}
                    />
                    Generate ZIP link
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function parseObjectKeys(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export type { ArchiveCreatePayload };
