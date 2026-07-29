import { beforeEach, describe, expect, it, vi } from "vitest";
import etl from "./index";

describe("ETL announcement snapshot orchestration", () => {
  const announcements = [{ releaseId: "release-1" }];
  const dependencies = {
    appConfig: { siteAnnouncementUrl: "https://example.org/releases.md" },
    appLogger: { info: vi.fn(), error: vi.fn() },
    validator: { run: vi.fn() },
    extractor: { run: vi.fn() },
    indexBuilder: { run: vi.fn() },
    loader: { run: vi.fn() },
    announcementSource: { readSiteAnnouncements: vi.fn() },
  };
  let startEtl;

  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.announcementSource.readSiteAnnouncements.mockResolvedValue(announcements);
    dependencies.validator.run.mockResolvedValue(true);
    dependencies.extractor.run.mockResolvedValue();
    dependencies.indexBuilder.run.mockResolvedValue();
    dependencies.loader.run.mockResolvedValue();
    startEtl = etl.createStartEtl(dependencies);
  });

  it("fetches once and passes the same snapshot to validation and extraction", async () => {
    await expect(startEtl()).resolves.toBe(true);

    expect(dependencies.announcementSource.readSiteAnnouncements).toHaveBeenCalledOnce();
    expect(dependencies.validator.run).toHaveBeenCalledWith(announcements);
    expect(dependencies.extractor.run).toHaveBeenCalledWith(announcements);
    expect(dependencies.indexBuilder.run).toHaveBeenCalledOnce();
    expect(dependencies.loader.run).toHaveBeenCalledOnce();
  });

  it("fetches a fresh snapshot on every run", async () => {
    await startEtl();
    await startEtl();

    expect(dependencies.announcementSource.readSiteAnnouncements).toHaveBeenCalledTimes(2);
  });

  it("does not extract or delete changelog rows after source validation fails", async () => {
    dependencies.validator.run.mockResolvedValue(false);

    await expect(startEtl()).resolves.toBe(false);

    expect(dependencies.extractor.run).not.toHaveBeenCalled();
    expect(dependencies.indexBuilder.run).not.toHaveBeenCalled();
    expect(dependencies.loader.run).not.toHaveBeenCalled();
  });

  it("does not validate or extract when the remote request fails", async () => {
    dependencies.announcementSource.readSiteAnnouncements
      .mockRejectedValue(new Error("network unavailable"));

    await expect(startEtl()).resolves.toBe(false);

    expect(dependencies.validator.run).not.toHaveBeenCalled();
    expect(dependencies.extractor.run).not.toHaveBeenCalled();
    expect(dependencies.appLogger.error).toHaveBeenCalledWith(
      expect.stringContaining("SITE_ANNOUNCEMENT_URL")
    );
  });
});
