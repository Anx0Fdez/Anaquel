import { useEffect, useRef, useState } from "react";
import { ArrowUpCircle, Download } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { checkForUpdate } from "../../lib/updateCheck";
import type { UpdateInfo } from "../../types/update";
import { useDismiss } from "../../lib/useDismiss";
import "./UpdateBadge.css";

export function UpdateBadge() {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    checkForUpdate()
      .then((result) => {
        if (!cancelled) setInfo(result);
      })
      .catch(() => {
        // comprobación silenciosa: sin conexión o fallo de red, no pasa nada visible
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useDismiss(open, rootRef, () => setOpen(false));

  if (!info) return null;

  return (
    <div className="update-badge" ref={rootRef}>
      <button
        type="button"
        className="update-badge-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label="Nueva versión disponible"
        title="Nueva versión disponible"
      >
        <ArrowUpCircle size={15} strokeWidth={2} />
      </button>
      {open && (
        <div className="update-badge-popover">
          <h3>Nueva versión disponible</h3>
          <div className="update-badge-versions">
            <span>
              Instalada: <strong>v{info.installed}</strong>
            </span>
            <span>
              Disponible: <strong>v{info.version}</strong>
            </span>
          </div>
          <button type="button" className="update-badge-download" onClick={() => openUrl(info.url)}>
            <Download size={14} strokeWidth={2} />
            Ver la versión
          </button>
        </div>
      )}
    </div>
  );
}
