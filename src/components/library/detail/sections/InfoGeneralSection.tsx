import { useEffect, useState } from "react";
import { Barcode, Building2, Clock, Hash, Heart, ImagePlus, Layers, LibraryBig, Sparkles } from "lucide-react";
import type { Book, FormatoLibro } from "../../../../types/book";
import { FORMATO_LABEL } from "../../../../types/book";
import { DetailSection } from "../DetailSection";
import { TextField } from "../../../ui/fields/TextField";
import { SelectField } from "../../../ui/fields/SelectField";
import { BookCoverArt } from "../../BookCoverArt";
import { StarRatingField } from "../../../ui/fields/StarRatingField";
import { useIsbnLookup } from "../../../../lib/useIsbnLookup";
import { applyMetadata, pickCoverFile, setManualCover } from "../../../../lib/metadata";
import { invalidateCoverCache } from "../../../../lib/useCoverImage";

interface InfoGeneralSectionProps {
  book: Book;
  vaultPath: string;
  googleBooksApiKey: string | null;
  onChange: (book: Book) => void;
}

const FORMATOS: FormatoLibro[] = ["fisico", "ebook", "comprar", "audiolibro"];
const FORMATO_OPTIONS = FORMATOS.map((f) => ({ value: f, label: FORMATO_LABEL[f] }));

export function InfoGeneralSection({ book, vaultPath, googleBooksApiKey, onChange }: InfoGeneralSectionProps) {
  // Vacío a propósito (no `book.isbn`): así abrir un libro que ya tiene ISBN
  // no dispara una búsqueda de fondo cada vez — solo se busca cuando el
  // usuario edita el campo de verdad.
  const [isbnDraft, setIsbnDraft] = useState("");
  const { status, result } = useIsbnLookup(vaultPath, isbnDraft, googleBooksApiKey);

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
            className="book-header-fav"
            onClick={() => onChange({ ...book, favorito: !book.favorito })}
            aria-pressed={book.favorito}
            aria-label={book.favorito ? "Quitar de favoritos" : "Marcar como favorito"}
            title={book.favorito ? "Quitar de favoritos" : "Marcar como favorito"}
          >
            <Heart size={15} fill={book.favorito ? "currentColor" : "none"} />
          </button>
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
          <TextField
            label="Autor"
            value={book.autor}
            onChange={(v) => onChange({ ...book, autor: v })}
            hideLabel
            inputClassName="book-header-author-input"
          />
          <StarRatingField
            value={book.valoracion}
            onChange={(v) => onChange({ ...book, valoracion: v })}
          />
        </div>

        <div className="book-header-facts">
          <div className="fact-row">
            <LibraryBig size={14} strokeWidth={2} />
            <SelectField
              label="Formato"
              value={book.formato}
              options={FORMATO_OPTIONS}
              onChange={(v) =>
                onChange({
                  ...book,
                  formato: v as FormatoLibro,
                  paginas_totales: v === "audiolibro" ? null : book.paginas_totales,
                  duracion_min: v === "audiolibro" ? book.duracion_min : null,
                })
              }
            />
          </div>
          <div className="fact-row">
            <Building2 size={14} strokeWidth={2} />
            <TextField
              label="Editorial"
              value={book.editorial ?? ""}
              onChange={(v) => onChange({ ...book, editorial: v.trim() || null })}
            />
          </div>
          {book.formato === "audiolibro" ? (
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
          ) : (
            <div className="fact-row">
              <Hash size={14} strokeWidth={2} />
              <TextField
                label="Páginas"
                type="number"
                value={book.paginas_totales != null ? String(book.paginas_totales) : ""}
                onChange={(v) => {
                  const n = v.trim() === "" ? null : Number(v);
                  onChange({ ...book, paginas_totales: n != null && !Number.isNaN(n) ? n : null });
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
          <div className="fact-row-group">
            <div className="fact-row">
              <Layers size={14} strokeWidth={2} />
              <TextField
                label="Colección"
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
                <div className="saga-subfields">
                  <span className="saga-subfields-label">Nº</span>
                  <TextField
                    label="Número en la saga"
                    type="number"
                    value={String(book.saga.numero)}
                    onChange={(v) => {
                      const n = Number(v);
                      if (!book.saga) return;
                      onChange({ ...book, saga: { ...book.saga, numero: Number.isNaN(n) ? 1 : n } });
                    }}
                    hideLabel
                    inputClassName="saga-subfield-input"
                  />
                  <span className="saga-subfields-sep">de</span>
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
                    hideLabel
                    inputClassName="saga-subfield-input"
                    placeholder="?"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DetailSection>
  );
}
