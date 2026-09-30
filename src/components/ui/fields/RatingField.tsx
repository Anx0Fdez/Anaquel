import "./Fields.css";
interface RatingFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
}
/** Puntuación numérica de 1 a 10; vacío significa sin valorar. */
export function RatingField({ value, onChange }: RatingFieldProps) {
  return <label className="field">
    <span>Valoración (1–10)</span>
    <select className="field-input" aria-label="Valoración de 1 a 10"
      value={value ?? ""} onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}>
      <option value="">Sin valorar</option>
      {Array.from({ length: 10 }, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
    </select>
  </label>;
}
