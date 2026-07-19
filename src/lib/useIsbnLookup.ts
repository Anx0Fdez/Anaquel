import { useEffect, useState } from "react";
import { lookupIsbn } from "./metadata";
import type { BookMetadata } from "../types/metadata";

export type IsbnLookupStatus = "idle" | "loading" | "found" | "not_found";

function normalizeIsbn(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, "").toUpperCase();
}

/**
 * Busca metadatos por ISBN 300ms después de que el usuario deje de escribir.
 * El cleanup del efecto (disparado por React al cambiar `isbn`/`vaultPath`
 * antes de que resuelva la búsqueda anterior) hace de debounce y de cancelación
 * de respuestas obsoletas a la vez.
 */
export function useIsbnLookup(vaultPath: string, isbn: string, googleBooksApiKey: string | null) {
  const [status, setStatus] = useState<IsbnLookupStatus>("idle");
  const [result, setResult] = useState<BookMetadata | null>(null);

  useEffect(() => {
    const normalized = normalizeIsbn(isbn);
    if (normalized.length !== 10 && normalized.length !== 13) {
      setStatus("idle");
      setResult(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");

    const timer = window.setTimeout(() => {
      lookupIsbn(vaultPath, normalized, googleBooksApiKey)
        .then((meta) => {
          if (cancelled) return;
          setResult(meta);
          setStatus(meta ? "found" : "not_found");
        })
        .catch(() => {
          if (cancelled) return;
          setResult(null);
          setStatus("not_found");
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isbn, vaultPath, googleBooksApiKey]);

  return { status, result };
}
