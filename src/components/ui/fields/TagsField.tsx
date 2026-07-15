import { useMemo, useState } from "react";
import { X } from "lucide-react";
import "./Fields.css";

interface TagsFieldProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  wide?: boolean;
  hideLabel?: boolean;
  bare?: boolean;
  tagClassName?: string;
  /** Géneros/valores ya usados en otros libros, para sugerirlos mientras se escribe. */
  suggestions?: string[];
}

export function TagsField({
  label,
  values,
  onChange,
  placeholder,
  wide,
  hideLabel,
  bare,
  tagClassName,
  suggestions,
}: TagsFieldProps) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (!suggestions) return [];
    const query = draft.trim().toLowerCase();
    return suggestions
      .filter((s) => !values.includes(s))
      .filter((s) => query === "" || s.toLowerCase().includes(query))
      .slice(0, 8);
  }, [suggestions, draft, values]);

  const showSuggestions = focused && filteredSuggestions.length > 0;

  function addValue(value: string) {
    const trimmed = value.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addValue(draft);
    } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <label className={`field related-books-field${wide ? " detail-field-wide" : ""}`}>
      {!hideLabel && <span>{label}</span>}
      <div className={`field-tags${bare ? " field-tags--bare" : ""}`}>
        {values.map((v) => (
          <span key={v} className={`field-tag${tagClassName ? ` ${tagClassName}` : ""}`}>
            {v}
            <button
              type="button"
              className="field-tag-remove"
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`Quitar ${v}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          className="field-tags-input"
          value={draft}
          placeholder={values.length === 0 ? placeholder : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            addValue(draft);
          }}
        />
      </div>
      {showSuggestions && (
        <ul className="related-books-suggestions">
          {filteredSuggestions.map((s) => (
            <li key={s}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addValue(s)}>
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}
