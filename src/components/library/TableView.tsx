import { useMemo, useState } from "react";
import type { Book } from "../../types/book";
import { FORMATO_LABEL } from "../../types/book";
import { StatusPill } from "./StatusPill";
import "./TableView.css";

type SortKey = "titulo" | "autor" | "estado" | "genero" | "valoracion" | "formato";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; letter: string; label: string; width: number }[] = [
  { key: "titulo", letter: "A", label: "Título", width: 260 },
  { key: "autor", letter: "B", label: "Autor", width: 200 },
  { key: "estado", letter: "C", label: "Estado", width: 150 },
  { key: "genero", letter: "D", label: "Género", width: 160 },
  { key: "valoracion", letter: "E", label: "Valoración", width: 130 },
  { key: "formato", letter: "F", label: "Formato", width: 130 },
];

function sortValue(book: Book, key: SortKey): string | number {
  switch (key) {
    case "titulo":
      return book.titulo.toLowerCase();
    case "autor":
      return book.autor.toLowerCase();
    case "estado":
      return book.estado;
    case "genero":
      return book.genero.join(", ").toLowerCase();
    case "valoracion":
      return book.valoracion ?? -1;
    case "formato":
      return book.formato;
  }
}

interface TableViewProps {
  books: Book[];
  onSelect?: (book: Book) => void;
}

export function TableView({ books, onSelect }: TableViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("titulo");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const copy = [...books];
    copy.sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), "es");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [books, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="table-view">
      <table>
        <colgroup>
          <col style={{ width: 44 }} />
          {COLUMNS.map((col) => (
            <col key={col.key} style={{ width: col.width }} />
          ))}
        </colgroup>
        <thead>
          <tr className="table-row-letters">
            <th className="table-col-num" aria-hidden />
            {COLUMNS.map((col) => (
              <th key={col.key} className="table-col-letter">
                {col.letter}
              </th>
            ))}
          </tr>
          <tr className="table-row-fields">
            <th className="table-col-num">#</th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className="table-col-field"
                onClick={() => toggleSort(col.key)}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="table-sort-arrow">{sortDir === "asc" ? "▲" : "▼"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((book, i) => (
            <tr key={book.id} className="table-body-row" onClick={() => onSelect?.(book)}>
              <td className="table-col-num">{i + 1}</td>
              <td className="table-cell table-cell--title">{book.titulo}</td>
              <td className="table-cell">{book.autor}</td>
              <td className="table-cell">
                <StatusPill estado={book.estado} />
              </td>
              <td className="table-cell table-cell--muted">{book.genero.join(", ") || "—"}</td>
              <td className="table-cell table-cell--muted">
                {book.valoracion ? `★ ${book.valoracion}` : "—"}
              </td>
              <td className="table-cell table-cell--muted">{FORMATO_LABEL[book.formato]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && <div className="table-empty">No se han encontrado libros.</div>}
    </div>
  );
}
