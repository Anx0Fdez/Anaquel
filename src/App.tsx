import { useEffect, useState } from "react";
import { TitleBar } from "./components/layout/TitleBar";
import { LibraryScreen } from "./components/LibraryScreen";
import { VaultPicker } from "./components/library/VaultPicker";
import { listRecentVaults, openVault } from "./lib/vault";
import { getPlatform, type Platform } from "./lib/platform";
import type { VaultInfo } from "./types/vault";
import "./styles/theme.css";
import "./App.css";

type Phase = { kind: "loading" } | { kind: "picker" } | { kind: "library"; vault: VaultInfo };

export default function App() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [platform, setPlatform] = useState<Platform>("windows");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  useEffect(() => {
    let cancelled = false;

    getPlatform()
      .then((p) => {
        if (!cancelled) setPlatform(p);
      })
      .catch(() => {
        // sin plataforma detectada, se queda con el valor por defecto (controles propios)
      });

    listRecentVaults()
      .then(async (recent) => {
        if (cancelled) return;
        if (recent.length === 0) {
          setPhase({ kind: "picker" });
          return;
        }
        try {
          const vault = await openVault(recent[0].path);
          if (!cancelled) setPhase({ kind: "library", vault });
        } catch {
          if (!cancelled) setPhase({ kind: "picker" });
        }
      })
      .catch(() => {
        if (!cancelled) setPhase({ kind: "picker" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app-window">
      <TitleBar platform={platform} />
      <div className="app-window-content">
        {phase.kind === "loading" && <div className="app-loading" />}
        {phase.kind === "picker" && (
          <VaultPicker onVaultReady={(vault) => setPhase({ kind: "library", vault })} />
        )}
        {phase.kind === "library" && (
          <LibraryScreen vault={phase.vault} onSwitchVault={() => setPhase({ kind: "picker" })} />
        )}
      </div>
    </div>
  );
}
