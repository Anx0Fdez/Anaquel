import { invoke } from "@tauri-apps/api/core";
import { save as saveDialog } from "@tauri-apps/plugin-dialog";
import type { Book, Theme } from "../types/book";

/** Pide dónde guardar el .xlsx. Devuelve `null` si el usuario cancela el diálogo. */
export function pickExportPath(): Promise<string | null> {
  return saveDialog({
    title: "Exportar biblioteca",
    defaultPath: "anaquel-export.xlsx",
    filters: [{ name: "Excel", extensions: ["xlsx"] }],
  });
}

/**
 * Genera el .xlsx (libros y audiolibros en hojas separadas) directamente en
 * `targetPath`. `theme`/`accentColor` son el tema y el color de acento
 * activos en la app: solo afectan al aspecto del documento generado, nunca a
 * qué datos se exportan.
 */
export function runExport(
  targetPath: string,
  books: Book[],
  theme: Theme,
  accentColor: string | null,
): Promise<void> {
  return invoke("export_library", { targetPath, books, theme, accentColor });
}

/** Pide al backend que aborte la exportación en curso lo antes posible. */
export function cancelExport(): Promise<void> {
  return invoke("cancel_export");
}
