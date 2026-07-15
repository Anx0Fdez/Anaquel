import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import type { RecentVault, VaultConfig, VaultInfo } from "../types/vault";

export function listRecentVaults(): Promise<RecentVault[]> {
  return invoke("list_recent_vaults");
}

export function createVault(parentDir: string, name: string): Promise<VaultInfo> {
  return invoke("create_vault", { parentDir, name });
}

export function openVault(path: string): Promise<VaultInfo> {
  return invoke("open_vault", { path });
}

export function saveVaultConfig(path: string, config: VaultConfig): Promise<void> {
  return invoke("save_vault_config", { path, config });
}

export function removeRecentVault(path: string): Promise<RecentVault[]> {
  return invoke("remove_recent_vault", { path });
}

export async function pickFolder(title: string): Promise<string | null> {
  const result = await openDialog({ directory: true, multiple: false, title });
  if (!result) return null;
  return Array.isArray(result) ? (result[0] ?? null) : result;
}
