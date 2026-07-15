import type { Book, EstadoLectura } from "../types/book";

export type NavFilter =
  | { kind: "all" }
  | { kind: "estado"; estado: EstadoLectura }
  | { kind: "favoritos" }
  | { kind: "year"; year: number };

export function filterKey(f: NavFilter): string {
  switch (f.kind) {
    case "all":
      return "all";
    case "favoritos":
      return "favoritos";
    case "estado":
      return `estado:${f.estado}`;
    case "year":
      return `year:${f.year}`;
  }
}

// El "año de lectura" de un libro es el año en que se empezó a leer, o si no
// se conoce, el año en que se terminó — así un libro que ya se ha terminado
// pero no registró fecha de inicio sigue siendo filtrable por año.
export function readingYear(book: Book): number | null {
  const raw = book.fechas.inicio_lectura ?? book.fechas.fin_lectura;
  if (!raw) return null;
  const year = Number(raw.slice(0, 4));
  return Number.isNaN(year) ? null : year;
}

export function matchesFilter(book: Book, f: NavFilter): boolean {
  switch (f.kind) {
    case "all":
      return true;
    case "favoritos":
      return book.favorito;
    case "estado":
      return book.estado === f.estado;
    case "year":
      return readingYear(book) === f.year;
  }
}

export function matchesSearch(book: Book, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return book.titulo.toLowerCase().includes(q) || book.autor.toLowerCase().includes(q);
}

export function filterLabel(f: NavFilter): string {
  switch (f.kind) {
    case "all":
      return "Biblioteca";
    case "favoritos":
      return "Favoritos";
    case "year":
      return String(f.year);
    case "estado":
      return f.estado;
  }
}
