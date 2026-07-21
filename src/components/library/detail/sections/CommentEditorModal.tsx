import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import "../../../ui/Dialog.css";
import "./CommentEditorModal.css";

interface CommentEditorModalProps {
  value: string;
  onCancel: () => void;
  onSave: (value: string) => void;
}

const CLOSE_MS = 190;

export function CommentEditorModal({ value, onCancel, onSave }: CommentEditorModalProps) {
  const [draft, setDraft] = useState(value);
  const [closing, setClosing] = useState(false);

  function close(after: () => void) {
    setClosing(true);
    window.setTimeout(after, CLOSE_MS);
  }

  return (
    <div
      className={`comment-modal-backdrop${closing ? " comment-modal-backdrop--closing" : ""}`}
      onClick={() => close(onCancel)}
    >
      <div
        className={`comment-modal${closing ? " comment-modal--closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="comment-modal-header">
          <h2>
            <MessageSquare size={16} strokeWidth={2} />
            Comentarios
          </h2>
          <button
            type="button"
            className="comment-modal-close"
            onClick={() => close(onCancel)}
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <textarea
          className="comment-modal-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe aquí tus comentarios sobre este libro…"
          autoFocus
        />

        <div className="comment-modal-actions">
          <button type="button" className="dialog-btn-secondary" onClick={() => close(onCancel)}>
            Cancelar
          </button>
          <button type="button" className="dialog-btn-primary" onClick={() => close(() => onSave(draft))}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
