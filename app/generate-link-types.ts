import type { FormEvent } from "react";
import type { ArchiveLayout } from "@/lib/archive-layout";
import type { ObjectInfo, PublicOssProfile } from "@/lib/types";

export interface ArchiveCreatePayload {
  readonly objectKeys: readonly string[];
  readonly downloadFilename: string | null;
  readonly archiveLayout: ArchiveLayout;
}

export interface GenerateLinkPanelProps {
  readonly profiles: readonly PublicOssProfile[];
  readonly selectedProfileId: string;
  readonly selectedProfile: PublicOssProfile | null;
  readonly objects: readonly ObjectInfo[];
  readonly objectKey: string;
  readonly objectSearch: string;
  readonly validForSeconds: string;
  readonly maxDownloads: string;
  readonly downloadFilename: string;
  readonly isObjectSearchBusy: boolean;
  readonly isSingleLinkBusy: boolean;
  readonly isArchiveBusy: boolean;
  readonly onProfileChange: (profileId: string) => void;
  readonly onObjectKeyChange: (objectKey: string) => void;
  readonly onObjectSearchChange: (query: string) => void;
  readonly onValidForSecondsChange: (seconds: string) => void;
  readonly onMaxDownloadsChange: (downloads: string) => void;
  readonly onDownloadFilenameChange: (filename: string) => void;
  readonly onOpenProfile: () => void;
  readonly onOpenObjectBrowser: () => void;
  readonly onCreateSingleLink: (event: FormEvent<HTMLFormElement>) => void;
  readonly onCreateArchiveLink: (payload: ArchiveCreatePayload) => Promise<boolean>;
  readonly onSearchArchiveObjects: () => void;
}

export interface LinkOptionProps {
  readonly validForSeconds: string;
  readonly maxDownloads: string;
  readonly downloadFilename: string;
  readonly filenamePlaceholder: string;
  readonly onValidForSecondsChange: (seconds: string) => void;
  readonly onMaxDownloadsChange: (downloads: string) => void;
  readonly onDownloadFilenameChange: (filename: string) => void;
}
