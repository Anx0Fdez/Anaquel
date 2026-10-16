import "./RatingDisplay.css";

interface RatingDisplayProps { value: number; size?: number; }
export function RatingDisplay({ value, size = 12 }: RatingDisplayProps) {
  return (
    <span
      className="rating-display"
      style={{ fontSize: size <= 9 ? 14 : 16 }}
      aria-label={`Valoración: ${value} de 10`}
      title={`Valoración: ${value} de 10`}
    >
      {value}
    </span>
  );
}
