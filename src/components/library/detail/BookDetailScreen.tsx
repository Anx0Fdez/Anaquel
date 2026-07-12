import { useEffect, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import type { Book } from "../../../types/book";
import { InfoGeneralSection } from "./sections/InfoGeneralSection";
import { EstadoSection } from "./sections/EstadoSection";
import { OrganizacionSection } from "./sections/OrganizacionSection";
import { PrestamoSection } from "./sections/PrestamoSection";
import { ContenidoSection } from "./sections/ContenidoSection";
import "./BookDetailScreen.css";

interface BookDetailScreenProps {
  book: Book;
  allBooks: Book[];
  onBack: () => void;
  onChange: (book: Book) => void;
  onDelete: () => void;
}

export function BookDetailScreen({ book, allBooks, onBack, onChange, onDelete }: BookDetailScreenProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onBack();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  useEffect(() => {
    setConfirmingDelete(false);
  }, [book.id]);

  return (
    <div className="book-detail">
      <header className="book-detail-header">
        <button className="book-detail-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Volver a la biblioteca
        </button>
        <h1 className="book-detail-title">{book.titulo}</h1>

        {confirmingDelete ? (
          <span className="book-detail-delete-confirm">
            <span>¿Eliminar este libro?</span>
            <button className="book-detail-delete-confirm-yes" onClick={onDelete}>
              Sí, eliminar
            </button>
            <button className="book-detail-delete-confirm-no" onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </button>
          </span>
        ) : (
          <button className="book-detail-delete" onClick={() => setConfirmingDelete(true)}>
            <Trash2 size={15} />
          </button>
        )}
      </header>

      <div className="book-detail-body">
        <InfoGeneralSection book={book} onChange={onChange} />
        <EstadoSection book={book} onChange={onChange} />
        <OrganizacionSection book={book} allBooks={allBooks} onChange={onChange} />
        <PrestamoSection book={book} onChange={onChange} />
        <ContenidoSection book={book} onChange={onChange} />
      </div>
    </div>
  );
}
