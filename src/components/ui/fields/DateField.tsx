import "./Fields.css";

interface DateFieldProps {
  label: string;
  value: string; // ISO date ("") o "" si no hay fecha
  onChange: (value: string) => void;
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="field-input"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
