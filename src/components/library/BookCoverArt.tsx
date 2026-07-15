import type { Book } from "../../types/book";
import { coverPaletteFor } from "../../lib/coverArt";
import { useCoverImage } from "../../lib/useCoverImage";
import "./BookCoverArt.css";

interface BookCoverArtProps {
  book: Book;
  vaultPath: string;
}

export function BookCoverArt({ book, vaultPath }: BookCoverArtProps) {
  const coverUrl = useCoverImage(vaultPath, book.portada);

  if (coverUrl) {
    return <img className="book-cover-art book-cover-art-image" src={coverUrl} alt="" />;
  }

  const palette = coverPaletteFor(book.id || book.titulo);
  return (
    <div
      className="book-cover-art"
      style={{
        background: `linear-gradient(155deg, ${palette.bg}, ${palette.bg2})`,
        color: palette.fg,
      }}
    >
      <span className="book-cover-art-title">{book.titulo}</span>
      <span className="book-cover-art-author">{book.autor}</span>
    </div>
  );
}
