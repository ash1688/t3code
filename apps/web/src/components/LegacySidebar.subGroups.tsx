import { scopeProjectRef } from "@t3tools/client-runtime/environment";
import {
  isAtomCommandInterrupted,
  settlePromise,
  squashAtomCommandFailure,
} from "@t3tools/client-runtime/state/runtime";
import type { EnvironmentId } from "@t3tools/contracts";
import { useState } from "react";

import type { useNewThreadHandler } from "../hooks/useHandleNewThread";
import { inferProjectTitleFromPath } from "../lib/projectPaths";
import { newProjectId } from "../lib/utils";
import { projectEnvironment } from "../state/projects";
import { useAtomCommand } from "../state/use-atom-command";
import { subGroupPath, validateSubGroupName } from "./LegacySidebar.folders";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { stackedThreadToast, toastManager } from "./ui/toast";

export interface SubGroupTarget {
  readonly environmentId: EnvironmentId;
  readonly folderPath: string;
  readonly label: string;
}

/** Creates a folder inside a sidebar heading's folder and adds it as a project. */
export function NewSubGroupDialog({
  target,
  onClose,
  handleNewThread,
}: {
  target: SubGroupTarget;
  onClose: () => void;
  handleNewThread: ReturnType<typeof useNewThreadHandler>;
}) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const createProject = useAtomCommand(projectEnvironment.create, { reportFailure: false });
  const nameError = validateSubGroupName(name);
  const workspaceRoot = nameError === null ? subGroupPath(target.folderPath, name) : null;

  const submit = async () => {
    setTouched(true);
    if (workspaceRoot === null || submitting) return;
    setSubmitting(true);
    const projectId = newProjectId();
    const result = await createProject({
      environmentId: target.environmentId,
      input: {
        projectId,
        title: inferProjectTitleFromPath(workspaceRoot),
        workspaceRoot,
        createWorkspaceRootIfMissing: true,
        defaultModelSelection: null,
      },
    });
    setSubmitting(false);
    if (result._tag === "Failure") {
      if (!isAtomCommandInterrupted(result)) {
        const error = squashAtomCommandFailure(result);
        toastManager.add(
          stackedThreadToast({
            type: "error",
            title: "Could not create sub group",
            description: error instanceof Error ? error.message : "An error occurred.",
          }),
        );
      }
      return;
    }
    onClose();
    await settlePromise(() => handleNewThread(scopeProjectRef(target.environmentId, projectId)));
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>New sub group in {target.label}</DialogTitle>
          <DialogDescription className="break-all">
            {workspaceRoot === null
              ? `Creates a folder inside ${target.folderPath}.`
              : `Creates ${workspaceRoot}`}
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="grid gap-1.5">
            <Input
              aria-label="Sub group name"
              placeholder="Unit 21"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void submit();
                }
              }}
            />
            {touched && nameError !== null ? (
              <p className="text-xs text-destructive-foreground">{nameError}</p>
            ) : null}
          </div>
        </DialogPanel>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={submitting} onClick={() => void submit()}>
            Create
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
