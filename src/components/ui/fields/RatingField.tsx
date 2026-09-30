import { SelectField } from "./SelectField";

interface RatingFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

const options = [
  { value: "", label: "Sin valorar" },
  ...Array.from({ length: 10 }, (_, index) => {
    const rating = index + 1;
    return { value: String(rating), label: `${rating}/10` };
  }),
];

export function RatingField({ value, onChange }: RatingFieldProps) {
  return (
    <SelectField
      label="Valoración"
      value={value == null ? "" : String(value)}
      options={options}
      onChange={(nextValue) => onChange(nextValue === "" ? null : Number(nextValue))}
    />
  );
}
