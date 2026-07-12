import { LayoutGrid, Moon, Plus, Rows3, Search, Sun, Table2 } from "lucide-react";
import type { Theme, ViewMode } from "../../types/book";
import "./Topbar.css";

interface TopbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  theme: Theme;
  onThemeToggle: () => void;
  onAddBook: () => void;
}

const VIEW_MODES: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { mode: "grid", icon: LayoutGrid, label: "Vista de cuadrícula" },
  { mode: "list", icon: Rows3, label: "Vista de lista" },
  { mode: "table", icon: Table2, label: "Vista de tabla" },
];

export function Topbar({
  query,
  onQueryChange,
  viewMode,
  onViewModeChange,
  theme,
  onThemeToggle,
  onAddBook,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={15} strokeWidth={2} />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar por título o autor"
        />
      </div>

      <div className="topbar-viewswitch" role="group" aria-label="Modo de vista">
        {VIEW_MODES.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            className={`topbar-icon-btn${viewMode === mode ? " topbar-icon-btn--active" : ""}`}
            onClick={() => onViewModeChange(mode)}
            title={label}
            aria-label={label}
          >
            <Icon size={16} strokeWidth={2} />
          </button>
        ))}
      </div>

      <button
        className="topbar-icon-btn"
        onClick={onThemeToggle}
        title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        aria-label="Cambiar tema"
      >
        {theme === "dark" ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
      </button>

      <button className="topbar-add-btn" onClick={onAddBook}>
        <Plus size={16} strokeWidth={2.25} />
        Añadir libro
      </button>
    </header>
  );
}
