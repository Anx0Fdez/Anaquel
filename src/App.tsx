import { useEffect, useState } from "react";
import { LibraryScreen } from "./components/LibraryScreen";
import { VaultPicker } from "./components/library/VaultPicker";
import { listRecentVaults, openVault } from "./lib/vault";
import type { VaultInfo } from "./types/vault";
import "./styles/theme.css";
import "./App.css";

type Phase =
  | { kind: "loading" }
  | { kind: "picker" }
  | { kind: "library"; vault: VaultInfo };

export default function App() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  useEffect(() => {
    let cancelled = false;
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

  if (phase.kind === "loading") {
    return <div className="app-loading" />;
  }

  if (phase.kind === "picker") {
    return <VaultPicker onVaultReady={(vault) => setPhase({ kind: "library", vault })} />;
  }

  return (
    <LibraryScreen vault={phase.vault} onSwitchVault={() => setPhase({ kind: "picker" })} />
  );
}
