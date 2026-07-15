import { useEffect, useState } from "react";
import { BookOpen, Barcode, LibraryBig, ListChecks, Star, User, X } from "lucide-react";
import type { Book, EstadoLectura, FormatoLibro } from "../../types/book";
import { FORMATO_LABEL, estadoLabel, estadosDisponibles } from "../../types/book";
import { useIsbnLookup } from "../../lib/useIsbnLookup";
import { applyMetadata } from "../../lib/metadata";
import { DropdownSelect } from "../ui/fields/DropdownSelect";
import { StarRatingField } from "../ui/fields/StarRatingField";
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
      subtitulo: null,
      titulo_original: null,
      autor: autor.trim(),
      autores_adicionales: [],
      isbn: isbn.trim() || null,
      isbn13: null,
      portada: null,
      estado,
      formato,
      idioma: null,
      editorial: null,
      fecha_publicacion: null,
      etiquetas: [],
      valoracion: estado === "leido" ? valoracion : null,
      favorito: false,
      comprar_fisico: false,
      relectura: false,
      progreso: { pagina_actual: null, paginas_totales: null, porcentaje: estado === "leido" ? 100 : null, ultima_lectura: null },
      saga: null,
      fechas: { añadido: hoy, inicio_lectura: null, fin_lectura: estado === "leido" ? hoy : null },
      ubicacion_fisica: null,
      prestamo: null,
      ediciones: [],
      enlaces_relacionados: [],
      anaqueles: [],
      descripcion: null,
      notas: [],
      citas: [],
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

        {estado === "leido" && (
          <label className="dialog-field">
            <span>
              <Star size={13} strokeWidth={2} />
              Valoración
            </span>
            <StarRatingField value={valoracion} onChange={setValoracion} />
          </label>
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
