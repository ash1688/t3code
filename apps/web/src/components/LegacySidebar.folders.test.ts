import { describe, expect, it } from "vite-plus/test";

import { groupProjectsByParentFolder } from "./LegacySidebar.folders";

const project = (workspaceRoot: string) => ({ workspaceRoot });

describe("groupProjectsByParentFolder", () => {
  it("puts sibling folders under their parent, in first-seen order", () => {
    const sections = groupProjectsByParentFolder([
      project("C:\\Teaching\\L3 Y1\\Unit 1"),
      project("C:\\Teaching\\L2\\Unit 3"),
      project("C:\\Teaching\\L2\\Unit 16\\"),
      project("C:\\Teaching\\L3 Y1\\Unit 2"),
    ]);

    expect(
      sections.map((section) => ({
        label: section.label,
        roots: section.projects.map((entry) => entry.workspaceRoot),
      })),
    ).toEqual([
      { label: "L3 Y1", roots: ["C:\\Teaching\\L3 Y1\\Unit 1", "C:\\Teaching\\L3 Y1\\Unit 2"] },
      { label: "L2", roots: ["C:\\Teaching\\L2\\Unit 3", "C:\\Teaching\\L2\\Unit 16\\"] },
    ]);
  });

  it("keeps folders with the same name but different parents apart", () => {
    const sections = groupProjectsByParentFolder([
      project("/home/me/school-a/L2/Unit 3"),
      project("/home/me/school-b/L2/Unit 3"),
    ]);

    expect(sections.map((section) => section.label)).toEqual(["L2", "L2"]);
  });

  it("labels a project at the top of a drive with the drive", () => {
    expect(groupProjectsByParentFolder([project("/work")]).map((section) => section.label)).toEqual(
      ["/"],
    );
  });
});
