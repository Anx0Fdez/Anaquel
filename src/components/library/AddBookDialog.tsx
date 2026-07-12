import { useState } from "react";
import { X } from "lucide-react";
import type { Book, EstadoLectura, FormatoLibro } from "../../types/book";
import { ESTADO_LABEL, FORMATO_LABEL } from "../../types/book";
import "../ui/Dialog.css";

interface AddBookDialogProps {
  onAdd: (book: Book) => void;
  onClose: () => void;
}

const ESTADOS: EstadoLectura[] = ["quiero_leer", "leyendo", "leido", "audiolibro", "abandonado"];
const FORMATOS: FormatoLibro[] = ["fisico", "ebook", "audiolibro"];

export function AddBookDialog({ onAdd, onClose }: AddBookDialogProps) {
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [estado, setEstado] = useState<EstadoLectura>("quiero_leer");
  const [formato, setFormato] = useState<FormatoLibro>("fisico");
  const [genero, setGenero] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !autor.trim()) return;

    const id = crypto.randomUUID();
    const hoy = new Date().toISOString().slice(0, 10);
    const nuevo: Book = {
      id,
      titulo: titulo.trim(),
      subtitulo: null,
      titulo_original: null,
      autor: autor.trim(),
      autores_adicionales: [],
      isbn: null,
      isbn13: null,
      portada: null,
      estado,
      formato,
      idioma: null,
      editorial: null,
      fecha_publicacion: null,
      genero: genero
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      etiquetas: [],
      valoracion: null,
      favorito: false,
      progreso: { pagina_actual: null, paginas_totales: null, porcentaje: estado === "leido" ? 100 : null, ultima_lectura: null },
      saga: null,
      fechas: { añadido: hoy, inicio_lectura: null, fin_lectura: estado === "leido" ? hoy : null },
      ubicacion_fisica: null,
      prestamo: null,
      ediciones: [],
      enlaces_relacionados: [],
      anaqueles: genero
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      descripcion: null,
      notas: "",
      citas: [],
    };
    onAdd(nuevo);
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form
        className="dialog"
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
          <span>Título</span>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus required />
        </label>

        <label className="dialog-field">
          <span>Autor</span>
          <input value={autor} onChange={(e) => setAutor(e.target.value)} required />
        </label>

        <div className="dialog-row">
          <label className="dialog-field">
            <span>Estado</span>
            <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoLectura)}>
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {ESTADO_LABEL[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="dialog-field">
            <span>Formato</span>
            <select value={formato} onChange={(e) => setFormato(e.target.value as FormatoLibro)}>
              {FORMATOS.map((f) => (
                <option key={f} value={f}>
                  {FORMATO_LABEL[f]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="dialog-field">
          <span>Género / anaqueles</span>
          <input
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
            placeholder="Fantasía, Aventura…"
          />
        </label>

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
