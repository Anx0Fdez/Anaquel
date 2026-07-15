import { useMemo } from "react";
import { Plus } from "lucide-react";
import type { Book, Nota } from "../../../../types/book";
import { DetailSection } from "../DetailSection";
import { NoteCard } from "../NoteCard";
import "../../../ui/fields/Fields.css";

interface NotasSectionProps {
  book: Book;
  onChange: (book: Book) => void;
}

export function NotasSection({ book, onChange }: NotasSectionProps) {
  const sorted = useMemo(
    () => [...book.notas].sort((a, b) => b.fecha_modificacion.localeCompare(a.fecha_modificacion)),
    [book.notas],
  );

  function addNota() {
    const now = new Date().toISOString();
    const nueva: Nota = {
      id: crypto.randomUUID(),
      titulo: null,
      contenido: "",
      fecha_creacion: now,
      fecha_modificacion: now,
    };
    onChange({ ...book, notas: [nueva, ...book.notas] });
  }

  function updateNota(updated: Nota) {
    onChange({ ...book, notas: book.notas.map((n) => (n.id === updated.id ? updated : n)) });
  }

  function deleteNota(id: string) {
    onChange({ ...book, notas: book.notas.filter((n) => n.id !== id) });
  }

  return (
    <DetailSection title="Notas">
      <button type="button" className="detail-add-btn detail-field-wide" onClick={addNota}>
        <Plus size={14} />
        Añadir nota
      </button>

      {sorted.length === 0 ? (
        <p className="detail-empty detail-field-wide">Todavía no hay notas para este libro.</p>
      ) : (
        sorted.map((nota) => (
          <NoteCard key={nota.id} nota={nota} onChange={updateNota} onDelete={() => deleteNota(nota.id)} />
        ))
      )}
    </DetailSection>
  );
}
