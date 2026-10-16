// Espejo en TypeScript de las structs de src-tauri/src/vault.rs
// (serde las serializa en camelCase).

import type { EstadoLectura, LibraryKind, Theme, ViewMode } from "./book";

export interface VaultConfig {
  theme: Theme;
  lastView: ViewMode;
  anaquelOrder: string[];
  accentColor: string | null;
  defaultSortKey: string | null;
  lastLibraryKind: string | null;
  gridCardSize: string | null;
  googleBooksApiKey: string | null;
  collapsedStatusGroups: Partial<Record<LibraryKind, EstadoLectura[]>>;
}

export interface VaultInfo {
  path: string;
  name: string;
  config: VaultConfig;
}

export interface RecentVault {
  path: string;
  name: string;
  lastOpened: number; // epoch millis
}
