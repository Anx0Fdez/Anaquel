import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftRight,
  BookMarked,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Headphones,
  Heart,
  KeyRound,
  Library,
  Maximize2,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import type { Book, LibraryKind, Theme } from "../../types/book";
import type { NavFilter } from "../../state/filters";
import { filterKey, matchesFilter } from "../../state/filters";
import { useDismiss } from "../../lib/useDismiss";
import { validateGoogleBooksApiKey } from "../../lib/metadata";
import "./Sidebar.css";

interface YearEntry {
  year: number;
  count: number;
}

const ACCENT_PRESETS = ["#fe9d16", "#4c86e0", "#4fa876", "#9c7fe0", "#e0577f", "#d9c53f"];

interface LibraryStats {
  total: number;
  leidos: number;
  enProgreso: number;
  quieroLeer: number;
}

interface SidebarProps {
  vaultName: string;
  activeFilter: NavFilter;
  onFilterChange: (filter: NavFilter) => void;
  books: Book[];
  readingYears: YearEntry[];
  stats: LibraryStats;
  theme: Theme;
  onThemeToggle: () => void;
  onSwitchVault: () => void;
  libraryKind: LibraryKind;
  onLibraryKindChange: (kind: LibraryKind) => void;
  onExport: () => void;
  exporting: boolean;
  accentColor: string | null;
  onAccentColorChange: (color: string | null) => void;
  googleBooksApiKey: string | null;
  onGoogleBooksApiKeyChange: (key: string | null) => void;
  onSaveWindowSize: () => void;
}

function navItemsFor(kind: LibraryKind): { filter: NavFilter; label: string; icon: typeof Library; showCount: boolean }[] {
  const audio = kind === "audiolibros";
  return [
    { filter: { kind: "all" }, label: "Biblioteca", icon: Library, showCount: false },
    { filter: { kind: "estado", estado: "leyendo" }, label: audio ? "Escuchando" : "Leyendo", icon: BookOpen, showCount: true },
    { filter: { kind: "estado", estado: "quiero_leer" }, label: audio ? "Quiero escuchar" : "Quiero leer", icon: BookMarked, showCount: true },
    { filter: { kind: "estado", estado: "leido" }, label: audio ? "Escuchados" : "Leídos", icon: CheckCircle2, showCount: true },
    { filter: { kind: "favoritos" }, label: "Favoritos", icon: Heart, showCount: true },
  ];
}

const LIBRARY_KINDS: { kind: LibraryKind; label: string; icon: typeof BookOpen }[] = [
  { kind: "libros", label: "Libros", icon: BookOpen },
  { kind: "audiolibros", label: "Audiolibros", icon: Headphones },
];

