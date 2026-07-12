import { useState } from "react";
import { Topbar } from "../layout/Topbar";
import { TableView } from "./TableView";
import { GridView } from "./GridView";
import { ListView } from "./ListView";
import { AddBookDialog } from "./AddBookDialog";
import type { Book, Theme, ViewMode } from "../../types/book";

interface LibraryListViewProps {
  books: Book[];
  query: string;
  onQueryChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  theme: Theme;
  onThemeToggle: () => void;
  onAddBook: (book: Book) => void;
  onSelectBook: (book: Book) => void;
}

export function LibraryListView({
  books,
  query,
  onQueryChange,
  viewMode,
  onViewModeChange,
  theme,
  onThemeToggle,
  onAddBook,
  onSelectBook,
}: LibraryListViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Topbar
        query={query}
        onQueryChange={onQueryChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        theme={theme}
        onThemeToggle={onThemeToggle}
        onAddBook={() => setDialogOpen(true)}
      />

      {viewMode === "table" && <TableView books={books} onSelect={onSelectBook} />}
      {viewMode === "grid" && <GridView books={books} onSelect={onSelectBook} />}
      {viewMode === "list" && <ListView books={books} onSelect={onSelectBook} />}

      {dialogOpen && (
        <AddBookDialog
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
