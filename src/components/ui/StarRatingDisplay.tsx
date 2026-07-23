import { Star } from "lucide-react";
import "./StarRatingDisplay.css";

interface StarRatingDisplayProps {
  value: number;
  size?: number;
}

const STAR_COUNT = 5;

/** Versión de solo lectura de StarRatingField, para donde solo hace falta
 * mostrar una valoración ya puesta (tabla, cuadrícula) sin poder editarla —
 * nunca como número, siempre como estrellas, igual que en el campo editable. */
export function StarRatingDisplay({ value, size = 12 }: StarRatingDisplayProps) {
  return (
    <span className="star-rating-display" aria-label={`${value} de 5 estrellas`}>
      {Array.from({ length: STAR_COUNT }, (_, i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.75}
          className={`star-rating-display-icon${i < value ? " star-rating-display-icon--filled" : ""}`}
          fill={i < value ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}
