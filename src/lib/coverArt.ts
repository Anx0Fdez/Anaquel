// No hay imágenes de portada reales todavía, y reproducir cubiertas de
// libros reales (con copyright) no es viable ni deseable. En su lugar,
// generamos una portada tipográfica determinista por libro: misma paleta
// y disposición cada vez que se renderiza el mismo libro, mezclada de
// forma pseudo-aleatoria entre libros para que la cuadrícula se vea variada.

export interface CoverPalette {
  bg: string;
  bg2: string;
  fg: string;
}

const PALETTES: CoverPalette[] = [
  { bg: "#e4ddc9", bg2: "#cfc0a1", fg: "#211c15" },
  { bg: "#c0392b", bg2: "#8f2318", fg: "#f5ece0" },
  { bg: "#1f3a5f", bg2: "#142944", fg: "#e9e4d8" },
  { bg: "#c97a3d", bg2: "#a35a24", fg: "#241a10" },
  { bg: "#3f6a5c", bg2: "#294a40", fg: "#e9e4d8" },
  { bg: "#5c4a72", bg2: "#40324f", fg: "#e9e4d8" },
  { bg: "#332c24", bg2: "#1c1712", fg: "#d8cdb8" },
  { bg: "#b08968", bg2: "#8a6547", fg: "#211c15" },
  { bg: "#4c86e0", bg2: "#33619f", fg: "#f5f7fb" },
  { bg: "#7a8b4f", bg2: "#5a6838", fg: "#f2f3e4" },
];

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function coverPaletteFor(seed: string): CoverPalette {
  return PALETTES[hashString(seed) % PALETTES.length];
}
