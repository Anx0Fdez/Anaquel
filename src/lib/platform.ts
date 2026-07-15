import { invoke } from "@tauri-apps/api/core";

export type Platform = "windows" | "macos" | "linux" | string;

export function getPlatform(): Promise<Platform> {
  return invoke("get_platform");
}
