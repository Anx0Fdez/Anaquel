interface RatingDisplayProps { value: number; size?: number; }
export function RatingDisplay({ value }: RatingDisplayProps) {
  return <span aria-label={`${value} de 10`}>{value}/10</span>;
}
