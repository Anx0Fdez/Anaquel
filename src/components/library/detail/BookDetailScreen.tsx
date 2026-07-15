import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import type { Book } from "../../../types/book";
import { ConfirmDeleteButton } from "../../ui/ConfirmDeleteButton";
import { InfoGeneralSection } from "./sections/InfoGeneralSection";
import { EstadoSection } from "./sections/EstadoSection";
import "./BookDetailScreen.css";

// Organización, Préstamo, Contenido y Notas se ocultan de la interfaz por
// ahora (rediseño visual) sin borrar sus componentes ni sus datos — vuelven
// a importarse aquí cuando se reactiven.

interface BookDetailScreenProps {
  book: Book;
  vaultPath: string;
  closing?: boolean;
  onBack: () => void;
  onChange: (book: Book) => void;
  onDelete: () => void;
}

export function BookDetailScreen({
  book,
  vaultPath,
  closing,
  onBack,
  onChange,
  onDelete,
}: BookDetailScreenProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onBack();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  return (
    <div className={`book-detail${closing ? " book-detail--closing" : ""}`}>
      <header className="book-detail-header">
        <button className="book-detail-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Volver a la biblioteca
        </button>

        <ConfirmDeleteButton
          key={book.id}
          onConfirm={onDelete}
          confirmText={book.formato === "audiolibro" ? "¿Eliminar audiolibro?" : "¿Eliminar este libro?"}
        />
      </header>

      <div className="book-detail-body">
        <InfoGeneralSection book={book} vaultPath={vaultPath} onChange={onChange} />
        <EstadoSection book={book} onChange={onChange} />
      </div>
    </div>
  );
}
