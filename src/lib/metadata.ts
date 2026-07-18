import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import type { Book } from "../types/book";
import type { BookMetadata } from "../types/metadata";

export function lookupIsbn(vaultPath: string, isbn: string): Promise<BookMetadata | null> {
  return invoke("lookup_isbn", { path: vaultPath, isbn });
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

/** Copia `sourcePath` a `.ananquel/covers/` y devuelve la ruta relativa a guardar en `portada`. */
export function setManualCover(vaultPath: string, bookId: string, sourcePath: string): Promise<string> {
  return invoke("set_manual_cover", { vaultPath, bookId, sourcePath });
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
    isbn13: isBlank(book.isbn13) ? meta.isbn13 : book.isbn13,
    editorial: isBlank(book.editorial) ? meta.editorial : book.editorial,
    idioma: isBlank(book.idioma) ? meta.idioma : book.idioma,
    portada: isBlank(book.portada) ? meta.portada : book.portada,
    progreso:
      meta.paginas_totales != null && book.progreso.paginas_totales == null
        ? { ...book.progreso, paginas_totales: meta.paginas_totales }
        : book.progreso,
  };
}
