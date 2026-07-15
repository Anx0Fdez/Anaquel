import type { Book } from "../../../../types/book";
import { DetailSection } from "../DetailSection";
import { TextareaField } from "../../../ui/fields/TextareaField";

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
    </DetailSection>
  );
}
