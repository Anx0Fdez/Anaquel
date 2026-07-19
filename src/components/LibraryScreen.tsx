import { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "./layout/Sidebar";
import { LibraryListView } from "./library/LibraryListView";
import { BookDetailScreen } from "./library/detail/BookDetailScreen";
import { ExportModal } from "./library/ExportModal";
import { Toast } from "./ui/Toast";
import { loadBooks, saveBooks } from "../lib/library";
import { saveVaultConfig } from "../lib/vault";
import { pickExportPath, runExport, cancelExport } from "../lib/export";
import { applyWindowSize, getCurrentWindowSize } from "../lib/window";
import type { Book, GridCardSize, LibraryKind, Theme, ViewMode } from "../types/book";
import type { VaultInfo } from "../types/vault";
import type { NavFilter } from "../state/filters";
import { matchesFilter, matchesSearch, readingYear } from "../state/filters";
import type { SortKey } from "../lib/sort";
import { sortBooks } from "../lib/sort";

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
  const [sortKey, setSortKey] = useState<SortKey>((vault.config.defaultSortKey as SortKey | null) ?? "titulo");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [libraryKind, setLibraryKind] = useState<LibraryKind>(
    (vault.config.lastLibraryKind as LibraryKind | null) ?? "libros",
  );
  const [exportPhase, setExportPhase] = useState<"idle" | "visible" | "closing">("idle");
  const exportCancelledRef = useRef(false);
  const [windowWidth, setWindowWidth] = useState<number | null>(vault.config.windowWidth);
  const [windowHeight, setWindowHeight] = useState<number | null>(vault.config.windowHeight);
  const [accentColor, setAccentColor] = useState<string | null>(vault.config.accentColor);
  const [googleBooksApiKey, setGoogleBooksApiKey] = useState<string | null>(vault.config.googleBooksApiKey);
  const [gridCardSize, setGridCardSize] = useState<GridCardSize>(
    (vault.config.gridCardSize as GridCardSize | null) ?? "mediano",
  );
  const [toast, setToast] = useState<{ message: string; closing: boolean } | null>(null);
  const toastTimers = useRef<number[]>([]);

  function showToast(message: string) {
    toastTimers.current.forEach((t) => window.clearTimeout(t));
    setToast({ message, closing: false });
    const closeTimer = window.setTimeout(() => setToast((t) => (t ? { ...t, closing: true } : t)), 2200);
    const removeTimer = window.setTimeout(() => setToast(null), 2400);
    toastTimers.current = [closeTimer, removeTimer];
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (accentColor) {
      document.documentElement.style.setProperty("--accent", accentColor);
    } else {
      document.documentElement.style.removeProperty("--accent");
    }
  }, [accentColor]);

  // Tamaño de ventana por defecto del vault: se aplica una única vez al
  // abrirlo (no en cada render), para no pelearse con un resize manual del
  // usuario durante la sesión.
  useEffect(() => {
    if (vault.config.windowWidth != null && vault.config.windowHeight != null) {
      applyWindowSize(vault.config.windowWidth, vault.config.windowHeight).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vault.path]);

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
      windowWidth,
      windowHeight,
      accentColor,
      defaultSortKey: sortKey,
      lastLibraryKind: libraryKind,
      gridCardSize,
      googleBooksApiKey,
    }).catch(() => {
      // si falla el guardado, la próxima interacción del usuario lo reintentará igualmente
    });
  }, [
    theme,
    viewMode,
    vault.path,
    vault.config.anaquelOrder,
    windowWidth,
    windowHeight,
    accentColor,
    sortKey,
    libraryKind,
    gridCardSize,
    googleBooksApiKey,
  ]);

  async function handleSaveWindowSize() {
    try {
      const { width, height } = await getCurrentWindowSize();
      setWindowWidth(width);
      setWindowHeight(height);
      showToast("Tamaño de ventana guardado");
    } catch (err) {
      setSaveError(String(err));
    }
  }

  function persistBooks(updated: Book[]) {
    setBooks(updated);
    saveBooks(vault.path, updated).catch((err) => setSaveError(String(err)));
  }

  function handleFilterChange(filter: NavFilter) {
    setNavFilter(filter);
    setSelectedBookId(null);
  }

  function handleLibraryKindChange(kind: LibraryKind) {
    setLibraryKind(kind);
    setNavFilter({ kind: "all" });
    setQuery("");
    setSelectedBookId(null);
  }

  const MIN_EXPORT_VISIBLE_MS = 2000;
  const EXPORT_EXIT_ANIM_MS = 210;

  function closeExportModal() {
    setExportPhase("closing");
    window.setTimeout(() => setExportPhase("idle"), EXPORT_EXIT_ANIM_MS);
  }

  async function handleExport() {
    const targetPath = await pickExportPath();
    if (!targetPath) return;

    exportCancelledRef.current = false;
    setExportPhase("visible");
    const start = Date.now();

    try {
      await runExport(targetPath, books);
    } catch (err) {
      if (!exportCancelledRef.current) setSaveError(String(err));
    }

    if (exportCancelledRef.current) return;

    const elapsed = Date.now() - start;
    await new Promise((resolve) => window.setTimeout(resolve, Math.max(0, MIN_EXPORT_VISIBLE_MS - elapsed)));

    if (exportCancelledRef.current) return;
    closeExportModal();
  }

  function handleCancelExport() {
    exportCancelledRef.current = true;
    cancelExport().catch(() => {});
    closeExportModal();
  }

  // Libros y audiolibros se tratan como dos bibliotecas separadas en la
  // interfaz (aunque en memoria siguen siendo un único array — la
  // separación real en dos archivos vive en Rust): todo lo que ve cada
  // sección de la app se calcula solo sobre su propio subconjunto.
  const scopedBooks = useMemo(
    () =>
      books.filter((b) =>
        libraryKind === "audiolibros" ? b.formato === "audiolibro" : b.formato !== "audiolibro",
      ),
    [books, libraryKind],
  );

  // Los años de lectura del sidebar se derivan de las fechas de cada libro
  // (inicio_lectura, o fin_lectura si no hay inicio) — ningún campo aparte
  // que mantener sincronizado, igual que antes pasaba con género.
  const readingYears = useMemo(() => {
    const counts = new Map<number, number>();
    for (const b of scopedBooks) {
      const year = readingYear(b);
      if (year == null) continue;
      counts.set(year, (counts.get(year) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year - a.year);
  }, [scopedBooks]);

  const stats = useMemo(() => {
    const total = scopedBooks.length;
    const leidos = scopedBooks.filter((b) => b.estado === "leido").length;
    const enProgreso = scopedBooks.filter((b) => b.estado === "leyendo").length;
    const quieroLeer = scopedBooks.filter((b) => b.estado === "quiero_leer").length;
    return { total, leidos, enProgreso, quieroLeer };
  }, [scopedBooks]);

  const visibleBooks = useMemo(
    () => sortBooks(scopedBooks.filter((b) => matchesFilter(b, navFilter) && matchesSearch(b, query)), sortKey),
    [scopedBooks, navFilter, query, sortKey],
  );

  const selectedBook = useMemo(
    () => books.find((b) => b.id === selectedBookId) ?? null,
    [books, selectedBookId],
  );

  // Se mantiene el último libro renderizado un instante extra tras cerrar el
  // panel, para poder reproducir la animación de salida hacia la derecha
  // antes de desmontarlo de verdad (una desaparición condicional directa no
  // deja tiempo a que una transición CSS de salida se vea).
  const [renderedBook, setRenderedBook] = useState<Book | null>(null);
  const [panelClosing, setPanelClosing] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (selectedBook) {
      window.clearTimeout(closeTimer.current);
      setRenderedBook(selectedBook);
      setPanelClosing(false);
    } else if (renderedBook) {
      setPanelClosing(true);
      closeTimer.current = window.setTimeout(() => {
        setRenderedBook(null);
        setPanelClosing(false);
      }, 220);
    }
    return () => window.clearTimeout(closeTimer.current);
  }, [selectedBook]);

  if (!loaded) {
    return <div className="app-loading" />;
  }

  return (
    <>
    <div className={`app-shell${exportPhase !== "idle" ? " app-shell--blurred" : ""}`}>
      <Sidebar
        vaultName={vault.name}
        activeFilter={navFilter}
        onFilterChange={handleFilterChange}
        books={scopedBooks}
        readingYears={readingYears}
        stats={stats}
        theme={theme}
        onThemeToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onSwitchVault={onSwitchVault}
        libraryKind={libraryKind}
        onLibraryKindChange={handleLibraryKindChange}
        onExport={handleExport}
        exporting={exportPhase !== "idle"}
        accentColor={accentColor}
        onAccentColorChange={setAccentColor}
        googleBooksApiKey={googleBooksApiKey}
        onGoogleBooksApiKeyChange={setGoogleBooksApiKey}
        onSaveWindowSize={handleSaveWindowSize}
      />

      <div className="app-main">
        {saveError && (
          <div className="app-save-error" role="alert">
            No se pudo guardar en el anaquel: {saveError}
          </div>
        )}

        <div className="app-main-row">
          <div className="library-pane">
            <LibraryListView
              vaultPath={vault.path}
              libraryKind={libraryKind}
              googleBooksApiKey={googleBooksApiKey}
              books={visibleBooks}
              query={query}
              onQueryChange={setQuery}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortKey={sortKey}
              onSortKeyChange={setSortKey}
              gridCardSize={gridCardSize}
              onGridCardSizeChange={setGridCardSize}
              onAddBook={(book) => persistBooks([book, ...books])}
              onSelectBook={(book) => setSelectedBookId(book.id)}
              selectedBookId={selectedBookId}
              onBackgroundClick={() => setSelectedBookId(null)}
            />
          </div>

          {renderedBook && (
            <BookDetailScreen
              key={renderedBook.id}
              vaultPath={vault.path}
              googleBooksApiKey={googleBooksApiKey}
              book={renderedBook}
              closing={panelClosing}
              onBack={() => setSelectedBookId(null)}
              onChange={(updated) =>
                persistBooks(books.map((b) => (b.id === updated.id ? updated : b)))
              }
              onDelete={() => {
                persistBooks(books.filter((b) => b.id !== renderedBook.id));
                setSelectedBookId(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
    {exportPhase !== "idle" && (
      <ExportModal closing={exportPhase === "closing"} onCancel={handleCancelExport} />
    )}
    {toast && <Toast message={toast.message} closing={toast.closing} />}
    </>
  );
}
