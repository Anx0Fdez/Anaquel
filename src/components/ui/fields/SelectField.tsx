import { DropdownSelect } from "./DropdownSelect";
import "./Fields.css";

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  compact?: boolean;
}

export function SelectField({ label, value, options, onChange, compact }: SelectFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <DropdownSelect
        value={value}
        options={options}
        onChange={onChange}
        triggerClassName={`field-select${compact ? " field-select--compact" : ""}`}
      />
    </label>
  );
}
