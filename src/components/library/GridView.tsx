import { Heart, RotateCcw, ShoppingBag, Star } from "lucide-react";
import type { Book, GridCardSize } from "../../types/book";
import { StatusPill } from "./StatusPill";
import { BookCoverArt } from "./BookCoverArt";
import "./GridView.css";

interface GridViewProps {
  vaultPath: string;
  books: Book[];
  cardSize?: GridCardSize;
  onSelect?: (book: Book) => void;
  selectedBookId?: string | null;
  onBackgroundClick?: () => void;
}

export function GridView({
  vaultPath,
  books,
  cardSize = "mediano",
  onSelect,
  selectedBookId,
  onBackgroundClick,
}: GridViewProps) {
  if (books.length === 0) {
    return <div className="grid-empty">No se han encontrado libros.</div>;
  }

  return (
    <div
      className={`grid-view${cardSize !== "mediano" ? ` grid-view--${cardSize}` : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onBackgroundClick?.();
      }}
    >
      {books.map((book, i) => (
        <button
          key={book.id}
          className={`book-spine${book.id === selectedBookId ? " book-spine--active" : ""}`}
          style={{ animationDelay: `${Math.min(i, 16) * 28}ms` }}
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
      ))}
    </div>
  );
}
