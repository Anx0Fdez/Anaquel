import { useState } from "react";
import { X } from "lucide-react";
import type { Book } from "../../../types/book";
import "../../ui/fields/Fields.css";

interface RelatedBooksFieldProps {
  book: Book;
  allBooks: Book[];
  onChange: (ids: string[]) => void;
}

export function RelatedBooksField({ book, allBooks, onChange }: RelatedBooksFieldProps) {
  const [query, setQuery] = useState("");

  const linked = book.enlaces_relacionados
    .map((id) => allBooks.find((b) => b.id === id))
    .filter((b): b is Book => b != null);

  const q = query.trim().toLowerCase();
  const matches =
    q.length > 0
      ? allBooks
          .filter(
            (b) =>
              b.id !== book.id &&
              !book.enlaces_relacionados.includes(b.id) &&
              b.titulo.toLowerCase().includes(q),
          )
          .slice(0, 6)
      : [];

  function addBook(id: string) {
    onChange([...book.enlaces_relacionados, id]);
    setQuery("");
  }

  function removeBook(id: string) {
    onChange(book.enlaces_relacionados.filter((x) => x !== id));
  }

  return (
    <div className="field detail-field-wide related-books-field">
      <span>Libros relacionados</span>
      <div className="field-tags">
        {linked.map((b) => (
          <span key={b.id} className="field-tag">
            {b.titulo}
            <button
              type="button"
              className="field-tag-remove"
              onClick={() => removeBook(b.id)}
              aria-label={`Quitar ${b.titulo}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          className="field-tags-input"
          value={query}
          placeholder="Buscar por título…"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {matches.length > 0 && (
        <ul className="related-books-suggestions">
          {matches.map((b) => (
            <li key={b.id}>
              <button type="button" onClick={() => addBook(b.id)}>
                {b.titulo} <span>· {b.autor}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
