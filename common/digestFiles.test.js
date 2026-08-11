import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import digestFiles from "./digestFiles";

describe("listDigestFiles", () => {
  const folders = [];
  afterEach(() => folders.splice(0).forEach((folder) => fs.rmSync(folder, { recursive: true })));

  it("returns only sorted, regular digest xlsx files", () => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), "ccdc-digests-"));
    folders.push(folder);
    ["z.xlsx", "A.XLSX", ".hidden.xlsx", "notes.txt", "site_announcement_log.xlsx"]
      .forEach((name) => fs.writeFileSync(path.join(folder, name), "fixture"));
    fs.mkdirSync(path.join(folder, "directory.xlsx"));

    expect(digestFiles.listDigestFiles(folder)).toEqual(["A.XLSX", "z.xlsx"]);
  });
});
