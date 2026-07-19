import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useDismiss } from "../../../lib/useDismiss";
import "./DropdownSelect.css";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownSelectProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  triggerClassName?: string;
  menuClassName?: string;
  align?: "left" | "right";
  direction?: "down" | "up";
}

export function DropdownSelect({
  value,
  options,
  onChange,
  triggerClassName,
  menuClassName,
  align = "left",
  direction = "down",
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useDismiss(open, rootRef, () => setOpen(false));

  return (
    <div className="dropdown-select" ref={rootRef}>
      <button
        type="button"
        className={`dropdown-select-trigger${triggerClassName ? ` ${triggerClassName}` : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="dropdown-select-trigger-label">{selected?.label ?? value}</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`dropdown-chevron${open ? " dropdown-chevron--open" : ""}`}
        />
      </button>
      {open && (
        <ul
          className={`dropdown-menu${align === "right" ? " dropdown-menu--right" : ""}${direction === "up" ? " dropdown-menu--up" : ""}${menuClassName ? ` ${menuClassName}` : ""}`}
          role="listbox"
        >
          {options.map((opt) => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                className={`dropdown-menu-item${opt.value === value ? " dropdown-menu-item--active" : ""}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
