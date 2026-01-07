import React, { useState } from "react";
import { useRelease } from "../components/ReleaseContext";

const CopyRow = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="copy-row">
      <div>
        <strong>{label}</strong>
        <div className="muted">{value || "—"}</div>
      </div>
      <button type="button" onClick={handleCopy} disabled={!value}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
};

const DistroKidPage = () => {
  const { state } = useRelease();

  const openDistroKid = async () => {
    await window.releaseshield.openExternal("https://distrokid.com/new");
  };

  return (
    <section>
      <h2>DistroKid Upload Assistant</h2>
      <p className="muted">
        Copy fields below and paste them into the official DistroKid upload flow. ReleaseShield
        does not automate uploads.
      </p>

      <div className="card">
        <CopyRow label="Artist" value={state.primaryArtist} />
        <CopyRow label="Track Title" value={state.trackTitle} />
        <CopyRow label="Release Title" value={state.releaseTitle} />
        <CopyRow label="Genre" value={state.genre} />
        <CopyRow label="Language" value={state.language} />
        <CopyRow label="Explicit" value={state.explicit ? "Yes" : "No"} />
        <CopyRow label="Release Date" value={state.releaseDate} />
        <button type="button" onClick={openDistroKid}>
          Open DistroKid Upload Page
        </button>
      </div>
    </section>
  );
};

export default DistroKidPage;
