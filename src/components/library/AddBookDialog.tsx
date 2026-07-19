import { useEffect, useState } from "react";
import { BookOpen, Barcode, LibraryBig, ListChecks, Star, User, X } from "lucide-react";
import type { Book, EstadoLectura, FormatoLibro } from "../../types/book";
import { FORMATO_LABEL, estadoLabel, estadosDisponibles } from "../../types/book";
import { useIsbnLookup } from "../../lib/useIsbnLookup";
import { applyMetadata } from "../../lib/metadata";
import { DropdownSelect } from "../ui/fields/DropdownSelect";
import { StarRatingField } from "../ui/fields/StarRatingField";
import { ToggleField } from "../ui/fields/ToggleField";
import { DateField } from "../ui/fields/DateField";
import "../ui/Dialog.css";

interface AddBookDialogProps {
  vaultPath: string;
  defaultFormato: FormatoLibro;
  onAdd: (book: Book) => void;
  onClose: () => void;
}

const FORMATOS: FormatoLibro[] = ["fisico", "ebook", "audiolibro"];
const FORMATO_OPTIONS = FORMATOS.map((f) => ({ value: f, label: FORMATO_LABEL[f] }));

export function AddBookDialog({ vaultPath, defaultFormato, onAdd, onClose }: AddBookDialogProps) {
  const [isbn, setIsbn] = useState("");
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [estado, setEstado] = useState<EstadoLectura>("quiero_leer");
  const [formato, setFormato] = useState<FormatoLibro>(defaultFormato);
  const [valoracion, setValoracion] = useState<number | null>(null);
  const [relectura, setRelectura] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const audio = formato === "audiolibro";
  const ESTADO_OPTIONS = estadosDisponibles(audio, estado).map((s) => ({ value: s, label: estadoLabel(s, audio) }));

  const { status, result } = useIsbnLookup(vaultPath, isbn);

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
      formato,
      editorial: null,
      valoracion: estado === "leido" ? valoracion : null,
      favorito: false,
      comprar_fisico: false,
      relectura: estado === "leido" ? relectura : false,
      paginas_totales: null,
      saga: null,
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
          <h2>Añadir libro</h2>
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

          <label className="dialog-field">
            <span>
              <LibraryBig size={13} strokeWidth={2} />
              Formato
            </span>
            <DropdownSelect
              value={formato}
              options={FORMATO_OPTIONS}
              onChange={(v) => setFormato(v as FormatoLibro)}
              triggerClassName="dialog-select-trigger"
            />
          </label>
        </div>

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
            <label className="dialog-field">
              <span>
                <Star size={13} strokeWidth={2} />
                Valoración
              </span>
              <StarRatingField value={valoracion} onChange={setValoracion} />
            </label>
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
