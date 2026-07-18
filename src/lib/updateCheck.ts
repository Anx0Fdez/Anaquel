import { invoke } from "@tauri-apps/api/core";
import type { UpdateInfo } from "../types/update";

/** Consulta el último Release de GitHub; `null` si no hay ninguno más nuevo que el instalado. */
export function checkForUpdate(): Promise<UpdateInfo | null> {
  return invoke("check_for_update");
}
