import { FileSpreadsheet, X } from "lucide-react";
import "./ExportModal.css";

interface ExportModalProps {
  closing: boolean;
  onCancel: () => void;
}

export function ExportModal({ closing, onCancel }: ExportModalProps) {
  return (
    <div className={`export-modal-backdrop${closing ? " export-modal-backdrop--closing" : ""}`}>
      <div className={`export-modal${closing ? " export-modal--closing" : ""}`}>
        <button
          type="button"
          className="export-modal-close"
          onClick={onCancel}
          aria-label="Cancelar exportación"
          title="Cancelar exportación"
        >
          <X size={14} />
        </button>

        <div className="export-modal-icon-wrap">
          <div className="export-modal-spinner-ring" />
          <FileSpreadsheet className="export-modal-icon" size={26} strokeWidth={1.75} />
        </div>

        <h2 className="export-modal-title">Exportando…</h2>
        <p className="export-modal-desc">Preparando el archivo Excel. Esto puede tardar unos segundos.</p>
      </div>
    </div>
  );
}
