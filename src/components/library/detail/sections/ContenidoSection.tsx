import type { Book } from "../../../../types/book";
import { DetailSection } from "../DetailSection";
import { TextareaField } from "../../../ui/fields/TextareaField";
import { TagsField } from "../../../ui/fields/TagsField";

interface ContenidoSectionProps {
  book: Book;
  onChange: (book: Book) => void;
}

export function ContenidoSection({ book, onChange }: ContenidoSectionProps) {
  return (
    <DetailSection title="Contenido">
      <TextareaField
        label="Descripción"
        value={book.descripcion ?? ""}
        onChange={(v) => onChange({ ...book, descripcion: v.trim() || null })}
      />
      <TextareaField label="Notas" value={book.notas} onChange={(v) => onChange({ ...book, notas: v })} />
      <TagsField
        label="Citas"
        values={book.citas}
        onChange={(v) => onChange({ ...book, citas: v })}
        placeholder="Añade una cita y pulsa Enter…"
        wide
      />
    </DetailSection>
  );
}
