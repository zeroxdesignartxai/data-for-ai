import crypto from "node:crypto";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { ReleaseMetadata } from "./schemas.js";

export type PackBuilderInput = {
  metadata: ReleaseMetadata;
  audioPath: string;
  coverPath: string;
  outputDirectory: string;
  timestamp?: Date;
};

export type PackBuilderResult = {
  rootPath: string;
  mastersPath: string;
  artworkPath: string;
  metadataPath: string;
  evidencePath: string;
  files: {
    audio: string;
    cover: string;
    metadataJson: string;
    metadataCsv: string;
    hashes: string;
    certificate: string;
  };
};

const pad = (value: number) => value.toString().padStart(2, "0");

const formatTimestamp = (date: Date) => {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(
    date.getHours()
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

const sanitize = (value: string) => value.replace(/[\\/:*?"<>|]/g, "-");

export const toMetadataCsv = (metadata: ReleaseMetadata) => {
  const headers = [
    "primaryArtist",
    "trackTitle",
    "releaseTitle",
    "genre",
    "language",
    "explicit",
    "releaseDate"
  ];
  const values = headers.map((key) => {
    const raw = metadata[key as keyof ReleaseMetadata];
    return typeof raw === "boolean" ? String(raw) : raw ?? "";
  });
  return `${headers.join(",")}\n${values.join(",")}`;
};

const sha256File = async (filePath: string) => {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

export const buildReleasePack = async (input: PackBuilderInput): Promise<PackBuilderResult> => {
  const timestamp = input.timestamp ?? new Date();
  const folderName = `${sanitize(input.metadata.releaseTitle)} - ${formatTimestamp(timestamp)}`;
  const rootPath = path.join(input.outputDirectory, folderName);
  const mastersPath = path.join(rootPath, "Masters");
  const artworkPath = path.join(rootPath, "Artwork");
  const metadataPath = path.join(rootPath, "Metadata");
  const evidencePath = path.join(rootPath, "Evidence");

  await fs.mkdir(mastersPath, { recursive: true });
  await fs.mkdir(artworkPath, { recursive: true });
  await fs.mkdir(metadataPath, { recursive: true });
  await fs.mkdir(evidencePath, { recursive: true });

  const audioExt = path.extname(input.audioPath);
  const coverExt = path.extname(input.coverPath);
  const audioFileName = `01 - ${sanitize(input.metadata.trackTitle)}${audioExt}`;
  const coverFileName = `cover${coverExt}`;

  const audioTarget = path.join(mastersPath, audioFileName);
  const coverTarget = path.join(artworkPath, coverFileName);
  await fs.copyFile(input.audioPath, audioTarget);
  await fs.copyFile(input.coverPath, coverTarget);

  const metadataJson = path.join(metadataPath, "metadata.json");
  const metadataCsv = path.join(metadataPath, "metadata.csv");
  await fs.writeFile(metadataJson, JSON.stringify(input.metadata, null, 2), "utf8");
  await fs.writeFile(metadataCsv, toMetadataCsv(input.metadata), "utf8");

  const hashesFile = path.join(evidencePath, "sha256.txt");
  const filesToHash = [audioTarget, coverTarget, metadataJson, metadataCsv];
  const hashLines = [];
  for (const file of filesToHash) {
    const hash = await sha256File(file);
    hashLines.push(`${path.relative(rootPath, file)}  ${hash}`);
  }
  await fs.writeFile(hashesFile, hashLines.join("\n"), "utf8");

  const certificateFile = path.join(evidencePath, "release-certificate.pdf");
  await writeCertificatePdf(certificateFile, input.metadata, hashLines);

  return {
    rootPath,
    mastersPath,
    artworkPath,
    metadataPath,
    evidencePath,
    files: {
      audio: audioTarget,
      cover: coverTarget,
      metadataJson,
      metadataCsv,
      hashes: hashesFile,
      certificate: certificateFile
    }
  };
};

const writeCertificatePdf = async (
  outputPath: string,
  metadata: ReleaseMetadata,
  hashLines: string[]
) => {
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = doc.pipe(createWriteStream(outputPath));

    doc.fontSize(20).text("ReleaseShield Certificate", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Artist: ${metadata.primaryArtist}`);
    doc.text(`Track Title: ${metadata.trackTitle}`);
    doc.text(`Release Title: ${metadata.releaseTitle}`);
    doc.text(`Genre: ${metadata.genre}`);
    doc.text(`Language: ${metadata.language}`);
    doc.text(`Explicit: ${metadata.explicit ? "Yes" : "No"}`);
    if (metadata.releaseDate) {
      doc.text(`Release Date: ${metadata.releaseDate}`);
    }

    doc.moveDown();
    doc.text("SHA-256 Evidence", { underline: true });
    hashLines.forEach((line) => doc.text(line));

    doc.end();

    stream.on("finish", () => resolve());
    stream.on("error", (error) => reject(error));
  });
};
