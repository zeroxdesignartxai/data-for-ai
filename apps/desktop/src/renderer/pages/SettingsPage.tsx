import React, { useEffect, useState } from "react";

const SettingsPage = () => {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("Checking key status...");
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const refreshStatus = async () => {
    const result = await window.releaseshield.getKeyStatus();
    setStatus(result.hasKey ? "Key saved" : "No key saved");
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleSave = async () => {
    if (!apiKey) {
      setTestStatus("Please enter a key before saving.");
      return;
    }
    await window.releaseshield.saveKey(apiKey);
    setApiKey("");
    await refreshStatus();
    setTestStatus("Key saved.");
  };

  const handleDelete = async () => {
    await window.releaseshield.deleteKey();
    await refreshStatus();
    setTestStatus("Key deleted.");
  };

  const handleTest = async () => {
    setTestStatus("Testing key...");
    const result = await window.releaseshield.testKey();
    setTestStatus(result.ok ? "Key test successful." : `Key test failed: ${result.error}`);
  };

  return (
    <section>
      <h2>Settings</h2>
      <p className="muted">Store your OpenAI key securely in Windows Credential Manager.</p>
      <div className="card">
        <label>
          OpenAI API Key
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-..."
          />
        </label>
        <div className="actions">
          <button type="button" onClick={handleSave}>
            Save Key
          </button>
          <button type="button" className="ghost" onClick={handleDelete}>
            Delete Key
          </button>
          <button type="button" className="ghost" onClick={handleTest}>
            Test Key
          </button>
        </div>
        <div className="status">{status}</div>
        {testStatus && <div className="status">{testStatus}</div>}
      </div>
    </section>
  );
};

export default SettingsPage;
