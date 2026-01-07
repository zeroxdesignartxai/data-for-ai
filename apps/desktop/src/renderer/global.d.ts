import type { ReleaseShieldApi } from "../preload/index.js";

declare global {
  interface Window {
    releaseshield: ReleaseShieldApi;
  }
}
