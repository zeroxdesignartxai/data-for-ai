import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildReleasePack, releaseMetadataSchema } from "../src/index.js";

const createTempDir = async () => {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "releaseshield-"));
  return base;
};

describe("releaseMetadataSchema", () => {
  it("validates required fields", () => {
    const result = releaseMetadataSchema.safeParse({
      primaryArtist: "Artist",
      trackTitle: "Track",
      releaseTitle: "Release",
      genre: "Pop",
      language: "English",
      explicit: false
    });

    expect(result.success).toBe(true);
  });
});

describe("buildReleasePack", () => {
  it("creates the expected folders and files", async () => {
    const tempDir = await createTempDir();
    const audioPath = path.join(tempDir, "audio.wav");
    const coverPath = path.join(tempDir, "cover.png");
    await fs.writeFile(audioPath, "dummy-audio");
    await fs.writeFile(coverPath, "dummy-cover");

    const metadata = {
      primaryArtist: "Artist",
      trackTitle: "Track Title",
      releaseTitle: "Release Title",
      genre: "Pop",
      language: "English",
      explicit: false,
      releaseDate: "2025-01-01"
    };

    const result = await buildReleasePack({
      metadata,
      audioPath,
      coverPath,
      outputDirectory: tempDir,
      timestamp: new Date("2025-01-01T12:00:00Z")
    });

    const hashContent = await fs.readFile(result.files.hashes, "utf8");

    await expect(fs.stat(result.files.audio)).resolves.toBeDefined();
    await expect(fs.stat(result.files.cover)).resolves.toBeDefined();
    await expect(fs.stat(result.files.metadataJson)).resolves.toBeDefined();
    await expect(fs.stat(result.files.metadataCsv)).resolves.toBeDefined();
    await expect(fs.stat(result.files.certificate)).resolves.toBeDefined();
    expect(hashContent).toContain("Masters");
    expect(hashContent).toContain("Artwork");
  });
});
