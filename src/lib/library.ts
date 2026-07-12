import { invoke } from "@tauri-apps/api/core";
import type { Book } from "../types/book";

export function loadBooks(path: string): Promise<Book[]> {
  return invoke("load_books", { path });
}

export function saveBooks(path: string, books: Book[]): Promise<void> {
  return invoke("save_books", { path, books });
}
