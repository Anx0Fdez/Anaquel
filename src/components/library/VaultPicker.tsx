import { useEffect, useState } from "react";
import { FolderOpen, FolderPlus, Library, X } from "lucide-react";
import { listRecentVaults, openVault, pickFolder, removeRecentVault } from "../../lib/vault";
import type { RecentVault, VaultInfo } from "../../types/vault";
import { CreateVaultDialog } from "./CreateVaultDialog";
import "./VaultPicker.css";

function timeAgo(millis: number): string {
  const diff = Date.now() - millis;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export function VaultPicker({ onVaultReady }: { onVaultReady: (vault: VaultInfo) => void }) {
  const [recent, setRecent] = useState<RecentVault[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRecentVaults()
      .then(setRecent)
      .catch(() => setRecent([]));
  }, []);

  async function openPath(path: string) {
    setBusy(true);
    setError(null);
    try {
      const vault = await openVault(path);
      onVaultReady(vault);
    } catch (err) {
      setError(String(err));
      setBusy(false);
    }
  }

  async function handleOpenExisting() {
    setError(null);
    const folder = await pickFolder("Selecciona la carpeta de tu anaquel");
    if (!folder) return;
    await openPath(folder);
  }

  async function handleRemoveRecent(path: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const updated = await removeRecentVault(path);
      setRecent(updated);
    } catch {
      // no bloqueamos la UI por un fallo al limpiar la lista de recientes
    }
  }

  return (
    <div className="vault-picker">
      <div className="vault-picker-card">
        <div className="vault-picker-logo">
          <img src="/logo.png" alt="" className="vault-picker-logo-mark" />
          <span>Anaquel</span>
        </div>
        <p className="vault-picker-tagline">
          Tu biblioteca personal, guardada como archivos de texto en tu propio ordenador. Sin
          cuentas, sin servidores.
        </p>

        {error && <div className="vault-picker-error">{error}</div>}

        <div className="vault-picker-actions">
          <button
            className="vault-picker-action"
            onClick={() => setShowCreate(true)}
            disabled={busy}
          >
            <FolderPlus size={20} strokeWidth={2} />
            <span className="vault-picker-action-text">
              <strong>Crear nueva biblioteca</strong>
              <em>Crea una carpeta nueva para empezar de cero</em>
            </span>
          </button>
          <button className="vault-picker-action" onClick={handleOpenExisting} disabled={busy}>
            <FolderOpen size={20} strokeWidth={2} />
            <span className="vault-picker-action-text">
              <strong>Abrir carpeta existente</strong>
              <em>Usa una carpeta que ya tengas (incluso un vault de Obsidian)</em>
            </span>
          </button>
        </div>

        {recent.length > 0 && (
          <>
            <div className="vault-picker-heading">Recientes</div>
            <div className="vault-picker-recent-list">
              {recent.map((r) => (
                <button
                  key={r.path}
                  className="vault-picker-recent-item"
                  onClick={() => openPath(r.path)}
                  disabled={busy}
                >
                  <Library size={14} strokeWidth={2} />
                  <span className="vault-picker-recent-text">
                    <strong>{r.name}</strong>
                    <em>{r.path}</em>
                  </span>
                  <span className="vault-picker-recent-time">{timeAgo(r.lastOpened)}</span>
                  <span
                    className="vault-picker-recent-remove"
                    onClick={(e) => handleRemoveRecent(r.path, e)}
                    role="button"
                    aria-label={`Quitar ${r.name} de recientes`}
                  >
                    <X size={13} />
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {showCreate && (
        <CreateVaultDialog
          onClose={() => setShowCreate(false)}
          onCreated={(vault) => {
            setShowCreate(false);
            onVaultReady(vault);
          }}
        />
      )}
    </div>
  );
}
