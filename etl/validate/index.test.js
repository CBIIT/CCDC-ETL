import { beforeEach, describe, expect, it, vi } from "vitest";
import validate from "./index";

describe("digest sanitizer validation integration", () => {
  const appLogger = { info: vi.fn(), error: vi.fn() };
  const workbookParser = { parse: vi.fn(() => [{ data: [] }]) };
  const validator = {
    check: vi.fn(() => true),
    checkSiteChangeLog: vi.fn(() => true),
  };

  beforeEach(() => vi.clearAllMocks());

  it("sanitizes every file before reparsing saved content and reports sorted modifications", async () => {
    const workbookSanitizer = vi.fn(async (file) => {
      if (file.endsWith("a.xlsx")) throw new Error("simulated write failure");
      if (file.endsWith("b.xlsx")) {
        return { modified: true, replacementCount: 3, unresolved: [] };
      }
      return {
        modified: false,
        replacementCount: 0,
        unresolved: [{ sheet: "Data", cell: "C7", code: "U+00E9" }],
      };
    });
    const run = validate.createRun({
      appConfig: { digestFileFolder: "/temporary/digests" },
      appLogger,
      workbookParser,
      validator,
      digestFileLister: () => ["a.xlsx", "b.xlsx", "c.xlsx"],
      workbookSanitizer,
    });

    await expect(run([{ releaseId: "release-1" }])).resolves.toBe(false);

    expect(workbookSanitizer).toHaveBeenCalledTimes(3);
    expect(workbookParser.parse.mock.calls).toEqual([
      ["/temporary/digests/b.xlsx"],
      ["/temporary/digests/c.xlsx"],
    ]);
    expect(workbookSanitizer.mock.invocationCallOrder[1])
      .toBeLessThan(workbookParser.parse.mock.invocationCallOrder[0]);
    expect(appLogger.info).toHaveBeenCalledWith("Modified digest file b.xlsx: 3 replacements.");
    expect(appLogger.info).toHaveBeenCalledWith("Modified 1 digest files: b.xlsx");
    expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining("a.xlsx"));
    expect(appLogger.error).toHaveBeenCalledWith(expect.stringContaining("U+00E9"));
    expect(validator.checkSiteChangeLog).toHaveBeenCalledOnce();
  });

  it("logs the explicit zero-change summary", async () => {
    const run = validate.createRun({
      appConfig: { digestFileFolder: "/temporary/digests" },
      appLogger,
      workbookParser,
      validator,
      digestFileLister: () => ["clean.xlsx"],
      workbookSanitizer: vi.fn(async () => ({
        modified: false,
        replacementCount: 0,
        unresolved: [],
      })),
    });

    await expect(run([{ releaseId: "release-1" }])).resolves.toBe(true);
    expect(appLogger.info).toHaveBeenCalledWith("Modified 0 digest files.");
  });
});
