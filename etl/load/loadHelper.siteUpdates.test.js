import { beforeEach, describe, expect, it, vi } from "vitest";

import loadHelper from "./loadHelper";

describe("global search site updates document", () => {
  const mysqlMocks = {
    query: vi.fn(),
    format: vi.fn((sql) => sql),
  };

  beforeEach(() => {
    mysqlMocks.query.mockReset();
  });

  it("builds searchable site updates from persisted changelog rows", async () => {
    mysqlMocks.query.mockResolvedValue([
      {
        post_date: new Date(2026, 5, 10),
        title: "New release",
        description: "New resources and datasets",
        details: "<p>Full <strong>release</strong> details</p>",
      },
    ]);

    const document = await loadHelper.getSiteUpdatesDocument(mysqlMocks);

    expect(mysqlMocks.query).toHaveBeenCalledOnce();
    expect(mysqlMocks.query.mock.calls[0][0]).toContain("FROM changelog");
    expect(document).toMatchObject({
      uid: "siteupdate",
      title: "CCDI Site Updates",
      description: "A chronological listing of site updates and changes.",
      link: "/releasenotes",
    });
    expect(document.content).toContain("June 10, 2026");
    expect(document.content).toContain("New release");
    expect(document.content).toContain("New resources and datasets");
    expect(document.content).toContain("Full release details");
  });
});
