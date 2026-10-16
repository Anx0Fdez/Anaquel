import { useState, type CSSProperties, type PointerEvent } from "react";
import { Pipette } from "lucide-react";
import "./AccentColorPicker.css";

interface AccentColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return `#${[r, g, b].map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, "0")).join("")}`;
}

function hexToHsv(hex: string): [number, number, number] {
  const channels = hex.match(/[\da-f]{2}/gi);
  if (!channels || channels.length < 3) return [24, 0.72, 0.85];
  const [r, g, b] = channels.slice(0, 3).map((channel) => parseInt(channel, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const hue = delta === 0 ? 0 : max === r ? 60 * (((g - b) / delta) % 6) : max === g ? 60 * ((b - r) / delta + 2) : 60 * ((r - g) / delta + 4);
  return [(hue + 360) % 360, max === 0 ? 0 : delta / max, max];
}

export function AccentColorPicker({ value, onChange, onClose }: AccentColorPickerProps) {
  const [hue, setHue] = useState(() => hexToHsv(value)[0]);
  const [saturation, setSaturation] = useState(() => hexToHsv(value)[1]);
  const [brightness, setBrightness] = useState(() => hexToHsv(value)[2]);
  const [hexDraft, setHexDraft] = useState(value.toUpperCase());
  const currentColor = hsvToHex(hue, saturation, brightness);

  function updateColor(nextHue: number, nextSaturation = saturation, nextBrightness = brightness) {
    setHue(nextHue);
    setSaturation(nextSaturation);
    setBrightness(nextBrightness);
    const nextColor = hsvToHex(nextHue, nextSaturation, nextBrightness);
    setHexDraft(nextColor.toUpperCase());
    onChange(nextColor);
  }

  function updateField(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const nextSaturation = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const nextBrightness = 1 - Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    updateColor(hue, nextSaturation, nextBrightness);
  }

  return (
    <div
      className="accent-picker"
      role="dialog"
      aria-label="Selector de color de acento"
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className="accent-picker-heading">
        <div>
          <span className="accent-picker-eyebrow">Personalizado</span>
          <strong>Color de acento</strong>
        </div>
      </div>

      <div
        className="accent-picker-field"
        role="slider"
        aria-label="Saturación y brillo"
        aria-valuetext={currentColor}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        style={{ "--picker-hue": `hsl(${hue} 100% 50%)`, "--picker-x": `${saturation * 100}%`, "--picker-y": `${(1 - brightness) * 100}%` } as CSSProperties}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateField(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons === 1) updateField(event);
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.1 : 0.02;
          if (event.key === "ArrowLeft") updateColor(hue, Math.max(0, saturation - step));
          else if (event.key === "ArrowRight") updateColor(hue, Math.min(1, saturation + step));
          else if (event.key === "ArrowUp") updateColor(hue, saturation, Math.min(1, brightness + step));
          else if (event.key === "ArrowDown") updateColor(hue, saturation, Math.max(0, brightness - step));
        }}
      >
        <span className="accent-picker-handle" />
      </div>

      <div className="accent-picker-hue-row">
        <Pipette size={15} aria-hidden="true" />
        <input
          type="range"
          min="0"
          max="359"
          value={hue}
          aria-label="Tono"
          onChange={(event) => updateColor(Number(event.target.value))}
        />
      </div>

      <div className="accent-picker-footer">
        <span className="accent-picker-preview" style={{ background: currentColor }} />
        <label className="accent-picker-hex-label" htmlFor="accent-picker-hex">HEX</label>
        <input
          id="accent-picker-hex"
          className="accent-picker-hex"
          value={hexDraft}
          maxLength={7}
          spellCheck={false}
          aria-label="Código hexadecimal del color"
          onChange={(event) => {
            const draft = event.target.value.startsWith("#") ? event.target.value : `#${event.target.value}`;
            setHexDraft(draft.toUpperCase());
            if (/^#[\da-f]{6}$/i.test(draft)) {
              const [nextHue, nextSaturation, nextBrightness] = hexToHsv(draft);
              setHue(nextHue);
              setSaturation(nextSaturation);
              setBrightness(nextBrightness);
              onChange(draft.toLowerCase());
            }
          }}
          onBlur={() => {
            if (!/^#[\da-f]{6}$/i.test(hexDraft)) setHexDraft(currentColor.toUpperCase());
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
      </div>
    </div>
  );
}
