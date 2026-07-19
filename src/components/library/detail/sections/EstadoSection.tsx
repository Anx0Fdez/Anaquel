import { BookOpen, Calendar, ListChecks } from "lucide-react";
import type { Book, EstadoLectura } from "../../../../types/book";
import { ESTADOS_LECTURA, estadoLabel } from "../../../../types/book";
import { DetailSection } from "../DetailSection";
import { SelectField } from "../../../ui/fields/SelectField";
import { DateField } from "../../../ui/fields/DateField";
import { ToggleField } from "../../../ui/fields/ToggleField";

interface EstadoSectionProps {
  book: Book;
  onChange: (book: Book) => void;
}

export function EstadoSection({ book, onChange }: EstadoSectionProps) {
  const audio = book.formato === "audiolibro";
  const ESTADO_OPTIONS = ESTADOS_LECTURA.map((e) => ({
    value: e,
    label: estadoLabel(e, audio),
  }));

  const showComprarFisico = audio && book.estado === "leido";

  return (
    <DetailSection
      title="Estado"
      icon={ListChecks}
      actions={
        !audio &&
        book.estado === "leido" && (
          <ToggleField
            label="Relectura"
            checked={book.relectura}
            onChange={(v) => onChange({ ...book, relectura: v })}
          />
        )
      }
    >
      <div className="fact-row fact-row--estado detail-field-wide">
        <BookOpen size={14} strokeWidth={2} />
        <SelectField
          label={audio ? "Estado de escucha" : "Estado de lectura"}
          value={book.estado}
          options={ESTADO_OPTIONS}
          onChange={(v) => onChange({ ...book, estado: v as EstadoLectura })}
          compact
          direction="up"
        />
        {showComprarFisico && (
          <ToggleField
            label="Comprar en físico"
            checked={book.comprar_fisico}
            onChange={(v) => onChange({ ...book, comprar_fisico: v })}
            className="toggle-inline"
          />
        )}
      </div>

      <div className="detail-field-wide fechas-row">
        <div className="fact-row">
          <Calendar size={14} strokeWidth={2} />
          <DateField
            label="Fecha de inicio"
            value={book.fechas.inicio_lectura ?? ""}
            onChange={(v) => onChange({ ...book, fechas: { ...book.fechas, inicio_lectura: v || null } })}
          />
        </div>
        <div className="fact-row">
          <Calendar size={14} strokeWidth={2} />
          <DateField
            label="Fecha de fin"
            value={book.fechas.fin_lectura ?? ""}
            onChange={(v) => onChange({ ...book, fechas: { ...book.fechas, fin_lectura: v || null } })}
          />
        </div>
      </div>
    </DetailSection>
  );
}
