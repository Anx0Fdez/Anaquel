import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, Barcode, ListChecks, User, X } from "lucide-react";
import type { Book, EstadoLectura, LibraryKind } from "../../types/book";
import { ESTADOS_LECTURA, estadoLabel } from "../../types/book";
import { useIsbnLookup } from "../../lib/useIsbnLookup";
import { applyMetadata } from "../../lib/metadata";
import { findDuplicate } from "../../lib/duplicates";
import { DropdownSelect } from "../ui/fields/DropdownSelect";
import { RatingField } from "../ui/fields/RatingField";
import { ToggleField } from "../ui/fields/ToggleField";
import { DateField } from "../ui/fields/DateField";
import "../ui/Dialog.css";

interface AddBookDialogProps {
  vaultPath: string;
  libraryKind: LibraryKind;
  googleBooksApiKey: string | null;
  existingBooks: Book[];
  onAdd: (book: Book) => void;
  onClose: () => void;
}

export function AddBookDialog({
  vaultPath,
  libraryKind,
  googleBooksApiKey,
  existingBooks,
  onAdd,
  onClose,
}: AddBookDialogProps) {
  const audio = libraryKind === "audiolibros";
  const [isbn, setIsbn] = useState("");
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [estado, setEstado] = useState<EstadoLectura>("pendiente");
  const [valoracion, setValoracion] = useState<number | null>(null);
  const [relectura, setRelectura] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const ESTADO_OPTIONS = ESTADOS_LECTURA.map((s) => ({ value: s, label: estadoLabel(s, audio) }));

  const { status, result } = useIsbnLookup(vaultPath, isbn, googleBooksApiKey);

  const duplicate = useMemo(
    () => findDuplicate(existingBooks, { isbn, titulo, autor }),
    [existingBooks, isbn, titulo, autor],
  );

  useEffect(() => {
    if (!result) return;
    setTitulo((t) => (t.trim() || !result.titulo ? t : result.titulo));
    setAutor((a) => (a.trim() || !result.autor ? a : result.autor));
  }, [result]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !autor.trim()) return;

    const id = crypto.randomUUID();
    const hoy = new Date().toISOString().slice(0, 10);
    let nuevo: Book = {
      id,
      titulo: titulo.trim(),
      autor: autor.trim(),
      isbn: isbn.trim() || null,
      portada: null,
      estado,
      formato: audio ? "audiolibro" : "libro",
      valoracion: estado === "leido" ? valoracion : null,
      comprar_fisico: false,
      relectura: estado === "leido" ? relectura : false,
      duracion_min: null,
      comentarios: null,
      fechas: {
        añadido: hoy,
        inicio_lectura: estado === "leyendo" || estado === "leido" ? fechaInicio || null : null,
        fin_lectura: estado === "leido" ? fechaFin || hoy : null,
      },
    };
    if (result) {
      nuevo = applyMetadata(nuevo, result);
    }
    onAdd(nuevo);
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form
        className="dialog dialog--add-book"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="dialog-header">
          <h2>{audio ? "Añadir audiolibro" : "Añadir libro"}</h2>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <label className="dialog-field">
          <span>
            <Barcode size={13} strokeWidth={2} />
            ISBN
          </span>
          <input
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            placeholder="9788497592208"
            autoFocus
          />
        </label>
        {status === "loading" && <p className="dialog-hint">Buscando libro…</p>}
        {status === "not_found" && <p className="dialog-hint">No se ha encontrado ningún libro con ese ISBN.</p>}

        <label className="dialog-field">
          <span>
            <BookOpen size={13} strokeWidth={2} />
            Título
          </span>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </label>

        <label className="dialog-field">
          <span>
            <User size={13} strokeWidth={2} />
            Autor
          </span>
          <input value={autor} onChange={(e) => setAutor(e.target.value)} required />
        </label>

        <div className="dialog-row">
          <label className="dialog-field">
            <span>
              <ListChecks size={13} strokeWidth={2} />
              Estado
            </span>
            <DropdownSelect
              value={estado}
              options={ESTADO_OPTIONS}
              onChange={(v) => setEstado(v as EstadoLectura)}
              triggerClassName="dialog-select-trigger"
            />
          </label>

        </div>

        {duplicate && (
          <p className="dialog-hint dialog-hint--warning">
            <AlertTriangle size={13} strokeWidth={2} />
            {duplicate.reason === "isbn"
              ? `Ya tienes "${duplicate.book.titulo}" en la biblioteca con este mismo ISBN.`
              : `Ya tienes "${duplicate.book.titulo}" de ${duplicate.book.autor} en la biblioteca.`}
          </p>
        )}

        {estado === "leyendo" && (
          <DateField label="Fecha de inicio" value={fechaInicio} onChange={setFechaInicio} />
        )}

        {estado === "leido" && (
          <div className="dialog-row">
            <DateField label="Fecha de inicio" value={fechaInicio} onChange={setFechaInicio} />
            <DateField label="Fecha de fin" value={fechaFin} onChange={setFechaFin} />
          </div>
        )}

        {estado === "leido" && (
          <div className="dialog-row-end">
            <RatingField value={valoracion} onChange={setValoracion} />
            {!audio && (
              <ToggleField label="Relectura" checked={relectura} onChange={setRelectura} />
            )}
          </div>
        )}

        <div className="dialog-actions">
          <button type="button" className="dialog-btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="dialog-btn-primary">
            Añadir a la biblioteca
          </button>
        </div>
      </form>
    </div>
  );
}
