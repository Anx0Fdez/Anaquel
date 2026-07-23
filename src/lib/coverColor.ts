function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  return { h: h * 60, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const SAMPLE_SIZE = 32;
const ACCENT_SATURATION = 0.55;
const ACCENT_LIGHTNESS = 0.56;

/**
 * Extrae un color de acento a partir de una portada (data URL), para usarse
 * como `--accent` local del panel de detalle — nunca toca el acento global
 * de la app. Reduce la imagen a una miniatura, descarta píxeles casi
 * blancos/negros o poco saturados (bordes de página, sombras, texto) y
 * calcula la media circular del tono (hue) de lo que queda, ponderada por
 * saturación, para que colores opuestos en la rueda cromática no se anulen
 * entre sí. La saturación y luminosidad del resultado se fijan a un valor
 * agradable y consistente (no las de la imagen real) — así el acento
 * siempre funciona bien como color de interfaz, sea cual sea el brillo o
 * contraste real de la portada. Devuelve `null` si la portada es
 * prácticamente monocroma (no hay tono dominante fiable que sacar).
 */
export function extractAccentColor(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

        let sinSum = 0;
        let cosSum = 0;
        let weightSum = 0;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 200) continue;
          const { h, s, l } = rgbToHsl(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
          if (s < 0.15 || l < 0.12 || l > 0.9) continue;
          const rad = (h / 360) * Math.PI * 2;
          sinSum += Math.sin(rad) * s;
          cosSum += Math.cos(rad) * s;
          weightSum += s;
        }

        if (weightSum < 4) {
          resolve(null);
          return;
        }

        const hue = ((Math.atan2(sinSum, cosSum) / (Math.PI * 2)) * 360 + 360) % 360;
        resolve(hslToHex(hue, ACCENT_SATURATION, ACCENT_LIGHTNESS));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
