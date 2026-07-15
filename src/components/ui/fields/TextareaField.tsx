import { useEffect, useState } from "react";
import "./Fields.css";

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TextareaField({ label, value, onChange, placeholder }: TextareaFieldProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit() {
    if (draft !== value) onChange(draft);
  }

  return (
    <label className="field detail-field-wide">
      <span>{label}</span>
      <textarea
        className="field-textarea"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
      />
    </label>
  );
}
