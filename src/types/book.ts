// Espejo en TypeScript de la struct Book de src-tauri/src/library.rs (ver docs/library-format.md).
export type EstadoLectura = "pendiente" | "leyendo" | "leido" | "abandonado";

export type FormatoLibro = "libro" | "audiolibro";

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
  valoracion: number | null; // 1-10, puntuación entera
  comprar_fisico: boolean; // solo relevante si formato=audiolibro y estado=leido
  relectura: boolean; // marcar para volver a leerlo en el futuro
  duracion_min: number | null; // solo relevante si formato == audiolibro
  comentarios: string | null;
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
  pendiente: "Pendiente",
  leyendo: "Leyendo",
  leido: "Leído",
  abandonado: "Abandonado",
};

const ESTADO_LABEL_AUDIO: Partial<Record<EstadoLectura, string>> = {
  pendiente: "Pendiente",
  leyendo: "Escuchando",
  leido: "Escuchado",
};

/** Etiqueta de un estado, adaptada a "escuchar/escuchando/escuchado" cuando el libro es un audiolibro. */
export function estadoLabel(estado: EstadoLectura, audio: boolean): string {
  return (audio && ESTADO_LABEL_AUDIO[estado]) || ESTADO_LABEL[estado];
}

export const ESTADOS_LECTURA: EstadoLectura[] = ["pendiente", "leyendo", "leido", "abandonado"];

export const FORMATO_LABEL: Record<FormatoLibro, string> = {
  libro: "Libro",
  audiolibro: "Audiolibro",
};
