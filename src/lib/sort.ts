import type { Book, EstadoLectura } from "../types/book";
export type SortKey = "titulo" | "autor" | "valoracion" | "estado";
export const SORT_LABEL: Record<SortKey, string> = {
  titulo: "Alfabético", autor: "Autor", valoracion: "Puntuación", estado: "Estado",
};
export function normalizeSortKey(key: string | null): SortKey {
  return key && Object.prototype.hasOwnProperty.call(SORT_LABEL, key) ? key as SortKey : "titulo";
}
export function sortLabel(key: SortKey): string { return SORT_LABEL[key]; }
export const ESTADO_ORDER: EstadoLectura[] = ["leyendo", "pendiente", "leido", "abandonado"];
export function sortBooks(books: Book[], key: SortKey): Book[] {
  return [...books].sort((a,b) => {
    const title = () => a.titulo.localeCompare(b.titulo, "es");
    if (key === "autor") return a.autor.localeCompare(b.autor, "es") || title();
    if (key === "valoracion") return (b.valoracion ?? -1) - (a.valoracion ?? -1) || title();
    if (key === "estado") return ESTADO_ORDER.indexOf(a.estado) - ESTADO_ORDER.indexOf(b.estado) || title();
    return title();
  });
}
