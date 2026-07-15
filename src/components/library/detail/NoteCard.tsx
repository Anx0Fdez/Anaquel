import { useDraftValue } from "../../ui/fields/useDraftValue";
import { ConfirmDeleteButton } from "../../ui/ConfirmDeleteButton";
import type { Nota } from "../../../types/book";
import "./NoteCard.css";

interface NoteCardProps {
  nota: Nota;
  onChange: (nota: Nota) => void;
  onDelete: () => void;
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NoteCard({ nota, onChange, onDelete }: NoteCardProps) {
  const titulo = useDraftValue(nota.titulo ?? "", (v) => {
    onChange({ ...nota, titulo: v.trim() || null, fecha_modificacion: new Date().toISOString() });
  });
  const contenido = useDraftValue(nota.contenido, (v) => {
    onChange({ ...nota, contenido: v, fecha_modificacion: new Date().toISOString() });
  });

  return (
    <div className="note-card detail-field-wide">
      <div className="note-card-header">
        <input
          className="note-card-title"
          value={titulo.draft}
          placeholder="Título (opcional)"
          onChange={(e) => titulo.setDraft(e.target.value)}
          onBlur={titulo.commit}
        />
        <ConfirmDeleteButton size="sm" onConfirm={onDelete} confirmText="¿Eliminar esta nota?" />
      </div>

      <textarea
        className="note-card-content"
        value={contenido.draft}
        placeholder="Escribe aquí…"
        onChange={(e) => contenido.setDraft(e.target.value)}
        onBlur={contenido.commit}
      />

      <div className="note-card-meta">Editado {formatFecha(nota.fecha_modificacion)}</div>
    </div>
  );
}
