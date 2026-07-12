// Espejo en TypeScript de la struct Book de src-tauri/src/library.rs (ver docs/library-format.md).
// Los nombres de campo coinciden 1:1 con las claves del library.json del vault para que
// la (de)serialización entre Rust y el frontend no necesite un mapeo aparte.

export type EstadoLectura =
  | "quiero_leer"
  | "leyendo"
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

export interface Book {
  id: string; // uuid, estable aunque cambie el título
  titulo: string;
  titulo_original: string | null;
  autor: string;
  autores_adicionales: string[];
  isbn: string | null;
  isbn13: string | null;
  portada: string | null; // ruta relativa a .ananquel/covers/
  estado: EstadoLectura;
  formato: FormatoLibro;
  genero: string[];
  etiquetas: string[];
  valoracion: number | null; // 0-5, admite .5
  favorito: boolean;
  progreso: Progreso;
  saga: Saga | null;
  fechas: Fechas;
  ubicacion_fisica: string | null;
  prestado_a: string | null;
  prestado_fecha_devolucion: string | null;
  ediciones: EdicionAdicional[];
  enlaces_relacionados: string[]; // ids de otros libros
  anaqueles: string[]; // estanterías personalizadas
  notas: string; // cuerpo libre del .md (markdown)
}

export type ViewMode = "grid" | "list" | "table";

export type Theme = "light" | "dark";

export const ESTADO_LABEL: Record<EstadoLectura, string> = {
  quiero_leer: "Quiero leer",
  leyendo: "Leyendo",
  leido: "Leído",
  abandonado: "Abandonado",
  audiolibro: "Audiolibro",
};

export const FORMATO_LABEL: Record<FormatoLibro, string> = {
  fisico: "Físico",
  ebook: "Ebook",
  audiolibro: "Audiolibro",
};
