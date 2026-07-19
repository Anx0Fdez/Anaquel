import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import type { Book } from "../types/book";
import type { BookMetadata } from "../types/metadata";

export function lookupIsbn(
  vaultPath: string,
  isbn: string,
  googleBooksApiKey: string | null,
): Promise<BookMetadata | null> {
  return invoke("lookup_isbn", { path: vaultPath, isbn, googleBooksApiKey });
}

/** Hace una petición real a Google Books con esta key para comprobar que funciona. */
export function validateGoogleBooksApiKey(apiKey: string): Promise<boolean> {
  return invoke("validate_google_books_api_key", { apiKey });
}

export function readCoverImage(vaultPath: string, portada: string): Promise<string> {
  return invoke("read_cover_image", { path: vaultPath, portada });
}

/** Abre el selector nativo de archivos para elegir una imagen de portada. Devuelve `null` si se cancela. */
export async function pickCoverFile(): Promise<string | null> {
  const file = await openDialog({
    multiple: false,
    filters: [{ name: "Imagen", extensions: ["jpg", "jpeg", "png", "webp", "gif"] }],
  });
  return typeof file === "string" ? file : null;
}

/**
 * Copia `sourcePath` a `.ananquel/covers/` y devuelve la ruta relativa a
 * guardar en `portada`. Si el libro ya tenía una portada distinta
 * (`oldPortada`), se borra tras copiar la nueva para no dejar archivos
 * huérfanos en `covers/`.
 */
export function setManualCover(
  vaultPath: string,
  bookId: string,
  sourcePath: string,
  oldPortada: string | null,
): Promise<string> {
  return invoke("set_manual_cover", { vaultPath, bookId, sourcePath, oldPortada });
}

function isBlank(value: string | null): boolean {
  return value == null || value.trim() === "";
}

/**
 * Fusiona los datos encontrados por ISBN en un libro sin pisar nada que el
 * usuario ya haya escrito: solo rellena los campos que están vacíos
 * (null, "" o []), nunca sobreescribe un valor existente.
 */
export function applyMetadata(book: Book, meta: BookMetadata): Book {
  return {
    ...book,
    titulo: isBlank(book.titulo) ? (meta.titulo ?? book.titulo) : book.titulo,
    autor: isBlank(book.autor) ? (meta.autor ?? book.autor) : book.autor,
    editorial: isBlank(book.editorial) ? meta.editorial : book.editorial,
    portada: isBlank(book.portada) ? meta.portada : book.portada,
    paginas_totales: book.formato === "audiolibro" ? null : (book.paginas_totales ?? meta.paginas_totales),
  };
}
