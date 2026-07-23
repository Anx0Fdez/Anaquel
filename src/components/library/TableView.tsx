import { useMemo, useState } from "react";
import { Heart, RotateCcw } from "lucide-react";
import type { Book, LibraryKind } from "../../types/book";
import { FORMATO_LABEL } from "../../types/book";
import type { BookGroup, GroupField } from "../../lib/grouping";
import { groupBooks } from "../../lib/grouping";
import { StatusPill } from "./StatusPill";
import { StarRatingDisplay } from "../ui/StarRatingDisplay";
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
  libraryKind: LibraryKind;
  onSelect?: (book: Book) => void;
  onBackgroundClick?: () => void;
}

export function TableView({ books, libraryKind, onSelect, onBackgroundClick }: TableViewProps) {
  const audio = libraryKind === "audiolibros";
  const columns = audio ? COLUMNS.filter((c) => c.key !== "relectura") : COLUMNS;
  const [sortKey, setSortKey] = useState<SortKey>("titulo");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const effectiveSortKey = audio && sortKey === "relectura" ? "titulo" : sortKey;

  const sorted = useMemo(() => {
    const copy = [...books];
    copy.sort((a, b) => {
      const va = sortValue(a, effectiveSortKey);
      const vb = sortValue(b, effectiveSortKey);
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), "es");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [books, effectiveSortKey, sortDir]);

  const groupField: GroupField | null =
    effectiveSortKey === "autor" || effectiveSortKey === "saga" || effectiveSortKey === "estado"
      ? effectiveSortKey
      : null;
  const groups: BookGroup[] | null = useMemo(
    () => (groupField ? groupBooks(sorted, groupField, audio) : null),
    [sorted, groupField, audio],
  );

  function renderRow(book: Book) {
    return (
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
          {book.valoracion != null ? <StarRatingDisplay value={book.valoracion} size={13} /> : "—"}
        </td>
        <td className="table-cell table-cell--center">
          {book.favorito && <Heart size={14} fill="var(--accent)" color="var(--accent)" />}
        </td>
        {!audio && (
          <td className="table-cell table-cell--center">
            {book.relectura && <RotateCcw size={14} color="var(--accent)" />}
          </td>
        )}
        <td className="table-cell table-cell--muted">{FORMATO_LABEL[book.formato]}</td>
        <td className="table-cell table-cell--muted">{book.editorial ?? "—"}</td>
        <td className="table-cell table-cell--muted">{book.paginas_totales ?? "—"}</td>
        <td className="table-cell table-cell--muted">{formatDate(book.fechas.inicio_lectura)}</td>
        <td className="table-cell table-cell--muted">{formatDate(book.fechas.fin_lectura)}</td>
      </tr>
    );
  }

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
            {columns.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`table-col-field${effectiveSortKey === col.key ? " table-col-field--active" : ""}${col.align === "center" ? " table-col-field--center" : ""}`}
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}
                  {effectiveSortKey === col.key && (
                    <span className="table-sort-arrow">{sortDir === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          {groups ? (
            groups.map((group) => (
              <tbody key={group.key} className="table-group">
                <tr className="table-group-header-row">
                  <td colSpan={columns.length}>
                    <div className="table-group-header">
                      <span className="table-group-header-label">{group.label}</span>
                      <span className="table-group-header-line" aria-hidden="true" />
                    </div>
                  </td>
                </tr>
                {group.books.map(renderRow)}
              </tbody>
            ))
          ) : (
            <tbody>{sorted.map(renderRow)}</tbody>
          )}
        </table>
        {sorted.length === 0 && <div className="table-empty">No se han encontrado libros.</div>}
      </div>
    </div>
  );
}
