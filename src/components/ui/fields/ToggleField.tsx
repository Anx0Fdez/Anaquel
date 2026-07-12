import "./Fields.css";

interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleField({ label, checked, onChange }: ToggleFieldProps) {
  return (
    <div className="field field-toggle-row">
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
