import React, { useState } from "react";
import { useRelease } from "../components/ReleaseContext";

const NewReleasePage = () => {
  const { state, setState } = useRelease();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const updateField = (field: keyof typeof state, value: string | boolean) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const pickAudio = async () => {
    const path = await window.releaseshield.pickAudio();
    if (path) {
      updateField("audioPath", path);
    }
  };

  const pickCover = async () => {
    const path = await window.releaseshield.pickCover();
    if (path) {
      updateField("coverPath", path);
    }
  };

  const handleExport = async () => {
    setExportStatus(null);
    setValidationErrors([]);

    if (!state.audioPath || !state.coverPath) {
      setValidationErrors(["Please select both an audio file and a cover image."]);
      return;
    }

    const validation = await window.releaseshield.validateRelease(state.audioPath, state.coverPath);
    if (!validation.ok) {
      setValidationErrors(validation.errors);
      return;
    }

    const outputDir = await window.releaseshield.pickOutput();
    if (!outputDir) {
      setExportStatus("Export canceled.");
      return;
    }

    const payload = {
      primaryArtist: state.primaryArtist,
      trackTitle: state.trackTitle,
      releaseTitle: state.releaseTitle,
      genre: state.genre,
      language: state.language,
      explicit: state.explicit,
      releaseDate: state.releaseDate || undefined,
      audioPath: state.audioPath,
      coverPath: state.coverPath,
      outputDirectory: outputDir
    };

    const result = await window.releaseshield.exportRelease(payload);
    setExportStatus(result.ok ? "Release pack exported successfully." : result.error);
  };

  return (
    <section>
      <h2>New Release</h2>
      <div className="grid">
        <label>
          Primary Artist
          <input
            value={state.primaryArtist}
            onChange={(event) => updateField("primaryArtist", event.target.value)}
          />
        </label>
        <label>
          Track Title
          <input
            value={state.trackTitle}
            onChange={(event) => updateField("trackTitle", event.target.value)}
          />
        </label>
        <label>
          Release Title
          <input
            value={state.releaseTitle}
            onChange={(event) => updateField("releaseTitle", event.target.value)}
          />
        </label>
        <label>
          Genre
          <input value={state.genre} onChange={(event) => updateField("genre", event.target.value)} />
        </label>
        <label>
          Language
          <input
            value={state.language}
            onChange={(event) => updateField("language", event.target.value)}
          />
        </label>
        <label>
          Release Date (optional)
          <input
            type="date"
            value={state.releaseDate}
            onChange={(event) => updateField("releaseDate", event.target.value)}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={state.explicit}
            onChange={(event) => updateField("explicit", event.target.checked)}
          />
          Explicit
        </label>
      </div>

      <div className="card">
        <div className="file-row">
          <div>
            <strong>Audio File</strong>
            <div className="muted">{state.audioPath || "No file selected"}</div>
          </div>
          <button type="button" onClick={pickAudio}>
            Select Audio
          </button>
        </div>
        <div className="file-row">
          <div>
            <strong>Cover Image</strong>
            <div className="muted">{state.coverPath || "No file selected"}</div>
          </div>
          <button type="button" onClick={pickCover}>
            Select Cover
          </button>
        </div>
        <button type="button" onClick={handleExport}>
          Export Release Pack
        </button>
      </div>

      {validationErrors.length > 0 && (
        <div className="alert">
          <strong>Validation errors:</strong>
          <ul>
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {exportStatus && <div className="status">{exportStatus}</div>}
    </section>
  );
};

export default NewReleasePage;
