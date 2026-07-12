import { useState } from "react";
import { FolderOpen, X } from "lucide-react";
import { createVault, pickFolder } from "../../lib/vault";
import type { VaultInfo } from "../../types/vault";
import "../ui/Dialog.css";

interface CreateVaultDialogProps {
  onCreated: (vault: VaultInfo) => void;
  onClose: () => void;
}

export function CreateVaultDialog({ onCreated, onClose }: CreateVaultDialogProps) {
  const [name, setName] = useState("Mi Anaquel");
  const [parentDir, setParentDir] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBrowse() {
    const folder = await pickFolder("Elige dónde crear la biblioteca");
    if (folder) setParentDir(folder);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parentDir) {
      setError("Elige antes una carpeta donde crearla.");
      return;
    }
    if (!name.trim()) {
      setError("Ponle un nombre a la biblioteca.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const vault = await createVault(parentDir, name.trim());
      onCreated(vault);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="dialog-header">
          <h2>Crear nueva biblioteca</h2>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <label className="dialog-field">
          <span>Nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        </label>

        <label className="dialog-field">
          <span>Ubicación</span>
          <button type="button" className="dialog-browse-btn" onClick={handleBrowse}>
            <FolderOpen size={15} />
            {parentDir ?? "Elegir carpeta…"}
          </button>
        </label>

        {parentDir && (
          <p className="dialog-hint">
            Se creará en <code>{parentDir}\{name.trim() || "…"}</code>
          </p>
        )}

        {error && <p className="dialog-error">{error}</p>}

        <div className="dialog-actions">
          <button type="button" className="dialog-btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="dialog-btn-primary" disabled={busy}>
            {busy ? "Creando…" : "Crear biblioteca"}
          </button>
        </div>
      </form>
    </div>
  );
}
