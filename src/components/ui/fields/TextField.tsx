import { useEffect, useState } from "react";
import "./Fields.css";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  wide?: boolean;
}

export function TextField({ label, value, onChange, placeholder, type = "text", wide }: TextFieldProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit() {
    if (draft !== value) onChange(draft);
  }

  return (
    <label className={`field${wide ? " detail-field-wide" : ""}`}>
      <span>{label}</span>
      <input
        className="field-input"
        type={type}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
      />
    </label>
  );
}
