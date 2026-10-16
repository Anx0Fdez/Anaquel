import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import type { Book, EstadoLectura, LibraryKind } from "../../types/book";
import type { BookGroup, GroupField } from "../../lib/grouping";
import { groupBooks } from "../../lib/grouping";
import { compareBooksWithinState } from "../../lib/sort";
import { StatusPill } from "./StatusPill";
import { RatingDisplay } from "../ui/RatingDisplay";
import "./TableView.css";

type SortKey =
  | "titulo"
  | "autor"
  | "estado"
  | "valoracion"
  | "relectura"
  | "inicio_lectura"
  | "fin_lectura";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; width: number; align?: "center" }[] = [
  { key: "titulo", label: "Título", width: 260 },
  { key: "autor", label: "Autor", width: 170 },
  { key: "estado", label: "Estado", width: 140 },
  { key: "valoracion", label: "Valoración", width: 100 },
  { key: "relectura", label: "Relectura", width: 80, align: "center" },
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
    case "estado":
      return book.estado;
    case "valoracion":
      return book.valoracion ?? -1;
    case "relectura":
      return book.relectura ? 1 : 0;
    case "inicio_lectura":
      return book.fechas.inicio_lectura ?? "";
    case "fin_lectura":
      return book.fechas.fin_lectura ?? "";
  }
}

interface TableViewProps {
  books: Book[];
  libraryKind: LibraryKind;
  collapsedStatusGroups: EstadoLectura[];
  onCollapsedStatusGroupsChange: (statuses: EstadoLectura[]) => void;
  onSelect?: (book: Book) => void;
  onBackgroundClick?: () => void;
}

export function TableView({
  books,
  libraryKind,
  collapsedStatusGroups,
  onCollapsedStatusGroupsChange,
  onSelect,
  onBackgroundClick,
}: TableViewProps) {
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
      if (effectiveSortKey === "estado" && cmp === 0) {
        return compareBooksWithinState(a, b);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [books, effectiveSortKey, sortDir]);

  const groupField: GroupField | null =
    effectiveSortKey === "autor" || effectiveSortKey === "estado"
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
        <td className="table-cell">
          <StatusPill estado={book.estado} audio={book.formato === "audiolibro"} />
        </td>
        <td className="table-cell table-cell--muted">
          {book.valoracion != null ? <RatingDisplay value={book.valoracion} size={13} /> : "—"}
        </td>
        {!audio && (
          <td className="table-cell table-cell--center">
            {book.relectura && <RotateCcw size={14} color="var(--accent)" />}
          </td>
        )}
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
            groups.map((group, index) => {
              const isStatusGroup = groupField === "estado";
              const status = isStatusGroup ? group.key as EstadoLectura : null;
              const collapsed = status !== null && collapsedStatusGroups.includes(status);
              const contentId = `table-group-content-${index}`;
              return (
                <tbody key={group.key} className="table-group">
                  <tr className="table-group-header-row">
                    <td colSpan={columns.length}>
                      {isStatusGroup ? (
                        <button
                          type="button"
                          className="table-group-header"
                          aria-expanded={!collapsed}
                          aria-controls={contentId}
                          onClick={() => onCollapsedStatusGroupsChange(
                            collapsed
                              ? collapsedStatusGroups.filter((item) => item !== status)
                              : [...collapsedStatusGroups, status!],
                          )}
                        >
                          {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                          <span className="table-group-header-label">{group.label}</span>
                          <span className="table-group-count">{group.books.length}</span>
                          <span className="table-group-header-line" aria-hidden="true" />
                        </button>
                      ) : (
                        <div className="table-group-header">
                          <span className="table-group-header-label">{group.label}</span>
                          <span className="table-group-header-line" aria-hidden="true" />
                        </div>
                      )}
                    </td>
                  </tr>
                  {!collapsed && group.books.map(renderRow)}
                </tbody>
              );
            })
          ) : (
            <tbody>{sorted.map(renderRow)}</tbody>
          )}
        </table>
        {sorted.length === 0 && <div className="table-empty">No se han encontrado libros.</div>}
      </div>
    </div>
  );
}
