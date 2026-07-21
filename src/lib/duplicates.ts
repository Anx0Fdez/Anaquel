import type { Book } from "../types/book";

function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[^0-9Xx]/g, "").toUpperCase();
}

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type DuplicateMatch = { book: Book; reason: "isbn" | "titulo_autor" };

/** Busca en `books` un libro que coincida por ISBN, o por título+autor una vez normalizados
 * (sin acentos/mayúsculas/puntuación), con el candidato dado. Devuelve el primero que encuentre,
 * priorizando la coincidencia por ISBN por ser la más fiable. */
export function findDuplicate(
  books: Book[],
  candidate: { isbn: string; titulo: string; autor: string; excludeId?: string },
): DuplicateMatch | null {
  const others = candidate.excludeId ? books.filter((b) => b.id !== candidate.excludeId) : books;

  const isbn = normalizeIsbn(candidate.isbn);
  if (isbn) {
    const byIsbn = others.find((b) => b.isbn && normalizeIsbn(b.isbn) === isbn);
    if (byIsbn) return { book: byIsbn, reason: "isbn" };
  }

  const titulo = normalizeText(candidate.titulo);
  const autor = normalizeText(candidate.autor);
  if (titulo && autor) {
    const byTituloAutor = others.find(
      (b) => normalizeText(b.titulo) === titulo && normalizeText(b.autor) === autor,
    );
    if (byTituloAutor) return { book: byTituloAutor, reason: "titulo_autor" };
  }

  return null;
}
