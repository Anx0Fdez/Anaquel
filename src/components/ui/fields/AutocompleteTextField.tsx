import { useEffect, useMemo, useRef, useState } from "react";
import { useDismiss } from "../../../lib/useDismiss";
import "./Fields.css";
import "./DropdownSelect.css";

interface AutocompleteTextFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  hideLabel?: boolean;
  inputClassName?: string;
}

/** Como TextField, pero con un desplegable de sugerencias tomadas de `options`
 * (valores ya usados en la biblioteca, p. ej. sagas, autores o editoriales)
 * mientras se escribe. Sigue permitiendo texto libre: elegir una sugerencia
 * solo rellena el campo, no restringe lo que se puede escribir. */
export function AutocompleteTextField({
  label,
  value,
  options,
  onChange,
  placeholder,
  hideLabel,
  inputClassName,
}: AutocompleteTextFieldProps) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useDismiss(open, rootRef, () => setOpen(false));

  function commit() {
    if (draft !== value) onChange(draft);
  }

  const matches = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    return options.filter((o) => o.toLowerCase().includes(q) && o.toLowerCase() !== q).slice(0, 8);
  }, [draft, options]);

  function selectOption(name: string) {
    setDraft(name);
    if (name !== value) onChange(name);
    setOpen(false);
  }

  return (
    <label className="field">
      {!hideLabel && <span>{label}</span>}
      <div className="dropdown-select autocomplete-field" ref={rootRef}>
        <input
          className={`field-input${inputClassName ? ` ${inputClassName}` : ""}`}
          value={draft}
          placeholder={placeholder ?? (hideLabel ? label : undefined)}
          aria-label={hideLabel ? label : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={commit}
        />
        {open && matches.length > 0 && (
          <ul className="dropdown-menu" role="listbox">
            {matches.map((name) => (
              <li key={name} role="option">
                <button
                  type="button"
                  className="dropdown-menu-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(name)}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </label>
  );
}
