import { useEffect, useMemo, useState } from "react";
import { Barcode, Clock, ImagePlus, LibraryBig, Sparkles } from "lucide-react";
import type { Book, FormatoLibro } from "../../../../types/book";
import { FORMATO_LABEL } from "../../../../types/book";
import { DetailSection } from "../DetailSection";
import { TextField } from "../../../ui/fields/TextField";
import { SelectField } from "../../../ui/fields/SelectField";
import { AutocompleteTextField } from "../../../ui/fields/AutocompleteTextField";
import { BookCoverArt } from "../../BookCoverArt";
import { RatingField } from "../../../ui/fields/RatingField";
import { useIsbnLookup } from "../../../../lib/useIsbnLookup";
import { applyMetadata, pickCoverFile, setManualCover } from "../../../../lib/metadata";
import { invalidateCoverCache } from "../../../../lib/useCoverImage";

interface InfoGeneralSectionProps {
  book: Book;
  vaultPath: string;
  googleBooksApiKey: string | null;
  allBooks: Book[];
  onChange: (book: Book) => void;
}

const FORMATOS: FormatoLibro[] = ["libro", "audiolibro"];
const FORMATO_OPTIONS = FORMATOS.map((f) => ({ value: f, label: FORMATO_LABEL[f] }));

/** Valores distintos (sin contar mayúsculas) de `values`, en orden de primera aparición. */
function distinctValues(values: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const v = raw?.trim();
    if (!v || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    result.push(v);
  }
  return result;
}

export function InfoGeneralSection({ book, vaultPath, googleBooksApiKey, allBooks, onChange }: InfoGeneralSectionProps) {
  // Vacío a propósito (no `book.isbn`): así abrir un libro que ya tiene ISBN
  // no dispara una búsqueda de fondo cada vez — solo se busca cuando el
  // usuario edita el campo de verdad.
  const [isbnDraft, setIsbnDraft] = useState("");
  const { status, result } = useIsbnLookup(vaultPath, isbnDraft, googleBooksApiKey);

  // Valores ya usados en la biblioteca, para sugerirlos como autocompletado
  // al escribir en el campo de autor.
  const autorOptions = useMemo(() => distinctValues(allBooks.map((b) => b.autor)), [allBooks]);

  useEffect(() => {
    if (result) onChange(applyMetadata(book, result));
  }, [result]);

  async function handleUploadCover() {
    const file = await pickCoverFile();
    if (!file) return;
    try {
      const portada = await setManualCover(vaultPath, book.id, file, book.portada);
      invalidateCoverCache(vaultPath, portada);
      onChange({ ...book, portada });
    } catch {
      // si falla (formato no soportado, error de disco...), no pasa nada visible:
      // la portada simplemente se queda como estaba, igual que un ISBN sin resultado
    }
  }

  return (
    <DetailSection title="Información general" icon={Sparkles}>
      <div className="book-header detail-field-wide">
        <div className="book-header-cover">
          <BookCoverArt book={book} vaultPath={vaultPath} />
          <button
            type="button"
            className="book-header-upload"
            onClick={handleUploadCover}
            aria-label={book.portada ? "Reemplazar portada" : "Añadir portada manualmente"}
            title={book.portada ? "Reemplazar portada" : "Añadir portada manualmente"}
          >
            <ImagePlus size={15} />
          </button>
        </div>

        <div className="book-header-main">
          <TextField
            label="Título"
            value={book.titulo}
            onChange={(v) => onChange({ ...book, titulo: v })}
            hideLabel
            inputClassName="book-header-title-input"
          />
          <AutocompleteTextField
            label="Autor"
            value={book.autor}
            options={autorOptions}
            onChange={(v) => onChange({ ...book, autor: v })}
            hideLabel
            inputClassName="book-header-author-input"
          />
          <RatingField
            value={book.valoracion}
            onChange={(v) => onChange({ ...book, valoracion: v })}
          />
        </div>

        <div className="book-header-facts">
          <div className="fact-row">
            <LibraryBig size={14} strokeWidth={2} />
            <SelectField
              label="Tipo"
              value={book.formato}
              options={FORMATO_OPTIONS}
              onChange={(v) =>
                onChange({
                  ...book,
                  formato: v as FormatoLibro,
                  duracion_min: v === "audiolibro" ? book.duracion_min : null,
                })
              }
            />
          </div>
          {book.formato === "audiolibro" && (
            <div className="fact-row">
              <Clock size={14} strokeWidth={2} />
              <TextField
                label="Duración"
                type="number"
                value={book.duracion_min != null ? String(book.duracion_min) : ""}
                onChange={(v) => {
                  const n = v.trim() === "" ? null : Number(v);
                  onChange({ ...book, duracion_min: n != null && !Number.isNaN(n) ? n : null });
                }}
              />
            </div>
          )}
          <div className="fact-row-group">
            <div className="fact-row">
              <Barcode size={14} strokeWidth={2} />
              <TextField
                label="ISBN"
                value={book.isbn ?? ""}
                onChange={(v) => onChange({ ...book, isbn: v.trim() || null })}
                onDraftChange={setIsbnDraft}
              />
            </div>
            {status === "loading" && <p className="fact-row-hint">Buscando…</p>}
            {status === "not_found" && <p className="fact-row-hint">No se ha encontrado ningún libro con ese ISBN</p>}
          </div>
        </div>
      </div>
    </DetailSection>
  );
}
