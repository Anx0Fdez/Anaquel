import { useEffect, useRef } from "react";
import { ArrowUpDown, Grid2x2, Grid3x3, LayoutGrid, Plus, Search, Square, Table2 } from "lucide-react";
import type { GridCardSize, LibraryKind, ViewMode } from "../../types/book";
import { GRID_CARD_SIZE_LABEL } from "../../types/book";
import type { SortKey } from "../../lib/sort";
import { SORT_LABEL } from "../../lib/sort";
import { DropdownSelect } from "../ui/fields/DropdownSelect";
import "./Topbar.css";

interface TopbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortKey: SortKey;
  onSortKeyChange: (key: SortKey) => void;
  gridCardSize: GridCardSize;
  onGridCardSizeChange: (size: GridCardSize) => void;
  libraryKind: LibraryKind;
  onAddBook: () => void;
}

const VIEW_MODES: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { mode: "grid", icon: LayoutGrid, label: "Vista de cuadrícula" },
  { mode: "table", icon: Table2, label: "Vista de tabla" },
];

const SORT_KEYS: SortKey[] = ["titulo", "autor", "saga", "valoracion", "estado", "favoritos"];
const SORT_OPTIONS = SORT_KEYS.map((key) => ({ value: key, label: SORT_LABEL[key] }));

const CARD_SIZES: { size: GridCardSize; icon: typeof Square }[] = [
  { size: "grande", icon: Square },
  { size: "mediano", icon: Grid2x2 },
  { size: "pequeno", icon: Grid3x3 },
];

export function Topbar({
  query,
  onQueryChange,
  viewMode,
  onViewModeChange,
  sortKey,
  onSortKeyChange,
  gridCardSize,
  onGridCardSizeChange,
  libraryKind,
  onAddBook,
}: TopbarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={15} strokeWidth={2} />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar por título, autor o saga..."
        />
        <kbd className="topbar-search-kbd">Ctrl+K</kbd>
      </div>

      {viewMode === "grid" && (
        <div className="topbar-cardsize" role="group" aria-label="Tamaño de las tarjetas">
          {CARD_SIZES.map(({ size, icon: Icon }) => (
            <button
              key={size}
              type="button"
              className={`topbar-icon-btn${gridCardSize === size ? " topbar-icon-btn--active" : ""}`}
              onClick={() => onGridCardSizeChange(size)}
              title={`Tarjetas ${GRID_CARD_SIZE_LABEL[size].toLowerCase()}s`}
              aria-label={`Tarjetas ${GRID_CARD_SIZE_LABEL[size].toLowerCase()}s`}
              aria-pressed={gridCardSize === size}
            >
              <Icon size={15} strokeWidth={2} />
            </button>
          ))}
        </div>
      )}

      <div className="topbar-sort">
        <ArrowUpDown size={14} strokeWidth={2} />
        <DropdownSelect
          value={sortKey}
          options={SORT_OPTIONS}
          onChange={(v) => onSortKeyChange(v as SortKey)}
          triggerClassName="topbar-sort-trigger"
          align="right"
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

      <button className="topbar-add-btn" onClick={onAddBook}>
        <Plus size={16} strokeWidth={2.25} />
        {libraryKind === "audiolibros" ? "Añadir audiolibro" : "Añadir libro"}
      </button>
    </header>
  );
}
