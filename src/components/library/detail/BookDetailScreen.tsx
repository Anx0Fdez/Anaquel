import { useEffect } from "react";
import type { CSSProperties } from "react";
import { ArrowLeft } from "lucide-react";
import type { Book } from "../../../types/book";
import { ConfirmDeleteButton } from "../../ui/ConfirmDeleteButton";
import { InfoGeneralSection } from "./sections/InfoGeneralSection";
import { EstadoSection } from "./sections/EstadoSection";
import { ComentariosSection } from "./sections/ComentariosSection";
import { coverPaletteFor } from "../../../lib/coverArt";
import { useCoverImage } from "../../../lib/useCoverImage";
import { useCoverAccent } from "../../../lib/useCoverAccent";
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

  // Acento local del panel, derivado del color dominante de la portada real
  // (o, si no hay una, de la paleta determinista de su portada tipográfica)
  // — nunca toca el acento global de la app, solo sobrescribe --accent
  // dentro de este panel vía la custom property inline de abajo.
  const coverUrl = useCoverImage(vaultPath, book.portada);
  const extractedAccent = useCoverAccent(coverUrl);
  const accent = extractedAccent ?? coverPaletteFor(book.id || book.titulo).bg;
  const accentStyle = { "--accent": accent } as CSSProperties;

  return (
    <div className={`book-detail${closing ? " book-detail--closing" : ""}`} style={accentStyle}>
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
