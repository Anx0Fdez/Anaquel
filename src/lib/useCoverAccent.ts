import { useEffect, useState } from "react";
import { extractAccentColor } from "./coverColor";

const cache = new Map<string, string | null>();

/** Color de acento derivado de una portada ya cargada (`coverUrl`, un data
 * URL), cacheado por esa misma URL para no recalcularlo cada vez que se
 * reabre el mismo libro. Devuelve `null` mientras no hay portada o no se
 * pudo sacar un tono fiable — quien lo use debe caer entonces a algún
 * acento de reserva (p. ej. la paleta determinista de `coverArt.ts`). */
export function useCoverAccent(coverUrl: string | null): string | null {
  const [accent, setAccent] = useState<string | null>(coverUrl ? (cache.get(coverUrl) ?? null) : null);

  useEffect(() => {
    if (!coverUrl) {
      setAccent(null);
      return;
    }
    const cached = cache.get(coverUrl);
    if (cached !== undefined) {
      setAccent(cached);
      return;
    }
    let cancelled = false;
    extractAccentColor(coverUrl).then((color) => {
      if (cancelled) return;
      cache.set(coverUrl, color);
      setAccent(color);
    });
    return () => {
      cancelled = true;
    };
  }, [coverUrl]);

  return accent;
}
