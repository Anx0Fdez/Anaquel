import type { Book } from "../../../../types/book";
import { DetailSection } from "../DetailSection";
import { TagsField } from "../../../ui/fields/TagsField";

interface OrganizacionSectionProps {
  book: Book;
  onChange: (book: Book) => void;
}

export function OrganizacionSection({ book, onChange }: OrganizacionSectionProps) {
  return (
    <DetailSection title="Organización">
      <TagsField
        label="Etiquetas"
        values={book.etiquetas}
        onChange={(v) => onChange({ ...book, etiquetas: v })}
        placeholder="Relectura, pendiente…"
      />
    </DetailSection>
  );
}
