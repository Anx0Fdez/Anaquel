import { useEffect, useState } from "react";

/**
 * Estado local ("borrador") que se confirma hacia arriba solo cuando el
 * consumidor llama a `commit()` (normalmente en onBlur) — el mismo patrón que
 * ya usan TextField/TextareaField, extraído para componentes que necesitan
 * varios campos de este tipo en un mismo archivo (p. ej. NoteCard).
 */
export function useDraftValue<T>(value: T, onCommit: (value: T) => void) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit() {
    if (draft !== value) onCommit(draft);
  }

  return { draft, setDraft, commit } as const;
}
