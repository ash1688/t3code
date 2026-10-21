import {
  ensureBrowseDirectoryPath,
  getBrowseParentPath,
} from "@t3tools/client-runtime/state/projects";
import type { EnvironmentId } from "@t3tools/contracts";
import { ArrowUpIcon, FolderIcon } from "lucide-react";
import { useState } from "react";

import { filesystemEnvironment, useFilesystemReadAccess } from "../../state/filesystem";
import { useEnvironmentQuery } from "../../state/query";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog";

/**
 * Browses folders on the environment's host rather than the viewer's device,
 * because the chosen path is read by that host's server, which may be remote.
 */
export function FolderBrowseDialog({
  open,
  onOpenChange,
  environmentId,
  initialPath,
  title,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  environmentId: EnvironmentId | null;
  initialPath: string;
  title: string;
  onSelect: (path: string) => void;
}) {
  const [browsePath, setBrowsePath] = useState(() =>
    ensureBrowseDirectoryPath(initialPath.trim() || "~/"),
  );
  const access = useFilesystemReadAccess(environmentId);
  const query = useEnvironmentQuery(
    open && environmentId !== null && access.canReadFiles
      ? filesystemEnvironment.browse({ environmentId, input: { partialPath: browsePath } })
      : null,
  );
  const currentPath = query.data?.parentPath ?? null;
  const parentPath = currentPath === null ? null : getBrowseParentPath(currentPath);
  const error =
    environmentId === null
      ? "No environment is connected."
      : !access.isPending && !access.canReadFiles
        ? (access.error ?? "This connection cannot browse host folders.")
        : query.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="break-all">{currentPath ?? browsePath}</DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="grid max-h-80 gap-0.5 overflow-y-auto">
            {parentPath !== null ? (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => setBrowsePath(ensureBrowseDirectoryPath(parentPath))}
              >
                <ArrowUpIcon />
                Up one folder
              </Button>
            ) : null}
            {error ? (
              <p className="px-2 py-1 text-sm text-destructive-foreground">{error}</p>
            ) : query.isPending && query.data === null ? (
              <p className="px-2 py-1 text-sm text-muted-foreground">Loading…</p>
            ) : query.data?.entries.length === 0 ? (
              <p className="px-2 py-1 text-sm text-muted-foreground">No folders here.</p>
            ) : (
              query.data?.entries.map((entry) => (
                <Button
                  key={entry.fullPath}
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => setBrowsePath(ensureBrowseDirectoryPath(entry.fullPath))}
                >
                  <FolderIcon />
                  <span className="truncate">{entry.name}</span>
                </Button>
              ))
            )}
          </div>
        </DialogPanel>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={currentPath === null}
            onClick={() => {
              if (currentPath === null) return;
              onSelect(currentPath);
              onOpenChange(false);
            }}
          >
            Select this folder
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
