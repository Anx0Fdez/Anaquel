import { useMemo } from "react";
import { Heart, RotateCcw, ShoppingBag, Star } from "lucide-react";
import type { Book, GridCardSize, LibraryKind } from "../../types/book";
import type { SortKey } from "../../lib/sort";
import type { BookGroup, GroupField } from "../../lib/grouping";
import { groupBooks } from "../../lib/grouping";
import { StatusPill } from "./StatusPill";
import { BookCoverArt } from "./BookCoverArt";
import "./GridView.css";

interface GridViewProps {
  vaultPath: string;
  books: Book[];
  libraryKind: LibraryKind;
  sortKey: SortKey;
  cardSize?: GridCardSize;
  onSelect?: (book: Book) => void;
  selectedBookId?: string | null;
  onBackgroundClick?: () => void;
}

function BookSpine({
  book,
  vaultPath,
  selected,
  delay,
  onSelect,
}: {
  book: Book;
  vaultPath: string;
  selected: boolean;
  delay: number;
  onSelect?: (book: Book) => void;
}) {
  return (
    <button
      className={`book-spine${selected ? " book-spine--active" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => onSelect?.(book)}
    >
      <div className="book-spine-cover">
        <BookCoverArt book={book} vaultPath={vaultPath} />
        {book.favorito && <Heart className="book-spine-fav" size={13} fill="currentColor" />}
      </div>

      <div className="book-spine-text">
        <p className="book-spine-title">{book.titulo}</p>
        <p className="book-spine-author">{book.autor}</p>
        <div className="book-spine-meta">
          <StatusPill estado={book.estado} audio={book.formato === "audiolibro"} size="sm" />
          <div className="book-spine-meta-right">
            {book.valoracion != null && (
              <span className="book-spine-rating">
                <Star size={11} fill="currentColor" />
                {book.valoracion}
              </span>
            )}
            {book.formato !== "audiolibro" && book.relectura && (
              <span className="book-spine-badge" title="Marcado para relectura">
                <RotateCcw size={12} strokeWidth={2} />
              </span>
            )}
            {book.comprar_fisico && (
              <span className="book-spine-badge" title="Pendiente de comprar en físico">
                <ShoppingBag size={12} strokeWidth={2} />
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

const GROUPABLE_FIELDS: SortKey[] = ["autor", "saga", "estado"];

export function GridView({
  vaultPath,
  books,
  libraryKind,
  sortKey,
  cardSize = "mediano",
  onSelect,
  selectedBookId,
  onBackgroundClick,
}: GridViewProps) {
  const audio = libraryKind === "audiolibros";
  const groupField = GROUPABLE_FIELDS.includes(sortKey) ? (sortKey as GroupField) : null;
  const groups: BookGroup[] | null = useMemo(
    () => (groupField ? groupBooks(books, groupField, audio) : null),
    [books, groupField, audio],
  );
  const gridClass = `grid-view${cardSize !== "mediano" ? ` grid-view--${cardSize}` : ""}`;

  if (books.length === 0) {
    return <div className="grid-empty">No se han encontrado libros.</div>;
  }

  return (
    <div
      className="grid-view-scroll"
      onClick={(e) => {
        if (e.target === e.currentTarget) onBackgroundClick?.();
      }}
    >
      {groups ? (
        groups.map((group) => (
          <section key={group.key} className="grid-group">
            <h2 className="grid-group-header">
              <span className="grid-group-header-label">{group.label}</span>
              <span className="grid-group-header-line" aria-hidden="true" />
            </h2>
            <div className={gridClass}>
              {group.books.map((book, i) => (
                <BookSpine
                  key={book.id}
                  book={book}
                  vaultPath={vaultPath}
                  selected={book.id === selectedBookId}
                  delay={Math.min(i, 16) * 28}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className={gridClass}>
          {books.map((book, i) => (
            <BookSpine
              key={book.id}
              book={book}
              vaultPath={vaultPath}
              selected={book.id === selectedBookId}
              delay={Math.min(i, 16) * 28}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
