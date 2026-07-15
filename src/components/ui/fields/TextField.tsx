import { useEffect, useState } from "react";
import "./Fields.css";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  wide?: boolean;
  hideLabel?: boolean;
  inputClassName?: string;
  /** Se dispara en cada pulsación, además de `onChange` (que solo confirma al perder el foco). */
  onDraftChange?: (value: string) => void;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  wide,
  hideLabel,
  inputClassName,
  onDraftChange,
}: TextFieldProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit() {
    if (draft !== value) onChange(draft);
  }

  return (
    <label className={`field${wide ? " detail-field-wide" : ""}`}>
      {!hideLabel && <span>{label}</span>}
      <input
        className={`field-input${inputClassName ? ` ${inputClassName}` : ""}`}
        type={type}
        value={draft}
        placeholder={placeholder ?? (hideLabel ? label : undefined)}
        aria-label={hideLabel ? label : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          onDraftChange?.(e.target.value);
        }}
        onBlur={commit}
      />
    </label>
  );
}
