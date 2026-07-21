import { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import type { Book } from "../../../../types/book";
import { DetailSection } from "../DetailSection";
import { CommentEditorModal } from "./CommentEditorModal";
import "./ComentariosSection.css";

interface ComentariosSectionProps {
  book: Book;
  onChange: (book: Book) => void;
}

export function ComentariosSection({ book, onChange }: ComentariosSectionProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const [truncated, setTruncated] = useState(false);
  const text = book.comentarios ?? "";
  const empty = !text.trim();

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setTruncated(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <DetailSection title="Comentarios" icon={MessageSquare}>
      <button
        type="button"
        className={`comment-preview detail-field-wide${empty ? " comment-preview--empty" : ""}`}
        onClick={() => setEditorOpen(true)}
      >
        <div ref={textRef} className="comment-preview-text">
          {empty ? "Añadir comentario…" : text}
        </div>
        {truncated && <span className="comment-preview-fade" aria-hidden="true" />}
      </button>

      {editorOpen && (
        <CommentEditorModal
          value={text}
          onCancel={() => setEditorOpen(false)}
          onSave={(value) => {
            onChange({ ...book, comentarios: value.trim() ? value : null });
            setEditorOpen(false);
          }}
        />
      )}
    </DetailSection>
  );
}
