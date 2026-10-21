import { normalizeProjectPathForComparison } from "@t3tools/client-runtime/state/projects";

export interface SidebarFolderSection<TProject> {
  readonly key: string;
  readonly label: string;
  /** The folder itself, as shown on disk, for creating sub groups inside it. */
  readonly path: string;
  /** Whether the user added this folder, so it stays even with no projects. */
  readonly added: boolean;
  readonly projects: readonly TProject[];
}

function trimTrailingSeparators(path: string): string {
  const trimmed = path.trim();
  // Keep a drive or filesystem root such as "C:\" or "/" whole.
  return /^([A-Za-z]:)?[\\/]$/.test(trimmed) ? trimmed : trimmed.replace(/[\\/]+$/, "");
}

function folderKey(path: string): string {
  return normalizeProjectPathForComparison(trimTrailingSeparators(path));
}

function folderLabel(path: string): string {
  return (
    trimTrailingSeparators(path)
      .replace(/[\\/]+$/, "")
      .split(/[\\/]/)
      .at(-1) || path
  );
}

function parentFolderOf(workspaceRoot: string): string {
  const trimmed = trimTrailingSeparators(workspaceRoot);
  const separatorIndex = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  return separatorIndex <= 0 || trimmed[separatorIndex - 1] === ":"
    ? trimmed.slice(0, separatorIndex + 1)
    : trimmed.slice(0, separatorIndex);
}

/**
 * Sections keep the order of their first project, so the project sort order
 * still decides which folder comes first. Added folders with no projects yet
 * follow, in the order they were added.
 */
export function groupProjectsByParentFolder<TProject extends { readonly workspaceRoot: string }>(
  projects: readonly TProject[],
  addedFolders: readonly string[] = [],
): SidebarFolderSection<TProject>[] {
  const addedKeys = new Set(addedFolders.map(folderKey));
  const sections = new Map<string, { path: string; projects: TProject[] }>();
  for (const project of projects) {
    const path = parentFolderOf(project.workspaceRoot);
    const key = folderKey(path);
    const section = sections.get(key);
    if (section) {
      section.projects.push(project);
    } else {
      sections.set(key, { path, projects: [project] });
    }
  }
  for (const path of addedFolders) {
    const key = folderKey(path);
    if (!sections.has(key)) sections.set(key, { path: trimTrailingSeparators(path), projects: [] });
  }
  return Array.from(sections, ([key, section]) => ({
    key,
    label: folderLabel(section.path),
    path: section.path,
    added: addedKeys.has(key),
    projects: section.projects,
  }));
}

export function isSameFolder(left: string, right: string): boolean {
  return folderKey(left) === folderKey(right);
}

const INVALID_SUB_GROUP_NAME = /[<>:"/\\|?*]/;

/** A sub group becomes a folder, so its name must be one folder name. */
export function validateSubGroupName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "Enter a name.";
  if (trimmed === "." || trimmed === "..") return "Choose a different name.";
  if (INVALID_SUB_GROUP_NAME.test(trimmed)) return 'Names cannot contain < > : " / \\ | ? *';
  return null;
}

export function subGroupPath(folderPath: string, name: string): string {
  const folder = trimTrailingSeparators(folderPath);
  const separator = folder.includes("\\") || /^[A-Za-z]:/.test(folder) ? "\\" : "/";
  return /[\\/]$/.test(folder) ? `${folder}${name.trim()}` : `${folder}${separator}${name.trim()}`;
}
