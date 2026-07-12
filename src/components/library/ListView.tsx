import { Star } from "lucide-react";
import type { Book } from "../../types/book";
import { StatusPill } from "./StatusPill";
import "./ListView.css";

interface ListViewProps {
  books: Book[];
  onSelect?: (book: Book) => void;
}

export function ListView({ books, onSelect }: ListViewProps) {
  if (books.length === 0) {
    return <div className="list-empty">No se han encontrado libros.</div>;
  }

  return (
    <div className="list-view">
      {books.map((book, i) => (
        <button
          key={book.id}
          className="list-row"
          style={{ animationDelay: `${Math.min(i, 24) * 16}ms` }}
          onClick={() => onSelect?.(book)}
        >
          <span className={`list-swatch spine--${book.estado}`} aria-hidden />
          <span className="list-main">
            <span className="list-title">{book.titulo}</span>
            <span className="list-author">{book.autor}</span>
          </span>
          <span className="list-genre">{book.genero.join(", ") || "—"}</span>
          <span className="list-rating">
            {book.valoracion != null && (
              <>
                <Star size={12} fill="currentColor" />
                {book.valoracion}
              </>
            )}
          </span>
          <StatusPill estado={book.estado} />
        </button>
      ))}
    </div>
  );
}
