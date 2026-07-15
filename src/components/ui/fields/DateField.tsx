import { useMemo, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useDismiss } from "../../../lib/useDismiss";
import "./Fields.css";
import "./DateField.css";

interface DateFieldProps {
  label: string;
  value: string; // "" | "YYYY-MM-DD"
  onChange: (value: string) => void;
}

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const CLOSE_ANIM_MS = 160;

function parseISO(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Índice de día de la semana empezando en lunes (0=lunes .. 6=domingo).
function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function sameDay(a: Date, year: number, month: number, day: number): boolean {
  return a.getFullYear() === year && a.getMonth() === month && a.getDate() === day;
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  const selected = parseISO(value);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const rootRef = useRef<HTMLDivElement>(null);

  function requestClose() {
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, CLOSE_ANIM_MS);
  }

  useDismiss(open && !closing, rootRef, requestClose);

  function togglePanel() {
    if (open) {
      requestClose();
      return;
    }
    setViewDate(selected ?? new Date());
    setOpen(true);
  }

  function changeMonth(delta: number) {
    setDirection(delta > 0 ? "next" : "prev");
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  function pickDay(day: number) {
    onChange(toISO(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)));
    requestClose();
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const firstWeekday = mondayIndex(new Date(year, month, 1));
  const today = new Date();

  const cells = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) arr.push(null);
    for (let d = 1; d <= totalDays; d++) arr.push(d);
    return arr;
  }, [firstWeekday, totalDays]);

  return (
    <div className="field date-field" ref={rootRef}>
      <span>{label}</span>
      <button
        type="button"
        className="date-field-trigger"
        onClick={togglePanel}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarIcon size={13} strokeWidth={2} />
        <span className={`date-field-trigger-label${selected ? "" : " date-field-trigger-label--empty"}`}>
          {selected ? formatDisplay(selected) : "Sin fecha"}
        </span>
        {value && (
          <span
            className="date-field-clear"
            role="button"
            aria-label="Quitar fecha"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
          >
            <X size={12} strokeWidth={2.25} />
          </span>
        )}
      </button>

      {open && (
        <div className={`date-field-panel${closing ? " date-field-panel--closing" : ""}`}>
          <div className="date-field-header">
            <button type="button" className="date-field-nav" onClick={() => changeMonth(-1)} aria-label="Mes anterior">
              <ChevronLeft size={15} strokeWidth={2.25} />
            </button>
            <span className="date-field-month" key={`label-${year}-${month}`}>
              {MONTH_NAMES[month]} {year}
            </span>
            <button type="button" className="date-field-nav" onClick={() => changeMonth(1)} aria-label="Mes siguiente">
              <ChevronRight size={15} strokeWidth={2.25} />
            </button>
          </div>

          <div className="date-field-weekdays">
            {WEEKDAYS.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>

          <div
            className={`date-field-grid date-field-grid--${direction}`}
            key={`grid-${year}-${month}`}
          >
            {cells.map((day, i) =>
              day == null ? (
                <span key={i} className="date-field-cell date-field-cell--empty" />
              ) : (
                <button
                  type="button"
                  key={i}
                  className={`date-field-cell${
                    selected && sameDay(selected, year, month, day) ? " date-field-cell--selected" : ""
                  }${sameDay(today, year, month, day) ? " date-field-cell--today" : ""}`}
                  onClick={() => pickDay(day)}
                >
                  {day}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