export function Sidebar({
  vaultName,
  activeFilter,
  onFilterChange,
  books,
  readingYears,
  stats,
  theme,
  onThemeToggle,
  onSwitchVault,
  libraryKind,
  onLibraryKindChange,
  onExport,
  exporting,
  accentColor,
  onAccentColorChange,
  googleBooksApiKey,
  onGoogleBooksApiKeyChange,
  onSaveWindowSize,
}: SidebarProps) {
  const activeKey = filterKey(activeFilter);
  const [showAllYears, setShowAllYears] = useState(false);
  const YEARS_LIMIT = 5;
  const visibleYears = showAllYears ? readingYears : readingYears.slice(0, YEARS_LIMIT);
  const hiddenYearsCount = readingYears.length - visibleYears.length;
  const audio = libraryKind === "audiolibros";
  const navItems = navItemsFor(libraryKind);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  useDismiss(settingsOpen, settingsRef, () => setSettingsOpen(false));

  const [apiKeyDraft, setApiKeyDraft] = useState(googleBooksApiKey ?? "");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [apiKeyCheck, setApiKeyCheck] = useState<"idle" | "valid" | "invalid">("idle");
  useEffect(() => {
    setApiKeyDraft(googleBooksApiKey ?? "");
  }, [googleBooksApiKey]);

  async function handleSaveApiKey(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = apiKeyDraft.trim();
    onGoogleBooksApiKeyChange(trimmed || null);

    setApiKeySaved(true);
    window.setTimeout(() => setApiKeySaved(false), 2000);

    if (!trimmed) {
      setApiKeyCheck("idle");
      return;
    }
    const valid = await validateGoogleBooksApiKey(trimmed).catch(() => false);
    setApiKeyCheck(valid ? "valid" : "invalid");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="" className="sidebar-logo-mark" />
        <span>Anaquel</span>
      </div>

      <div className="sidebar-library-switch" role="group" aria-label="Tipo de biblioteca">
        {LIBRARY_KINDS.map(({ kind, label, icon: Icon }) => (
          <button
            key={kind}
            className={`sidebar-library-switch-btn${kind === libraryKind ? " sidebar-library-switch-btn--active" : ""}`}
            onClick={() => onLibraryKindChange(kind)}
          >
            <Icon size={14} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>

      <div className="sidebar-heading">Biblioteca</div>
      <nav className="sidebar-nav">
        {navItems.map(({ filter, label, icon: Icon, showCount }) => {
          const key = filterKey(filter);
          const count = books.filter((b) => matchesFilter(b, filter)).length;
          return (
            <button
              key={key}
              className={`sidebar-item${key === activeKey ? " sidebar-item--active" : ""}`}
              onClick={() => onFilterChange(filter)}
            >
              <Icon size={16} strokeWidth={2} />
              <span>{label}</span>
              {showCount && <span className="sidebar-item-count">{count}</span>}
            </button>
          );
        })}
      </nav>

      {readingYears.length > 0 && (
        <>
          <div className="sidebar-heading">{audio ? "Años de escucha" : "Años de lectura"}</div>
          <nav className="sidebar-nav">
            {visibleYears.map(({ year, count }) => {
              const filter: NavFilter = { kind: "year", year };
              const key = filterKey(filter);
              return (
                <button
                  key={key}
                  className={`sidebar-item${key === activeKey ? " sidebar-item--active" : ""}`}
                  onClick={() => onFilterChange(filter)}
                >
                  <CalendarDays size={16} strokeWidth={2} />
                  <span>{year}</span>
                  <span className="sidebar-item-count">{count}</span>
                </button>
              );
            })}
            {readingYears.length > YEARS_LIMIT && (
              <button className="sidebar-item sidebar-item--muted" onClick={() => setShowAllYears((v) => !v)}>
                {showAllYears ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
                <span>{showAllYears ? "Ver menos" : `Ver ${hiddenYearsCount} más`}</span>
              </button>
            )}
          </nav>
        </>
      )}

      <div className="sidebar-stats-card">
        <div className="sidebar-stats-row">
          <span>{audio ? "Total de audiolibros" : "Total de libros"}</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="sidebar-stats-row">
          <span>{audio ? "Escuchados" : "Leídos"}</span>
          <strong>{stats.leidos}</strong>
        </div>
        <div className="sidebar-stats-row">
          <span>{audio ? "Escuchando" : "En progreso"}</span>
          <strong>{stats.enProgreso}</strong>
        </div>
        <div className="sidebar-stats-row">
          <span>{audio ? "Quiero escuchar" : "Quiero leer"}</span>
          <strong>{stats.quieroLeer}</strong>
        </div>
      </div>

      <div className="sidebar-footer-actions">
        <div className="sidebar-settings" ref={settingsRef}>
          <button
            className="sidebar-footer-btn"
            onClick={() => setSettingsOpen((o) => !o)}
            title="Ajustes"
            aria-label="Ajustes"
            aria-expanded={settingsOpen}
          >
            <Settings size={16} strokeWidth={2} />
          </button>
          {settingsOpen && (
            <div className="sidebar-settings-menu">
              <div className="sidebar-settings-vault">{vaultName}</div>
              <button
                className="sidebar-settings-item"
                onClick={() => {
                  setSettingsOpen(false);
                  onSwitchVault();
                }}
              >
                <ArrowLeftRight size={14} strokeWidth={2} />
                Cambiar / crear anaquel
              </button>
              <button
                className="sidebar-settings-item"
                onClick={() => {
                  setSettingsOpen(false);
                  onExport();
                }}
                disabled={exporting}
              >
                <Download size={14} strokeWidth={2} />
                {exporting ? "Exportando…" : "Exportar biblioteca (.xlsx)"}
              </button>
              <button
                className="sidebar-settings-item"
                onClick={() => {
                  setSettingsOpen(false);
                  onSaveWindowSize();
                }}
              >
                <Maximize2 size={14} strokeWidth={2} />
                Guardar tamaño de ventana actual
              </button>
              <div className="sidebar-settings-heading">Color de acento</div>
              <div className="sidebar-settings-colors">
                {ACCENT_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`sidebar-color-swatch${(accentColor ?? "#fe9d16").toLowerCase() === color ? " sidebar-color-swatch--active" : ""}`}
                    style={{ background: color }}
                    title={color}
                    aria-label={`Usar color de acento ${color}`}
                    onClick={() => onAccentColorChange(color === "#fe9d16" ? null : color)}
                  />
                ))}
                <label className="sidebar-color-swatch sidebar-color-swatch--custom" title="Color personalizado">
                  <input
                    type="color"
                    value={accentColor ?? "#fe9d16"}
                    onChange={(e) => onAccentColorChange(e.target.value)}
                  />
                </label>
              </div>
              <div className="sidebar-settings-heading">API key de Google Books</div>
              <form className="sidebar-apikey-row" onSubmit={handleSaveApiKey}>
                <KeyRound size={13} strokeWidth={2} />
                <input
                  className={`sidebar-apikey-input${apiKeyCheck !== "idle" ? ` sidebar-apikey-input--${apiKeyCheck}` : ""}`}
                  value={apiKeyDraft}
                  onChange={(e) => {
                    setApiKeyDraft(e.target.value);
                    setApiKeyCheck("idle");
                  }}
                  placeholder="Pégala aquí…"
                />
                <button type="submit" className="sidebar-apikey-save">
                  {apiKeySaved ? <Check size={13} strokeWidth={2.5} /> : "Guardar"}
                </button>
              </form>
            </div>
          )}
        </div>
        <button
          className="sidebar-footer-btn"
          onClick={onThemeToggle}
          title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          aria-label="Cambiar tema"
        >
          {theme === "dark" ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        </button>
      </div>
    </aside>
  );
}
