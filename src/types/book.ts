// Espejo en TypeScript de la struct Book de src-tauri/src/library.rs (ver docs/library-format.md).
// Los nombres de campo coinciden 1:1 con las claves del library.json del vault para que
// la (de)serialización entre Rust y el frontend no necesite un mapeo aparte.

export type EstadoLectura =
  | "quiero_leer"
  | "leyendo"
  | "pospuesto"
  | "leido"
  | "abandonado"
  | "audiolibro";

export type FormatoLibro = "fisico" | "ebook" | "audiolibro";

export interface Progreso {
  pagina_actual: number | null;
  paginas_totales: number | null;
  porcentaje: number | null;
  ultima_lectura: string | null; // ISO date
}

export interface Saga {
  nombre: string;
  numero: number;
  total_libros: number | null;
}

export interface Fechas {
  añadido: string; // ISO date
  inicio_lectura: string | null;
  fin_lectura: string | null;
}

export interface EdicionAdicional {
  formato: FormatoLibro;
  editorial: string | null;
  duracion_min: number | null; // para audiolibros
}

export interface Prestamo {
  persona: string;
  fecha: string | null; // ISO date, cuándo se prestó
  devolucion_prevista: string | null; // ISO date
}

export interface Nota {
  id: string;
  titulo: string | null;
  contenido: string;
  fecha_creacion: string; // ISO datetime completo
  fecha_modificacion: string; // ISO datetime completo
}

export interface Cita {
  id: string;
  texto: string;
  pagina: number | null;
  capitulo: string | null;
  comentario: string | null;
}

export interface Book {
  id: string; // uuid, estable aunque cambie el título
  titulo: string;
  subtitulo: string | null;
  titulo_original: string | null;
  autor: string;
  autores_adicionales: string[];
  isbn: string | null;
  isbn13: string | null;
  portada: string | null; // ruta relativa a .ananquel/covers/
  estado: EstadoLectura;
  formato: FormatoLibro;
  idioma: string | null;
  editorial: string | null;
  fecha_publicacion: string | null; // ISO date
  etiquetas: string[];
  valoracion: number | null; // 0-10, en pasos de 0.5
  favorito: boolean;
  comprar_fisico: boolean; // solo relevante si formato=audiolibro y estado=leido
  relectura: boolean; // marcar para volver a leerlo en el futuro
  progreso: Progreso;
  saga: Saga | null;
  fechas: Fechas;
  ubicacion_fisica: string | null;
  prestamo: Prestamo | null;
  ediciones: EdicionAdicional[];
  enlaces_relacionados: string[]; // ids de otros libros
  anaqueles: string[]; // estanterías personalizadas
  descripcion: string | null; // sinopsis/contraportada
  notas: Nota[];
  citas: Cita[];
}

export type ViewMode = "grid" | "table";

export type GridCardSize = "grande" | "mediano" | "pequeno";

export const GRID_CARD_SIZE_LABEL: Record<GridCardSize, string> = {
  grande: "Grande",
  mediano: "Mediano",
  pequeno: "Pequeño",
};

export type Theme = "light" | "dark";

export type LibraryKind = "libros" | "audiolibros";

export const ESTADO_LABEL: Record<EstadoLectura, string> = {
  quiero_leer: "Quiero leer",
  leyendo: "Leyendo",
  pospuesto: "Pospuesto",
  leido: "Leído",
  abandonado: "Abandonado",
  audiolibro: "Audiolibro",
};

const ESTADO_LABEL_AUDIO: Partial<Record<EstadoLectura, string>> = {
  quiero_leer: "Quiero escuchar",
  leyendo: "Escuchando",
  pospuesto: "En pausa",
  leido: "Escuchado",
};

/** Etiqueta de un estado, adaptada a "escuchar/escuchando/escuchado" cuando el libro es un audiolibro. */
export function estadoLabel(estado: EstadoLectura, audio: boolean): string {
  return (audio && ESTADO_LABEL_AUDIO[estado]) || ESTADO_LABEL[estado];
}

/**
 * Estados seleccionables para un libro. El valor "audiolibro" era, antes de
 * separar Libros/Audiolibros en dos bibliotecas, el filtro rápido de "lo que
 * estoy escuchando ahora" — dentro de la biblioteca de audiolibros ya es
 * redundante con "Escuchando", así que se oculta como opción nueva (pero se
 * respeta si un libro ya lo tenía guardado, para no tocar datos existentes).
 */
export function estadosDisponibles(audio: boolean, current?: EstadoLectura): EstadoLectura[] {
  const all: EstadoLectura[] = ["quiero_leer", "leyendo", "pospuesto", "leido", "audiolibro", "abandonado"];
  if (!audio) return all;
  return all.filter((e) => e !== "audiolibro" || current === "audiolibro");
}

export const FORMATO_LABEL: Record<FormatoLibro, string> = {
  fisico: "Físico",
  ebook: "Ebook",
  audiolibro: "Audiolibro",
};
