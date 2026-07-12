import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { TableView } from "./components/library/TableView";
import { GridView } from "./components/library/GridView";
import { ListView } from "./components/library/ListView";
import { AddBookDialog } from "./components/library/AddBookDialog";
import { mockLibrary } from "./data/mockLibrary";
import type { Book, Theme, ViewMode } from "./types/book";
import type { NavFilter } from "./state/filters";
import { matchesFilter, matchesSearch } from "./state/filters";
import "./styles/theme.css";
import "./App.css";

function readStoredTheme(): Theme {
  const stored = localStorage.getItem("ananquel:theme");
  return stored === "light" ? "light" : "dark";
}

export default function App() {
  const [books, setBooks] = useState<Book[]>(mockLibrary);
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [navFilter, setNavFilter] = useState<NavFilter>({ kind: "all" });
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ananquel:theme", theme);
  }, [theme]);

  const anaqueles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of books) {
      for (const a of b.anaqueles) {
        counts.set(a, (counts.get(a) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [books]);

  const stats = useMemo(() => {
    const year = String(new Date().getFullYear());
    const leidosEsteAño = books.filter((b) => b.fechas.fin_lectura?.startsWith(year));
    const pages = leidosEsteAño.reduce((sum, b) => sum + (b.progreso.paginas_totales ?? 0), 0);
    return { booksThisYear: leidosEsteAño.length, pagesThisYear: pages };
  }, [books]);

  const visibleBooks = useMemo(
    () => books.filter((b) => matchesFilter(b, navFilter) && matchesSearch(b, query)),
    [books, navFilter, query],
  );

  return (
    <div className="app-shell">
      <Sidebar
        activeFilter={navFilter}
        onFilterChange={setNavFilter}
        anaqueles={anaqueles}
        stats={stats}
      />

      <div className="app-main">
        <Topbar
          query={query}
          onQueryChange={setQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          theme={theme}
          onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          onAddBook={() => setDialogOpen(true)}
        />

        {viewMode === "table" && <TableView books={visibleBooks} />}
        {viewMode === "grid" && <GridView books={visibleBooks} />}
        {viewMode === "list" && <ListView books={visibleBooks} />}
      </div>

      {dialogOpen && (
        <AddBookDialog
          onClose={() => setDialogOpen(false)}
          onAdd={(book) => {
            setBooks((prev) => [book, ...prev]);
            setDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
