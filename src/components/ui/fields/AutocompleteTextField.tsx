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
  const [highlighted, setHighlighted] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

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

  useEffect(() => {
    setHighlighted(-1);
  }, [draft]);

  useEffect(() => {
    optionRefs.current[highlighted]?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  function selectOption(name: string) {
    setDraft(name);
    if (name !== value) onChange(name);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h <= 0 ? matches.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      selectOption(matches[highlighted]);
    }
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
          onKeyDown={handleKeyDown}
        />
        {open && matches.length > 0 && (
          <ul className="dropdown-menu" role="listbox">
            {matches.map((name, i) => (
              <li
                key={name}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                role="option"
                aria-selected={i === highlighted}
              >
                <button
                  type="button"
                  className={`dropdown-menu-item${i === highlighted ? " dropdown-menu-item--highlighted" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlighted(i)}
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
