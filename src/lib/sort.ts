import type { Book, EstadoLectura } from "../types/book";

export type SortKey = "titulo" | "saga" | "valoracion" | "estado" | "favoritos";

export const SORT_LABEL: Record<SortKey, string> = {
  titulo: "Alfabético",
  saga: "Colección / saga",
  valoracion: "Puntuación",
  estado: "Estado",
  favoritos: "Favoritos",
};

const ESTADO_ORDER: EstadoLectura[] = ["leyendo", "pospuesto", "quiero_leer", "leido", "audiolibro", "abandonado"];

function byTitulo(a: Book, b: Book): number {
  return a.titulo.localeCompare(b.titulo, "es");
}

export function sortBooks(books: Book[], key: SortKey): Book[] {
  const copy = [...books];
  switch (key) {
    case "titulo":
      copy.sort(byTitulo);
      break;
    case "saga":
      copy.sort((a, b) => {
        if (!a.saga && !b.saga) return byTitulo(a, b);
        if (!a.saga) return 1;
        if (!b.saga) return -1;
        const nombreCmp = a.saga.nombre.localeCompare(b.saga.nombre, "es");
        if (nombreCmp !== 0) return nombreCmp;
        return a.saga.numero - b.saga.numero;
      });
      break;
    case "valoracion":
      copy.sort((a, b) => (b.valoracion ?? -1) - (a.valoracion ?? -1) || byTitulo(a, b));
      break;
    case "estado":
      copy.sort(
        (a, b) => ESTADO_ORDER.indexOf(a.estado) - ESTADO_ORDER.indexOf(b.estado) || byTitulo(a, b),
      );
      break;
    case "favoritos":
      copy.sort((a, b) => Number(b.favorito) - Number(a.favorito) || byTitulo(a, b));
      break;
  }
  return copy;
}
