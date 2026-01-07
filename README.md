# ReleaseShield

ReleaseShield is a Windows-first Electron + React desktop app with a local Express AI service for preparing music release packs using a BYOK (Bring Your Own OpenAI Key) workflow.

## Monorepo Layout

```
apps/desktop       Electron + React + TypeScript UI
services/local-ai  Express + TypeScript AI service
packages/core      Shared schemas, validators, pack builder utilities
```

## Requirements

- Node.js 18+
- Windows 10/11

## Setup

```powershell
npm install
```

## Run (Dev)

```powershell
npm run dev
```

This starts:
- Desktop app (Electron)
- Local AI service at `http://127.0.0.1:8787`

## Build

```powershell
npm run build
```

## Usage Highlights

- Store your OpenAI key securely with Windows Credential Manager (via `keytar`).
- Validate audio and artwork locally before exporting a Release Pack.
- Generate metadata and checklist content using the local AI service.
- Use the DistroKid helper to copy fields and open the official upload page.

## Roadmap (Upgrade Ideas)

- Add drag-and-drop for files in the New Release flow.
- Persist recent releases locally (no cloud) for quick reuse.
- Add multi-track pack exports for albums/EPs.
- Optional CLI export for automation pipelines.

## Security Notes

- Keys are never stored in files or localStorage.
- Keys are stored in Windows Credential Manager via `keytar`.
- The local AI service only accepts localhost origins.
