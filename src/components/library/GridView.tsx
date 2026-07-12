import { Heart, Star } from "lucide-react";
import type { Book } from "../../types/book";
import "./GridView.css";

interface GridViewProps {
  books: Book[];
  onSelect?: (book: Book) => void;
}

export function GridView({ books, onSelect }: GridViewProps) {
  if (books.length === 0) {
    return <div className="grid-empty">No se han encontrado libros.</div>;
  }

  return (
    <div className="grid-view">
      {books.map((book, i) => (
        <button
          key={book.id}
          className={`book-spine spine--${book.estado}`}
          style={{ animationDelay: `${Math.min(i, 16) * 28}ms` }}
          onClick={() => onSelect?.(book)}
        >
          <div className="book-spine-top">
            {book.saga && (
              <span className="book-spine-saga">
                {book.saga.nombre} · #{book.saga.numero}
              </span>
            )}
            {book.favorito && <Heart className="book-spine-fav" size={14} fill="currentColor" />}
          </div>

          <div className="book-spine-body">
            <p className="book-spine-title">{book.titulo}</p>
            <p className="book-spine-author">{book.autor}</p>
          </div>

          <div className="book-spine-bottom">
            {book.valoracion != null && (
              <span className="book-spine-rating">
                <Star size={11} fill="currentColor" />
                {book.valoracion}
              </span>
            )}
            {book.progreso.porcentaje != null && (
              <div className="book-spine-progress-track">
                <div
                  className="book-spine-progress-fill"
                  style={{ width: `${book.progreso.porcentaje}%` }}
                />
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
