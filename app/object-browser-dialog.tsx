"use client";

import { Loader2Icon, SearchIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BusyIcon } from "@/app/generate-link-shared";
import { formatBytes } from "@/lib/format";
import type { ObjectInfo, PublicOssProfile } from "@/lib/types";

export function ObjectBrowserDialog({
  open,
  selectedProfile,
  objectSearch,
  objects,
  nextContinuationToken,
  isObjectSearchBusy,
  onOpenChange,
  onObjectSearchChange,
  onSearch,
  onNextPage,
  onSelect,
}: {
  readonly open: boolean;
  readonly selectedProfile: PublicOssProfile | null;
  readonly objectSearch: string;
  readonly objects: readonly ObjectInfo[];
  readonly nextContinuationToken: string | undefined;
  readonly isObjectSearchBusy: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onObjectSearchChange: (query: string) => void;
  readonly onSearch: () => void;
  readonly onNextPage: () => void;
  readonly onSelect: (objectKey: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Object Browser</DialogTitle>
          <DialogDescription>
            {selectedProfile
              ? `${selectedProfile.name} · ${selectedProfile.bucket}`
              : "Select an OSS profile"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
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
                  onSearch();
                }
              }}
              placeholder="Search by object key"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton onClick={onSearch} disabled={isObjectSearchBusy}>
                <BusyIcon
                  busy={isObjectSearchBusy}
                  idle={<SearchIcon data-icon="inline-start" />}
                />
                Search
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <div className="max-h-96 overflow-auto rounded-lg border">
            {objects.length ? (
              <Table>
                <TableBody>
                  {objects.map((object) => (
                    <TableRow key={object.key}>
                      <TableCell className="max-w-lg truncate font-medium">
                        {object.key}
                      </TableCell>
                      <TableCell>{formatBytes(object.size)}</TableCell>
                      <TableCell>{object.storageClass ?? ""}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onSelect(object.key)}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SearchIcon />
                  </EmptyMedia>
                  <EmptyTitle>No objects</EmptyTitle>
                  <EmptyDescription>
                    Matching objects will appear here.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent />
              </Empty>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={!nextContinuationToken || isObjectSearchBusy}
            onClick={onNextPage}
          >
            {isObjectSearchBusy && (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            )}
            Next page
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
