import { describe, expect, it } from "vite-plus/test";

import {
  groupProjectsByParentFolder,
  isSameFolder,
  subGroupPath,
  validateSubGroupName,
} from "./LegacySidebar.folders";

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
        path: section.path,
        roots: section.projects.map((entry) => entry.workspaceRoot),
      })),
    ).toEqual([
      {
        label: "L3 Y1",
        path: "C:\\Teaching\\L3 Y1",
        roots: ["C:\\Teaching\\L3 Y1\\Unit 1", "C:\\Teaching\\L3 Y1\\Unit 2"],
      },
      {
        label: "L2",
        path: "C:\\Teaching\\L2",
        roots: ["C:\\Teaching\\L2\\Unit 3", "C:\\Teaching\\L2\\Unit 16\\"],
      },
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
    expect(
      groupProjectsByParentFolder([project("C:\\work")]).map((section) => section.path),
    ).toEqual(["C:\\"]);
  });

  it("shows added folders as empty headings after the folders that hold projects", () => {
    const sections = groupProjectsByParentFolder(
      [project("C:\\Teaching\\L2\\Unit 3")],
      ["C:\\Teaching\\L3 Y1\\", "C:\\Teaching\\L2"],
    );

    expect(
      sections.map((section) => ({
        label: section.label,
        added: section.added,
        count: section.projects.length,
      })),
    ).toEqual([
      { label: "L2", added: true, count: 1 },
      { label: "L3 Y1", added: true, count: 0 },
    ]);
  });
});

describe("sub groups", () => {
  it("builds the new folder path inside the heading's folder", () => {
    expect(subGroupPath("C:\\Teaching\\L2", " Unit 21 ")).toBe("C:\\Teaching\\L2\\Unit 21");
    expect(subGroupPath("/home/me/L2/", "Unit 21")).toBe("/home/me/L2/Unit 21");
  });

  it("rejects names that are not a single folder name", () => {
    expect(validateSubGroupName("Unit 21")).toBeNull();
    expect(validateSubGroupName("  ")).not.toBeNull();
    expect(validateSubGroupName("Unit/21")).not.toBeNull();
    expect(validateSubGroupName("..")).not.toBeNull();
  });

  it("matches folders regardless of a trailing separator", () => {
    expect(isSameFolder("C:\\Teaching\\L2\\", "C:\\Teaching\\L2")).toBe(true);
  });
});
