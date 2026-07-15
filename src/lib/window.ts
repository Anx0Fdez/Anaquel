import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

export async function getCurrentWindowSize(): Promise<{ width: number; height: number }> {
  const win = getCurrentWindow();
  const factor = await win.scaleFactor();
  const size = (await win.innerSize()).toLogical(factor);
  return { width: Math.round(size.width), height: Math.round(size.height) };
}

export async function applyWindowSize(width: number, height: number): Promise<void> {
  const win = getCurrentWindow();
  await win.setSize(new LogicalSize(width, height));
  // setSize mantiene la esquina superior izquierda fija, así que sin esto la
  // ventana podría quedar descentrada al restaurar un tamaño guardado.
  await win.center();
}
