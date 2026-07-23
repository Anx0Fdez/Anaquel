import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import type { Book } from "../../../types/book";
import { ConfirmDeleteButton } from "../../ui/ConfirmDeleteButton";
import { InfoGeneralSection } from "./sections/InfoGeneralSection";
import { EstadoSection } from "./sections/EstadoSection";
import { ComentariosSection } from "./sections/ComentariosSection";
import "./BookDetailScreen.css";

// Organización, Préstamo, Contenido y Notas se ocultan de la interfaz por
// ahora (rediseño visual) sin borrar sus componentes ni sus datos — vuelven
// a importarse aquí cuando se reactiven.

interface BookDetailScreenProps {
  book: Book;
  vaultPath: string;
  googleBooksApiKey: string | null;
  allBooks: Book[];
  closing?: boolean;
  /** `true` cuando este panel reemplaza a otro libro ya abierto (no una
   * apertura desde cero): se omite la animación de entrada para que saltar
   * entre libros ya abiertos no parezca una recarga. */
  instant?: boolean;
  onBack: () => void;
  onChange: (book: Book) => void;
  onDelete: () => void;
}

export function BookDetailScreen({
  book,
  vaultPath,
  googleBooksApiKey,
  allBooks,
  closing,
  instant,
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
    <div
      className={`book-detail${closing ? " book-detail--closing" : ""}${instant ? " book-detail--instant" : ""}`}
    >
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
        <InfoGeneralSection
          book={book}
          vaultPath={vaultPath}
          googleBooksApiKey={googleBooksApiKey}
          allBooks={allBooks}
          onChange={onChange}
        />
        <EstadoSection book={book} onChange={onChange} />
        <ComentariosSection book={book} onChange={onChange} />
      </div>
    </div>
  );
}
