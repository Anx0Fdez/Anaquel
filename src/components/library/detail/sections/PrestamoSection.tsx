import type { Book } from "../../../../types/book";
import { DetailSection } from "../DetailSection";
import { TextField } from "../../../ui/fields/TextField";
import { DateField } from "../../../ui/fields/DateField";
import { ToggleField } from "../../../ui/fields/ToggleField";

interface PrestamoSectionProps {
  book: Book;
  onChange: (book: Book) => void;
}

export function PrestamoSection({ book, onChange }: PrestamoSectionProps) {
  const prestamo = book.prestamo;

  return (
    <DetailSection title="Préstamo">
      <ToggleField
        label="Prestado"
        checked={prestamo != null}
        onChange={(v) =>
          onChange({
            ...book,
            prestamo: v ? { persona: "", fecha: null, devolucion_prevista: null } : null,
          })
        }
      />

      {prestamo && (
        <>
          <TextField
            label="Persona"
            value={prestamo.persona}
            onChange={(v) => onChange({ ...book, prestamo: { ...prestamo, persona: v } })}
          />
          <DateField
            label="Fecha de préstamo"
            value={prestamo.fecha ?? ""}
            onChange={(v) => onChange({ ...book, prestamo: { ...prestamo, fecha: v || null } })}
          />
          <DateField
            label="Devolución prevista"
            value={prestamo.devolucion_prevista ?? ""}
            onChange={(v) => onChange({ ...book, prestamo: { ...prestamo, devolucion_prevista: v || null } })}
          />
        </>
      )}
    </DetailSection>
  );
}
