import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "./layout/Sidebar";
import { LibraryListView } from "./library/LibraryListView";
import { BookDetailScreen } from "./library/detail/BookDetailScreen";
import { loadBooks, saveBooks } from "../lib/library";
import { saveVaultConfig } from "../lib/vault";
import type { Book, Theme, ViewMode } from "../types/book";
import type { VaultInfo } from "../types/vault";
import type { NavFilter } from "../state/filters";
import { matchesFilter, matchesSearch } from "../state/filters";

interface LibraryScreenProps {
  vault: VaultInfo;
  onSwitchVault: () => void;
}

export function LibraryScreen({ vault, onSwitchVault }: LibraryScreenProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(vault.config.theme);
  const [viewMode, setViewMode] = useState<ViewMode>(vault.config.lastView);
  const [navFilter, setNavFilter] = useState<NavFilter>({ kind: "all" });
  const [query, setQuery] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    loadBooks(vault.path)
      .then((loadedBooks) => {
        if (!cancelled) setBooks(loadedBooks);
      })
      .catch((err) => {
        if (!cancelled) setSaveError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [vault.path]);

  useEffect(() => {
    saveVaultConfig(vault.path, {
      theme,
      lastView: viewMode,
      anaquelOrder: vault.config.anaquelOrder,
    }).catch(() => {
      // si falla el guardado, la próxima interacción del usuario lo reintentará igualmente
    });
  }, [theme, viewMode, vault.path, vault.config.anaquelOrder]);

  function persistBooks(updated: Book[]) {
    setBooks(updated);
    saveBooks(vault.path, updated).catch((err) => setSaveError(String(err)));
  }

  function handleFilterChange(filter: NavFilter) {
    setNavFilter(filter);
    setSelectedBookId(null);
  }

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

  const selectedBook = useMemo(
    () => books.find((b) => b.id === selectedBookId) ?? null,
    [books, selectedBookId],
  );

  if (!loaded) {
    return <div className="app-loading" />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        vaultName={vault.name}
        activeFilter={navFilter}
        onFilterChange={handleFilterChange}
        anaqueles={anaqueles}
        stats={stats}
        onSwitchVault={onSwitchVault}
      />

      <div className="app-main">
        {saveError && (
          <div className="app-save-error" role="alert">
            No se pudo guardar en el anaquel: {saveError}
          </div>
        )}

        {selectedBook ? (
          <BookDetailScreen
            book={selectedBook}
            allBooks={books}
            onBack={() => setSelectedBookId(null)}
            onChange={(updated) =>
              persistBooks(books.map((b) => (b.id === updated.id ? updated : b)))
            }
            onDelete={() => {
              persistBooks(books.filter((b) => b.id !== selectedBook.id));
              setSelectedBookId(null);
            }}
          />
        ) : (
          <LibraryListView
            books={visibleBooks}
            query={query}
            onQueryChange={setQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            theme={theme}
            onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            onAddBook={(book) => persistBooks([book, ...books])}
            onSelectBook={(book) => setSelectedBookId(book.id)}
          />
        )}
      </div>
    </div>
  );
}
