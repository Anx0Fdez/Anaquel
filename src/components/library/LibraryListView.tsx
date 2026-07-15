import { useState } from "react";
import { Topbar } from "../layout/Topbar";
import { TableView } from "./TableView";
import { GridView } from "./GridView";
import { AddBookDialog } from "./AddBookDialog";
import type { Book, GridCardSize, LibraryKind, ViewMode } from "../../types/book";
import type { SortKey } from "../../lib/sort";

interface LibraryListViewProps {
  vaultPath: string;
  libraryKind: LibraryKind;
  books: Book[];
  query: string;
  onQueryChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortKey: SortKey;
  onSortKeyChange: (key: SortKey) => void;
  gridCardSize: GridCardSize;
  onGridCardSizeChange: (size: GridCardSize) => void;
  onAddBook: (book: Book) => void;
  onSelectBook: (book: Book) => void;
  selectedBookId: string | null;
  onBackgroundClick?: () => void;
}

export function LibraryListView({
  vaultPath,
  libraryKind,
  books,
  query,
  onQueryChange,
  viewMode,
  onViewModeChange,
  sortKey,
  onSortKeyChange,
  gridCardSize,
  onGridCardSizeChange,
  onAddBook,
  onSelectBook,
  selectedBookId,
  onBackgroundClick,
}: LibraryListViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Topbar
        query={query}
        onQueryChange={onQueryChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        sortKey={sortKey}
        onSortKeyChange={onSortKeyChange}
        gridCardSize={gridCardSize}
        onGridCardSizeChange={onGridCardSizeChange}
        onAddBook={() => setDialogOpen(true)}
      />

      {viewMode === "table" && (
        <TableView books={books} onSelect={onSelectBook} onBackgroundClick={onBackgroundClick} />
      )}
      {viewMode === "grid" && (
        <GridView
          vaultPath={vaultPath}
          books={books}
          cardSize={gridCardSize}
          onSelect={onSelectBook}
          selectedBookId={selectedBookId}
          onBackgroundClick={onBackgroundClick}
        />
      )}

      {dialogOpen && (
        <AddBookDialog
          vaultPath={vaultPath}
          defaultFormato={libraryKind === "audiolibros" ? "audiolibro" : "fisico"}
          onClose={() => setDialogOpen(false)}
          onAdd={(book) => {
            onAddBook(book);
            setDialogOpen(false);
          }}
        />
      )}
    </>
  );
}
