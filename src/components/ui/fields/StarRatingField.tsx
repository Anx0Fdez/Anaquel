import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import "./Fields.css";

interface StarRatingFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

const STAR_COUNT = 5;

export function StarRatingField({ value, onChange }: StarRatingFieldProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [popping, setPopping] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setPopping(true);
    const t = window.setTimeout(() => setPopping(false), 240);
    return () => window.clearTimeout(t);
  }, [value]);

  function pick(next: number) {
    onChange(next === value ? null : next);
  }

  const display = hoverValue ?? value ?? 0;

  return (
    <div className="star-rating">
      <div
        className={`star-rating-stars${popping ? " star-rating-stars--pop" : ""}`}
        role="group"
        aria-label="Valoración"
        onMouseLeave={() => setHoverValue(null)}
      >
        {Array.from({ length: STAR_COUNT }, (_, i) => {
          const starValue = i + 1;
          const filled = display >= starValue;
          return (
            <span key={i} className="star-slot">
              <Star className="star-icon star-icon--bg" size={18} strokeWidth={1.75} />
              <span className="star-icon-fill" style={{ width: filled ? "100%" : "0%" }}>
                <Star className="star-icon star-icon--fg" size={18} strokeWidth={1.75} fill="currentColor" />
              </span>
              <button
                type="button"
                className="star-hit"
                aria-label={`${starValue} de 5 estrellas`}
                onMouseEnter={() => setHoverValue(starValue)}
                onClick={() => pick(starValue)}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
