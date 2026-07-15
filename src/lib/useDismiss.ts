import { useEffect, type RefObject } from "react";

/** Cierra un popover al clicar fuera de `ref` o al pulsar Escape. */
export function useDismiss(active: boolean, ref: RefObject<HTMLElement | null>, onDismiss: () => void) {
  useEffect(() => {
    if (!active) return;

    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, ref, onDismiss]);
}
