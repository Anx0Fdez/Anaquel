import type { Book } from "../../../../types/book";
import { DetailSection } from "../DetailSection";
import { TextField } from "../../../ui/fields/TextField";
import { TagsField } from "../../../ui/fields/TagsField";
import { RelatedBooksField } from "../RelatedBooksField";

interface OrganizacionSectionProps {
  book: Book;
  allBooks: Book[];
  onChange: (book: Book) => void;
}

export function OrganizacionSection({ book, allBooks, onChange }: OrganizacionSectionProps) {
  return (
    <DetailSection title="Organización">
      <TagsField
        label="Etiquetas"
        values={book.etiquetas}
        onChange={(v) => onChange({ ...book, etiquetas: v })}
        placeholder="Relectura, pendiente…"
      />
      <TextField
        label="Ubicación física"
        value={book.ubicacion_fisica ?? ""}
        onChange={(v) => onChange({ ...book, ubicacion_fisica: v.trim() || null })}
        wide
      />
      <TagsField
        label="Anaqueles"
        values={book.anaqueles}
        onChange={(v) => onChange({ ...book, anaqueles: v })}
        placeholder="Estantería del salón…"
      />
      <RelatedBooksField book={book} allBooks={allBooks} onChange={(ids) => onChange({ ...book, enlaces_relacionados: ids })} />
    </DetailSection>
  );
}
