import { useMemo, useState } from "react";
import { Heart, RotateCcw } from "lucide-react";
import type { Book } from "../../types/book";
import { FORMATO_LABEL } from "../../types/book";
import { StatusPill } from "./StatusPill";
import "./TableView.css";

type SortKey =
  | "titulo"
  | "autor"
  | "saga"
  | "estado"
  | "valoracion"
  | "favorito"
  | "relectura"
  | "formato"
  | "editorial"
  | "paginas"
  | "inicio_lectura"
  | "fin_lectura";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; width: number; align?: "center" }[] = [
  { key: "titulo", label: "Título", width: 260 },
  { key: "autor", label: "Autor", width: 170 },
  { key: "saga", label: "Saga", width: 150 },
  { key: "estado", label: "Estado", width: 140 },
  { key: "valoracion", label: "Valoración", width: 100 },
  { key: "favorito", label: "Favorito", width: 80, align: "center" },
  { key: "relectura", label: "Relectura", width: 80, align: "center" },
  { key: "formato", label: "Formato", width: 100 },
  { key: "editorial", label: "Editorial", width: 160 },
  { key: "paginas", label: "Páginas", width: 90 },
  { key: "inicio_lectura", label: "Inicio lectura", width: 130 },
  { key: "fin_lectura", label: "Fin lectura", width: 130 },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function sortValue(book: Book, key: SortKey): string | number {
  switch (key) {
    case "titulo":
      return book.titulo.toLowerCase();
    case "autor":
      return book.autor.toLowerCase();
    case "saga":
      return book.saga?.nombre.toLowerCase() ?? "";
    case "estado":
      return book.estado;
    case "valoracion":
      return book.valoracion ?? -1;
    case "favorito":
      return book.favorito ? 1 : 0;
    case "relectura":
      return book.relectura ? 1 : 0;
    case "formato":
      return book.formato;
    case "editorial":
      return book.editorial?.toLowerCase() ?? "";
    case "paginas":
      return book.paginas_totales ?? -1;
    case "inicio_lectura":
      return book.fechas.inicio_lectura ?? "";
    case "fin_lectura":
      return book.fechas.fin_lectura ?? "";
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
                  className={`table-col-field${sortKey === col.key ? " table-col-field--active" : ""}${col.align === "center" ? " table-col-field--center" : ""}`}
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
                <td className="table-cell table-cell--muted">
                  {book.saga ? `${book.saga.nombre} #${book.saga.numero}` : "—"}
                </td>
                <td className="table-cell">
                  <StatusPill estado={book.estado} audio={book.formato === "audiolibro"} />
                </td>
                <td className="table-cell table-cell--muted">
                  {book.valoracion ? `★ ${book.valoracion}` : "—"}
                </td>
                <td className="table-cell table-cell--center">
                  {book.favorito && <Heart size={14} fill="var(--accent)" color="var(--accent)" />}
                </td>
                <td className="table-cell table-cell--center">
                  {book.relectura && <RotateCcw size={14} color="var(--accent)" />}
                </td>
                <td className="table-cell table-cell--muted">{FORMATO_LABEL[book.formato]}</td>
                <td className="table-cell table-cell--muted">{book.editorial ?? "—"}</td>
                <td className="table-cell table-cell--muted">
                  {book.paginas_totales ?? "—"}
                </td>
                <td className="table-cell table-cell--muted">{formatDate(book.fechas.inicio_lectura)}</td>
                <td className="table-cell table-cell--muted">{formatDate(book.fechas.fin_lectura)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && <div className="table-empty">No se han encontrado libros.</div>}
      </div>
    </div>
  );
}
