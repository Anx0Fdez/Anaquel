import { Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Platform } from "../../lib/platform";
import "./TitleBar.css";

interface TitleBarProps {
  platform: Platform;
}

const appWindow = getCurrentWindow();

export function TitleBar({ platform }: TitleBarProps) {
  const isMac = platform === "macos";

  return (
    <div className="titlebar" data-platform={platform}>
      <div className="titlebar-drag" data-tauri-drag-region />
      {!isMac && (
        <div className="titlebar-controls">
          <button type="button" className="titlebar-btn" onClick={() => appWindow.minimize()} aria-label="Minimizar">
            <Minus size={14} />
          </button>
          <button
            type="button"
            className="titlebar-btn"
            onClick={() => appWindow.toggleMaximize()}
            aria-label="Maximizar o restaurar"
          >
            <Square size={11} />
          </button>
          <button
            type="button"
            className="titlebar-btn titlebar-btn--close"
            onClick={() => appWindow.close()}
            aria-label="Cerrar"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
