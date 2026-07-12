import type { Book, EstadoLectura } from "../types/book";

export type NavFilter =
  | { kind: "all" }
  | { kind: "estado"; estado: EstadoLectura }
  | { kind: "favoritos" }
  | { kind: "anaquel"; nombre: string };

export function filterKey(f: NavFilter): string {
  switch (f.kind) {
    case "all":
      return "all";
    case "favoritos":
      return "favoritos";
    case "estado":
      return `estado:${f.estado}`;
    case "anaquel":
      return `anaquel:${f.nombre}`;
  }
}

export function matchesFilter(book: Book, f: NavFilter): boolean {
  switch (f.kind) {
    case "all":
      return true;
    case "favoritos":
      return book.favorito;
    case "estado":
      return book.estado === f.estado;
    case "anaquel":
      return book.anaqueles.includes(f.nombre);
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
    case "anaquel":
      return f.nombre;
    case "estado":
      return f.estado;
  }
}
