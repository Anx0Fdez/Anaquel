import type { Book, FormatoLibro } from "../../../../types/book";
import { FORMATO_LABEL } from "../../../../types/book";
import { DetailSection } from "../DetailSection";
import { TextField } from "../../../ui/fields/TextField";
import { SelectField } from "../../../ui/fields/SelectField";
import { TagsField } from "../../../ui/fields/TagsField";
import { DateField } from "../../../ui/fields/DateField";

interface InfoGeneralSectionProps {
  book: Book;
  onChange: (book: Book) => void;
}

const FORMATOS: FormatoLibro[] = ["fisico", "ebook", "audiolibro"];
const FORMATO_OPTIONS = FORMATOS.map((f) => ({ value: f, label: FORMATO_LABEL[f] }));

export function InfoGeneralSection({ book, onChange }: InfoGeneralSectionProps) {
  return (
    <DetailSection title="Información general">
      <div className={`book-detail-cover spine--${book.estado}`} aria-hidden />

      <TextField label="Título" value={book.titulo} onChange={(v) => onChange({ ...book, titulo: v })} wide />
      <TextField
        label="Subtítulo"
        value={book.subtitulo ?? ""}
        onChange={(v) => onChange({ ...book, subtitulo: v.trim() || null })}
        wide
      />

      <TextField label="Autor" value={book.autor} onChange={(v) => onChange({ ...book, autor: v })} />
      <TagsField
        label="Autores adicionales"
        values={book.autores_adicionales}
        onChange={(v) => onChange({ ...book, autores_adicionales: v })}
        placeholder="Traductor, ilustrador…"
      />

      <TextField label="ISBN" value={book.isbn ?? ""} onChange={(v) => onChange({ ...book, isbn: v.trim() || null })} />
      <TextField
        label="ISBN-13"
        value={book.isbn13 ?? ""}
        onChange={(v) => onChange({ ...book, isbn13: v.trim() || null })}
      />

      <SelectField
        label="Formato"
        value={book.formato}
        options={FORMATO_OPTIONS}
        onChange={(v) => onChange({ ...book, formato: v as FormatoLibro })}
      />
      <TextField
        label="Idioma"
        value={book.idioma ?? ""}
        onChange={(v) => onChange({ ...book, idioma: v.trim() || null })}
        placeholder="es, en…"
      />

      <TextField
        label="Editorial"
        value={book.editorial ?? ""}
        onChange={(v) => onChange({ ...book, editorial: v.trim() || null })}
      />
      <DateField
        label="Fecha de publicación"
        value={book.fecha_publicacion ?? ""}
        onChange={(v) => onChange({ ...book, fecha_publicacion: v || null })}
      />

      <TextField
        label="Número de páginas"
        type="number"
        value={book.progreso.paginas_totales != null ? String(book.progreso.paginas_totales) : ""}
        onChange={(v) => {
          const n = v.trim() === "" ? null : Number(v);
          onChange({
            ...book,
            progreso: { ...book.progreso, paginas_totales: n != null && !Number.isNaN(n) ? n : null },
          });
        }}
      />
      <TextField
        label="Colección / saga"
        value={book.saga?.nombre ?? ""}
        onChange={(v) => {
          const nombre = v.trim();
          if (!nombre) {
            onChange({ ...book, saga: null });
            return;
          }
          onChange({
            ...book,
            saga: { nombre, numero: book.saga?.numero ?? 1, total_libros: book.saga?.total_libros ?? null },
          });
        }}
      />

      {book.saga && (
        <>
          <TextField
            label="Número en la saga"
            type="number"
            value={String(book.saga.numero)}
            onChange={(v) => {
              const n = Number(v);
              if (!book.saga) return;
              onChange({ ...book, saga: { ...book.saga, numero: Number.isNaN(n) ? 1 : n } });
            }}
          />
          <TextField
            label="Total de libros en la saga"
            type="number"
            value={book.saga.total_libros != null ? String(book.saga.total_libros) : ""}
            onChange={(v) => {
              const n = v.trim() === "" ? null : Number(v);
              if (!book.saga) return;
              onChange({
                ...book,
                saga: { ...book.saga, total_libros: n != null && !Number.isNaN(n) ? n : null },
              });
            }}
          />
        </>
      )}
    </DetailSection>
  );
}
