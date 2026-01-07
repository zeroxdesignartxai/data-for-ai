import { contextBridge, ipcRenderer } from "electron";

const api = {
  getKeyStatus: () => ipcRenderer.invoke("key:status"),
  saveKey: (apiKey: string) => ipcRenderer.invoke("key:save", apiKey),
  deleteKey: () => ipcRenderer.invoke("key:delete"),
  testKey: () => ipcRenderer.invoke("key:test"),
  pickAudio: () => ipcRenderer.invoke("dialog:pick-audio"),
  pickCover: () => ipcRenderer.invoke("dialog:pick-cover"),
  pickOutput: () => ipcRenderer.invoke("dialog:pick-output"),
  validateRelease: (audioPath: string, coverPath: string) =>
    ipcRenderer.invoke("release:validate", audioPath, coverPath),
  exportRelease: (payload: unknown) => ipcRenderer.invoke("release:export", payload),
  openExternal: (url: string) => ipcRenderer.invoke("system:open-external", url)
};

contextBridge.exposeInMainWorld("releaseshield", api);

export type ReleaseShieldApi = typeof api;
