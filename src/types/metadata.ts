// Espejo en TypeScript de la struct BookMetadata de src-tauri/src/metadata.rs.

export interface BookMetadata {
  titulo: string | null;
  autor: string | null;
  editorial: string | null;
  paginas_totales: number | null;
  idioma: string | null;
  isbn13: string | null;
  portada: string | null; // ruta relativa a .ananquel/, p.ej. "covers/9788497592208.jpg"
}
