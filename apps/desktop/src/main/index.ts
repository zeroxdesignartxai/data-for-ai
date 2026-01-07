import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { join } from "node:path";
import keytar from "keytar";
import { parseFile } from "music-metadata";
import sharp from "sharp";
import { buildReleasePack, releaseMetadataSchema } from "@releaseshield/core";

const SERVICE_NAME = "ReleaseShield";
const ACCOUNT_NAME = "openai-api-key";

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("key:status", async () => {
  const key = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  return { hasKey: Boolean(key) };
});

ipcMain.handle("key:save", async (_event, apiKey: string) => {
  await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, apiKey);
  return { ok: true };
});

ipcMain.handle("key:delete", async () => {
  await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  return { ok: true };
});

ipcMain.handle("key:test", async () => {
  const apiKey = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  if (!apiKey) {
    return { ok: false, error: "No key saved" };
  }
  try {
    const response = await fetch("http://127.0.0.1:8787/ai/test-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return { ok: false, error: "Local AI service unavailable" };
  }
});

ipcMain.handle("dialog:pick-audio", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Audio", extensions: ["wav", "flac", "aiff", "mp3"] }
    ]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("dialog:pick-cover", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png"] }]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("dialog:pick-output", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("release:validate", async (_event, audioPath: string, coverPath: string) => {
  const errors: string[] = [];
  try {
    const metadata = await parseFile(audioPath);
    const duration = metadata.format.duration ?? 0;
    if (duration <= 30) {
      errors.push("Audio duration must be longer than 30 seconds.");
    }
  } catch (error) {
    errors.push("Audio file could not be read.");
  }

  try {
    const image = sharp(coverPath);
    const info = await image.metadata();
    if (!info.width || !info.height) {
      errors.push("Cover image dimensions could not be read.");
    } else if (info.width !== info.height) {
      errors.push("Cover image must be square (1:1). Please resize.");
    }
  } catch (error) {
    errors.push("Cover image could not be read.");
  }

  return { ok: errors.length === 0, errors };
});

ipcMain.handle("release:export", async (_event, payload: unknown) => {
  const data = payload as Record<string, unknown>;
  const metadata = {
    primaryArtist: data.primaryArtist,
    trackTitle: data.trackTitle,
    releaseTitle: data.releaseTitle,
    genre: data.genre,
    language: data.language,
    explicit: data.explicit,
    releaseDate: data.releaseDate
  };
  const parsed = releaseMetadataSchema.safeParse(metadata);
  if (!parsed.success) {
    return { ok: false, error: "Invalid metadata" };
  }

  const { audioPath, coverPath, outputDirectory } = data as {
    audioPath: string;
    coverPath: string;
    outputDirectory: string;
  };

  if (!audioPath || !coverPath || !outputDirectory) {
    return { ok: false, error: "Missing files or output directory" };
  }

  try {
    const result = await buildReleasePack({
      metadata: parsed.data,
      audioPath,
      coverPath,
      outputDirectory
    });
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error: "Failed to export release pack" };
  }
});

ipcMain.handle("system:open-external", async (_event, url: string) => {
  await shell.openExternal(url);
  return { ok: true };
});
