import { useMemo, useState } from "react";
import type { Book } from "../../types/book";
import { FORMATO_LABEL } from "../../types/book";
import { StatusPill } from "./StatusPill";
import "./TableView.css";

type SortKey = "titulo" | "autor" | "estado" | "valoracion" | "formato";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; width: number }[] = [
  { key: "titulo", label: "Título", width: 280 },
  { key: "autor", label: "Autor", width: 200 },
  { key: "estado", label: "Estado", width: 150 },
  { key: "valoracion", label: "Valoración", width: 130 },
  { key: "formato", label: "Formato", width: 130 },
];

function sortValue(book: Book, key: SortKey): string | number {
  switch (key) {
    case "titulo":
      return book.titulo.toLowerCase();
    case "autor":
      return book.autor.toLowerCase();
    case "estado":
      return book.estado;
    case "valoracion":
      return book.valoracion ?? -1;
    case "formato":
      return book.formato;
  }
}

interface TableViewProps {
  books: Book[];
  onSelect?: (book: Book) => void;
  onBackgroundClick?: () => void;
}

export function TableView({ books, onSelect, onBackgroundClick }: TableViewProps) {
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
    <div
      className="table-view"
      onClick={(e) => {
        if (e.target === e.currentTarget) onBackgroundClick?.();
      }}
    >
      <div className="table-view-card">
        <table>
          <colgroup>
            {COLUMNS.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`table-col-field${sortKey === col.key ? " table-col-field--active" : ""}`}
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
            {sorted.map((book) => (
              <tr key={book.id} className="table-body-row" onClick={() => onSelect?.(book)}>
                <td className="table-cell table-cell--title">{book.titulo}</td>
                <td className="table-cell">{book.autor}</td>
                <td className="table-cell">
                  <StatusPill estado={book.estado} audio={book.formato === "audiolibro"} />
                </td>
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
    </div>
  );
}
