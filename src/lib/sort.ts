import type { Book, EstadoLectura } from "../types/book";

export type SortKey = "titulo" | "autor" | "saga" | "valoracion" | "estado" | "favoritos" | "paginas";

export const SORT_LABEL: Record<SortKey, string> = {
  titulo: "Alfabético",
  autor: "Autor",
  saga: "Colección / saga",
  valoracion: "Puntuación",
  estado: "Estado",
  favoritos: "Favoritos",
  paginas: "Páginas",
};

/** Como "Páginas" no aplica a audiolibros (usan duración en minutos), la
 * etiqueta de este criterio se adapta igual que ya hace `estadoLabel`. */
export function sortLabel(key: SortKey, audio: boolean): string {
  if (key === "paginas" && audio) return "Duración";
  return SORT_LABEL[key];
}

export const ESTADO_ORDER: EstadoLectura[] = ["leyendo", "pospuesto", "quiero_leer", "leido", "abandonado"];

function byTitulo(a: Book, b: Book): number {
  return a.titulo.localeCompare(b.titulo, "es");
}

export function sortBooks(books: Book[], key: SortKey): Book[] {
  const copy = [...books];
  switch (key) {
    case "titulo":
      copy.sort(byTitulo);
      break;
    case "autor":
      copy.sort((a, b) => a.autor.localeCompare(b.autor, "es") || byTitulo(a, b));
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
    case "paginas":
      copy.sort((a, b) => {
        const va = a.formato === "audiolibro" ? (a.duracion_min ?? -1) : (a.paginas_totales ?? -1);
        const vb = b.formato === "audiolibro" ? (b.duracion_min ?? -1) : (b.paginas_totales ?? -1);
        return va - vb || byTitulo(a, b);
      });
      break;
  }
  return copy;
}
