import { normalizeProjectPathForComparison } from "@t3tools/client-runtime/state/projects";

export interface SidebarFolderSection<TProject> {
  readonly key: string;
  readonly label: string;
  readonly projects: readonly TProject[];
}

function parentFolderOf(workspaceRoot: string): { key: string; label: string } {
  const trimmed = workspaceRoot.trim().replace(/[\\/]+$/, "");
  const separatorIndex = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  const parent =
    separatorIndex <= 0 ? trimmed.slice(0, separatorIndex + 1) : trimmed.slice(0, separatorIndex);
  const label =
    parent
      .replace(/[\\/]+$/, "")
      .split(/[\\/]/)
      .at(-1) ||
    parent ||
    workspaceRoot;
  return { key: normalizeProjectPathForComparison(parent), label };
}

/**
 * Sections keep the order of their first project, so the project sort order
 * still decides which folder comes first.
 */
export function groupProjectsByParentFolder<TProject extends { readonly workspaceRoot: string }>(
  projects: readonly TProject[],
): SidebarFolderSection<TProject>[] {
  const sections = new Map<string, { label: string; projects: TProject[] }>();
  for (const project of projects) {
    const { key, label } = parentFolderOf(project.workspaceRoot);
    const section = sections.get(key);
    if (section) {
      section.projects.push(project);
    } else {
      sections.set(key, { label, projects: [project] });
    }
  }
  return Array.from(sections, ([key, section]) => ({ key, ...section }));
}
