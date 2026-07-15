// Espejo en TypeScript de las structs de src-tauri/src/vault.rs
// (serde las serializa en camelCase).

import type { Theme, ViewMode } from "./book";

export interface VaultConfig {
  theme: Theme;
  lastView: ViewMode;
  anaquelOrder: string[];
  windowWidth: number | null;
  windowHeight: number | null;
  accentColor: string | null;
  defaultSortKey: string | null;
  lastLibraryKind: string | null;
  gridCardSize: string | null;
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
