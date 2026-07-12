import {
  ArrowLeftRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  Headphones,
  Heart,
  Layers,
  Library,
} from "lucide-react";
import type { NavFilter } from "../../state/filters";
import { filterKey } from "../../state/filters";
import "./Sidebar.css";

interface AnaquelEntry {
  nombre: string;
  count: number;
}

interface SidebarProps {
  vaultName: string;
  activeFilter: NavFilter;
  onFilterChange: (filter: NavFilter) => void;
  anaqueles: AnaquelEntry[];
  stats: { booksThisYear: number; pagesThisYear: number };
  onSwitchVault: () => void;
}

const NAV_ITEMS: { filter: NavFilter; label: string; icon: typeof Library }[] = [
  { filter: { kind: "all" }, label: "Biblioteca", icon: Library },
  { filter: { kind: "estado", estado: "leyendo" }, label: "Leyendo", icon: BookOpen },
  { filter: { kind: "estado", estado: "quiero_leer" }, label: "Quiero leer", icon: BookMarked },
  { filter: { kind: "estado", estado: "leido" }, label: "Leídos", icon: CheckCircle2 },
  { filter: { kind: "estado", estado: "audiolibro" }, label: "Audiolibros", icon: Headphones },
  { filter: { kind: "favoritos" }, label: "Favoritos", icon: Heart },
];

export function Sidebar({
  vaultName,
  activeFilter,
  onFilterChange,
  anaqueles,
  stats,
  onSwitchVault,
}: SidebarProps) {
  const activeKey = filterKey(activeFilter);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Library size={20} strokeWidth={2.25} />
        <span>Ananquel</span>
      </div>

      <button
        className="sidebar-vault-switch"
        onClick={onSwitchVault}
        title="Cambiar biblioteca"
      >
        <span className="sidebar-vault-switch-name">{vaultName}</span>
        <ArrowLeftRight size={12} strokeWidth={2} />
      </button>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ filter, label, icon: Icon }) => {
          const key = filterKey(filter);
          return (
            <button
              key={key}
              className={`sidebar-item${key === activeKey ? " sidebar-item--active" : ""}`}
              onClick={() => onFilterChange(filter)}
            >
              <Icon size={16} strokeWidth={2} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {anaqueles.length > 0 && (
        <>
          <div className="sidebar-heading">Anaqueles</div>
          <nav className="sidebar-nav">
            {anaqueles.map(({ nombre, count }) => {
              const filter: NavFilter = { kind: "anaquel", nombre };
              const key = filterKey(filter);
              return (
                <button
                  key={key}
                  className={`sidebar-item${key === activeKey ? " sidebar-item--active" : ""}`}
                  onClick={() => onFilterChange(filter)}
                >
                  <Layers size={16} strokeWidth={2} />
                  <span>{nombre}</span>
                  <span className="sidebar-item-count">{count}</span>
                </button>
              );
            })}
          </nav>
        </>
      )}

      <div className="sidebar-stats">
        Este año: {stats.booksThisYear} libros · {stats.pagesThisYear.toLocaleString("es-ES")} páginas
      </div>
    </aside>
  );
}
