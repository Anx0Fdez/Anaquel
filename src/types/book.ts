// Espejo en TypeScript de la struct Book de src-tauri/src/library.rs (ver docs/library-format.md).
// Los nombres de campo coinciden 1:1 con las claves del library.json del vault para que
// la (de)serialización entre Rust y el frontend no necesite un mapeo aparte.

export type EstadoLectura = "quiero_leer" | "leyendo" | "pospuesto" | "leido" | "abandonado";

export type FormatoLibro = "fisico" | "ebook" | "comprar" | "audiolibro";

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

export interface Book {
  id: string; // uuid, estable aunque cambie el título
  titulo: string;
  autor: string;
  isbn: string | null;
  portada: string | null; // ruta relativa a .ananquel/covers/
  estado: EstadoLectura;
  formato: FormatoLibro;
  editorial: string | null;
  valoracion: number | null; // 1-5 estrellas enteras, sin medias
  favorito: boolean;
  comprar_fisico: boolean; // solo relevante si formato=audiolibro y estado=leido
  relectura: boolean; // marcar para volver a leerlo en el futuro
  paginas_totales: number | null; // solo relevante si formato != audiolibro
  duracion_min: number | null; // solo relevante si formato == audiolibro
  comentarios: string | null;
  saga: Saga | null;
  fechas: Fechas;
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

export const ESTADOS_LECTURA: EstadoLectura[] = ["quiero_leer", "leyendo", "pospuesto", "leido", "abandonado"];

export const FORMATO_LABEL: Record<FormatoLibro, string> = {
  fisico: "Físico",
  ebook: "Ebook",
  comprar: "Comprar",
  audiolibro: "Audiolibro",
};
