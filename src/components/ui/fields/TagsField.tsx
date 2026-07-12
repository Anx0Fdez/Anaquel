import { useState } from "react";
import { X } from "lucide-react";
import "./Fields.css";

interface TagsFieldProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  wide?: boolean;
}

export function TagsField({ label, values, onChange, placeholder, wide }: TagsFieldProps) {
  const [draft, setDraft] = useState("");

  function addFromDraft() {
    const trimmed = draft.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addFromDraft();
    } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <label className={`field${wide ? " detail-field-wide" : ""}`}>
      <span>{label}</span>
      <div className="field-tags">
        {values.map((v) => (
          <span key={v} className="field-tag">
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
          onBlur={addFromDraft}
        />
      </div>
    </label>
  );
}
