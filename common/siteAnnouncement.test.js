import { describe, expect, it, vi } from "vitest";
import siteAnnouncement from "./siteAnnouncement";

const validMarkdown = `# Older release
### May 2, 2022 | Release Notes

An **older** body with an apostrophe.

| Property | Value |
| --- | --- |
| id | catalog_release_05022022 |
| version | v1.0.0 |
| slug | Initial catalog release |
| contentType | Clinical,Genomics/Omics |

# New data just in time for summer
### June 10, 2026 | Release Notes

Version 1.5.9 includes:

- **New Dataset** – Example
- [External link](https://example.org)

| Property | Value |
| --- | --- |
| id | catalog_release_06102026 |
| version | v1.5.9 |
| slug | New resources, new datasets, and new links |
| contentType | Clinical,Genomics/Omics |
`;

const publicResolver = vi.fn().mockResolvedValue([
  { address: "93.184.216.34", family: 4 },
]);

describe("site announcement Markdown", () => {
  it("strictly maps every release and orders newest first", () => {
    const result = siteAnnouncement.parseSiteAnnouncementMarkdown(validMarkdown);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      releaseId: "catalog_release_06102026",
      logType: 1,
      title: "New data just in time for summer",
      version: "1.5.9",
      postDate: "2026-06-10",
      contentType: "Clinical,Genomics/Omics",
      description: "New resources, new datasets, and new links",
      status: 1,
    });
    expect(result[0].details).toContain("<ul>");
    expect(result[0].details).toContain("<strong>New Dataset</strong>");
    expect(result[0].details).toContain('target="_blank" rel="noreferrer"');
    expect(result[1].postDate).toBe("2022-05-02");
    expect(result[1].details).toContain("apostrophe");
  });

  it.each([
    ["", "response is empty"],
    ["plain text", "no release sections"],
    [validMarkdown.replace("# Older release", "Older release"), "missing a title"],
    [validMarkdown.replace("### May 2, 2022 | Release Notes", "### May 2, 2022"), "release-date heading"],
    [validMarkdown.replace("May 2, 2022", "not-a-date"), "invalid date"],
    [validMarkdown.replace("May 2, 2022", "February 31, 2022"), "invalid date"],
    [validMarkdown.replace("| id | catalog_release_05022022 |", "| id | |"), "missing metadata: id"],
    [validMarkdown.replace("| Property | Value |", "| Name | Value |"), "metadata table"],
    [validMarkdown.replace("| --- | --- |", "| id | catalog_release_duplicate |"), "metadata table delimiter"],
    [validMarkdown.replace("An **older** body with an apostrophe.", ""), "empty release body"],
  ])("rejects a malformed complete document", (markdown, message) => {
    expect(() => siteAnnouncement.parseSiteAnnouncementMarkdown(markdown)).toThrow(message);
  });

  it("rejects one malformed section among valid sections", () => {
    const malformed = validMarkdown.replace(
      "| slug | New resources, new datasets, and new links |",
      "| other | value |"
    );
    expect(() => siteAnnouncement.parseSiteAnnouncementMarkdown(malformed))
      .toThrow("Release section 2 is missing metadata: slug");
  });

  it("renders safe HTML for storage and API delivery", () => {
    const maliciousMarkdown = validMarkdown.replace(
      "An **older** body with an apostrophe.",
      `An **older** body.

<script>alert("xss")</script>
[Unsafe](javascript:alert("xss"))
[Encoded unsafe](javascript&#x3a;alert("xss"))
![Unsafe image](data:image/svg+xml,malicious)`
    );

    const result = siteAnnouncement.parseSiteAnnouncementMarkdown(maliciousMarkdown);

    expect(result[1].details).toContain("&lt;script&gt;");
    expect(result[1].details).not.toContain("<script>");
    expect(result[1].details).not.toContain("javascript:");
    expect(result[1].details).not.toContain("data:image");
  });

  it("stores metadata descriptions as plain text", () => {
    const maliciousMetadata = validMarkdown.replace(
      "| slug | Initial catalog release |",
      '| slug | <a href="javascript:alert(document.domain)">click</a> |'
    );

    const result = siteAnnouncement.parseSiteAnnouncementMarkdown(maliciousMetadata);

    expect(result[1].description).toBe("click");
    expect(result[1].description).not.toMatch(/<|>|javascript:/i);
  });

  it("fetches the configured URL and returns normalized records", async () => {
    const httpClient = {
      get: vi.fn().mockResolvedValue({ data: validMarkdown }),
    };

    const result = await siteAnnouncement.readSiteAnnouncements(
      "https://example.org/releases.md",
      httpClient,
      publicResolver
    );

    expect(result).toHaveLength(2);
    expect(httpClient.get).toHaveBeenCalledOnce();
    expect(httpClient.get).toHaveBeenCalledWith(
      "https://example.org/releases.md",
      expect.objectContaining({
        timeout: 60000,
        responseType: "text",
        maxRedirects: 0,
        maxContentLength: 2 * 1024 * 1024,
        proxy: false,
      })
    );

    const requestConfig = httpClient.get.mock.calls[0][1];
    const pinnedLookup = await new Promise((resolve, reject) => {
      requestConfig.httpsAgent.options.lookup(
        "example.org",
        {},
        (error, address, family) => error
          ? reject(error)
          : resolve({ address, family })
      );
    });
    expect(pinnedLookup).toEqual({ address: "93.184.216.34", family: 4 });
  });

  it("propagates network failures without parsing a partial snapshot", async () => {
    const httpClient = {
      get: vi.fn().mockRejectedValue(new Error("request timed out")),
    };
    await expect(siteAnnouncement.readSiteAnnouncements(
      "https://example.org/releases.md",
      httpClient,
      publicResolver
    )).rejects.toThrow("request timed out");
  });

  it.each(["", "not a url", "file:///tmp/releases.md", "http://example.org/releases.md"])(
    "rejects an invalid source URL",
    async (url) => {
      const httpClient = { get: vi.fn() };
      await expect(siteAnnouncement.readSiteAnnouncements(url, httpClient, publicResolver))
        .rejects.toThrow(/SITE_ANNOUNCEMENT_URL/);
      expect(httpClient.get).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["127.0.0.1", 4],
    ["10.0.0.1", 4],
    ["169.254.169.254", 4],
    ["255.255.255.255", 4],
    ["::1", 6],
    ["fc00::1", 6],
    ["::ffff:127.0.0.1", 6],
  ])("rejects private and special-use destinations", async (address, family) => {
    const httpClient = { get: vi.fn() };
    const resolver = vi.fn().mockResolvedValue([{ address, family }]);

    await expect(siteAnnouncement.readSiteAnnouncements(
      "https://announcements.example/releases.md",
      httpClient,
      resolver
    )).rejects.toThrow("must resolve only to public addresses");
    expect(httpClient.get).not.toHaveBeenCalled();
  });
});
