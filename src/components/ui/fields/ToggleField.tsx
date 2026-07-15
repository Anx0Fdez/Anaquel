import "./Fields.css";

interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function ToggleField({ label, checked, onChange, className }: ToggleFieldProps) {
  return (
    <div className={`field field-toggle-row${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className="field-toggle"
        data-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <span className="field-toggle-knob" />
      </button>
      <span className="field-toggle-label">{label}</span>
    </div>
  );
}
