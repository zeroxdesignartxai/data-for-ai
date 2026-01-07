import React, { useState } from "react";
import { ReleaseProvider } from "../components/ReleaseContext";
import SettingsPage from "./SettingsPage";
import NewReleasePage from "./NewReleasePage";
import DistroKidPage from "./DistroKidPage";

const tabs = [
  { id: "settings", label: "Settings" },
  { id: "release", label: "New Release" },
  { id: "distrokid", label: "DistroKid Assistant" }
] as const;

const App = () => {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("settings");

  return (
    <ReleaseProvider>
      <div className="app">
        <aside className="sidebar">
          <h1>ReleaseShield</h1>
          <nav>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={active === tab.id ? "active" : ""}
                onClick={() => setActive(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="content">
          {active === "settings" && <SettingsPage />}
          {active === "release" && <NewReleasePage />}
          {active === "distrokid" && <DistroKidPage />}
        </main>
      </div>
    </ReleaseProvider>
  );
};

export default App;
