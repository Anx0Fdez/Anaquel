import type { Book, EstadoLectura } from "../../../../types/book";
import { ESTADO_LABEL } from "../../../../types/book";
import { DetailSection } from "../DetailSection";
import { TextField } from "../../../ui/fields/TextField";
import { SelectField } from "../../../ui/fields/SelectField";
import { DateField } from "../../../ui/fields/DateField";
import { ToggleField } from "../../../ui/fields/ToggleField";

interface EstadoSectionProps {
  book: Book;
  onChange: (book: Book) => void;
}

const ESTADOS: EstadoLectura[] = ["quiero_leer", "leyendo", "leido", "audiolibro", "abandonado"];
const ESTADO_OPTIONS = ESTADOS.map((e) => ({ value: e, label: ESTADO_LABEL[e] }));

function numberOrNull(v: string): number | null {
  const n = v.trim() === "" ? null : Number(v);
  return n != null && !Number.isNaN(n) ? n : null;
}

export function EstadoSection({ book, onChange }: EstadoSectionProps) {
  return (
    <DetailSection title="Estado">
      <SelectField
        label="Estado de lectura"
        value={book.estado}
        options={ESTADO_OPTIONS}
        onChange={(v) => onChange({ ...book, estado: v as EstadoLectura })}
      />
      <ToggleField label="Favorito" checked={book.favorito} onChange={(v) => onChange({ ...book, favorito: v })} />

      <TextField
        label="Página actual"
        type="number"
        value={book.progreso.pagina_actual != null ? String(book.progreso.pagina_actual) : ""}
        onChange={(v) =>
          onChange({ ...book, progreso: { ...book.progreso, pagina_actual: numberOrNull(v) } })
        }
      />
      <TextField
        label="Progreso (%)"
        type="number"
        value={book.progreso.porcentaje != null ? String(book.progreso.porcentaje) : ""}
        onChange={(v) => {
          const n = numberOrNull(v);
          onChange({
            ...book,
            progreso: { ...book.progreso, porcentaje: n != null ? Math.min(100, Math.max(0, n)) : null },
          });
        }}
      />

      <TextField
        label="Valoración (0-5)"
        type="number"
        value={book.valoracion != null ? String(book.valoracion) : ""}
        onChange={(v) => {
          const n = numberOrNull(v);
          onChange({ ...book, valoracion: n != null ? Math.min(5, Math.max(0, n)) : null });
        }}
      />

      <DateField
        label="Fecha de inicio"
        value={book.fechas.inicio_lectura ?? ""}
        onChange={(v) => onChange({ ...book, fechas: { ...book.fechas, inicio_lectura: v || null } })}
      />
      <DateField
        label="Fecha de fin"
        value={book.fechas.fin_lectura ?? ""}
        onChange={(v) => onChange({ ...book, fechas: { ...book.fechas, fin_lectura: v || null } })}
      />
    </DetailSection>
  );
}
