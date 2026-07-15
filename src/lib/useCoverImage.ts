import { useEffect, useState } from "react";
import { readCoverImage } from "./metadata";

const cache = new Map<string, string>();

// Instancias de useCoverImage actualmente montadas (una por cada portada
// visible: cuadrícula, tabla, ficha de detalle...) que quieren enterarse
// cuando se invalida una ruta, para releerla sin esperar a que se
// desmonten/remonten (cerrar y volver a abrir el libro).
const refreshCallbacks = new Set<() => void>();

/** Descarta la portada cacheada de `portada` y refresca cualquier instancia ya montada que la esté mostrando. */
export function invalidateCoverCache(vaultPath: string, portada: string) {
  cache.delete(`${vaultPath}/${portada}`);
  refreshCallbacks.forEach((cb) => cb());
}

/**
 * Lee una portada descargada como data URL, cacheada en memoria por ruta
 * absoluta para no releerla/recodificarla en cada render.
 */
export function useCoverImage(vaultPath: string, portada: string | null): string | null {
  const cacheKey = portada ? `${vaultPath}/${portada}` : null;
  const [dataUrl, setDataUrl] = useState<string | null>(cacheKey ? (cache.get(cacheKey) ?? null) : null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const cb = () => setRefreshToken((n) => n + 1);
    refreshCallbacks.add(cb);
    return () => {
      refreshCallbacks.delete(cb);
    };
  }, []);

  useEffect(() => {
    if (!portada || !cacheKey) {
      setDataUrl(null);
      return;
    }

    const cached = cache.get(cacheKey);
    if (cached) {
      setDataUrl(cached);
      return;
    }

    let cancelled = false;
    readCoverImage(vaultPath, portada)
      .then((url) => {
        if (cancelled) return;
        cache.set(cacheKey, url);
        setDataUrl(url);
      })
      .catch(() => {
        if (cancelled) return;
        setDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [vaultPath, portada, cacheKey, refreshToken]);

  return dataUrl;
}
