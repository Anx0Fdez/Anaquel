import { useMemo } from "react";
import { BookOpen, Headphones } from "lucide-react";
import type { Book, EstadoLectura, LibraryKind } from "../../types/book";
import { ESTADOS_LECTURA, estadoLabel } from "../../types/book";
import "./LibraryStatsView.css";

interface LibraryStatsViewProps {
  books: Book[];
  libraryKind: LibraryKind;
}

const STATUS_TONES: Record<EstadoLectura, string> = {
  leyendo: "var(--status-leyendo)",
  pendiente: "var(--status-pendiente)",
  mas_adelante: "var(--status-mas-adelante)",
  leido: "var(--status-leido)",
  abandonado: "var(--status-abandonado)",
};

function completionYear(book: Book): number | null {
  if (book.estado !== "leido" || !book.fechas.fin_lectura) return null;
  const match = /^(\d{4})-\d{2}-\d{2}/.exec(book.fechas.fin_lectura);
  if (!match) return null;
  const year = Number(match[1]);
  return year >= 1000 && year <= 9999 ? year : null;
}

export function LibraryStatsView({ books, libraryKind }: LibraryStatsViewProps) {
  const { statuses, yearly, ratings, totalRead, datedCompletions, yearRange, ratedCount, maxStatus, maxYear, maxRating } = useMemo(() => {
    const statusCounts: Record<EstadoLectura, number> = {
      pendiente: 0,
      mas_adelante: 0,
      leyendo: 0,
      leido: 0,
      abandonado: 0,
    };
    const completedByYear = new Map<number, number>();
    const ratingCounts = Array.from({ length: 10 }, () => 0);
    let totalReadCount = 0;
    let ratingTotal = 0;

    for (const book of books) {
      statusCounts[book.estado] += 1;
      if (book.estado === "leido") totalReadCount += 1;
      const year = completionYear(book);
      if (year !== null) completedByYear.set(year, (completedByYear.get(year) ?? 0) + 1);
      if (Number.isInteger(book.valoracion) && book.valoracion! >= 1 && book.valoracion! <= 10) {
        ratingCounts[book.valoracion! - 1] += 1;
        ratingTotal += 1;
      }
    }

    const lastYear = completedByYear.size
      ? Math.max(...completedByYear.keys())
      : new Date().getFullYear();
    const firstYear = lastYear - 5;
    const yearSeries = Array.from({ length: 6 }, (_, index) => {
      const year = firstYear + index;
      return { year, count: completedByYear.get(year) ?? 0 };
    });
    const statusSeries = ESTADOS_LECTURA.map((estado) => ({ estado, count: statusCounts[estado] }));
    const ratingSeries = ratingCounts.map((count, index) => ({ rating: index + 1, count }));

    return {
      statuses: statusSeries,
      yearly: yearSeries,
      ratings: ratingSeries,
      totalRead: totalReadCount,
      datedCompletions: [...completedByYear.values()].reduce((sum, count) => sum + count, 0),
      yearRange: `${firstYear}–${lastYear}`,
      ratedCount: ratingTotal,
      maxStatus: Math.max(1, ...statusSeries.map((item) => item.count)),
      maxYear: Math.max(1, ...yearSeries.map((item) => item.count)),
      maxRating: Math.max(1, ...ratingSeries.map((item) => item.count)),
    };
  }, [books]);

  const isAudio = libraryKind === "audiolibros";
  const KindIcon = isAudio ? Headphones : BookOpen;

  return (
    <section className="library-stats" aria-label={`Estadísticas de ${isAudio ? "audiolibros" : "libros"}`}>
      <header className="library-stats-heading">
        <div className="library-stats-heading-icon"><KindIcon size={19} strokeWidth={1.8} /></div>
        <div>
          <h1>Tu biblioteca, en perspectiva</h1>
          <p>Un resumen de tus {isAudio ? "audiolibros" : "libros"}, siempre al día.</p>
        </div>
        <span className="library-stats-total">{books.length} {books.length === 1 ? "título" : "títulos"}</span>
      </header>

      {books.length === 0 ? (
        <div className="library-stats-empty">Añade algún {isAudio ? "audiolibro" : "libro"} para empezar a ver tus estadísticas.</div>
      ) : (
        <div className="library-stats-grid">
          <article className="library-stats-card library-stats-card--wide">
            <div className="library-stats-card-heading">
              <div>
                <h2>Terminados por año</h2>
                <p>
                  {datedCompletions === 0
                    ? "Aún no hay fechas de finalización registradas"
                    : datedCompletions < totalRead
                      ? `${datedCompletions} con fecha · ${totalRead - datedCompletions} sin fecha · ${yearRange}`
                      : `${isAudio ? "Fecha de escucha" : "Fecha de finalización"} · ${yearRange}`}
                </p>
              </div>
              <span className="library-stats-highlight">{totalRead} {isAudio ? "escuchados" : "leídos"}</span>
            </div>
            {datedCompletions === 0 ? (
              <div className="library-stats-no-dates">
                Añade la fecha en que terminaste {isAudio ? "de escuchar" : "de leer"} tus títulos y aparecerá aquí tu ritmo de {isAudio ? "escucha" : "lectura"}.
              </div>
            ) : (
              <div className="library-stats-year-chart" role="img" aria-label={`Títulos terminados por año: ${yearly.map(({ year, count }) => `${year}: ${count}`).join(", ")}`}>
                {yearly.map(({ year, count }) => (
                  <div className="library-stats-year-column" key={year}>
                    <span className="library-stats-bar-value">{count || ""}</span>
                    <div className="library-stats-year-track">
                      <div className="library-stats-year-bar" style={{ height: `${(count / maxYear) * 100}%` }} />
                    </div>
                    <span className="library-stats-year-label">{year}</span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="library-stats-card">
            <div className="library-stats-card-heading">
              <div><h2>Estados</h2><p>Cómo se reparte tu colección</p></div>
            </div>
            <div className="library-stats-status-list">
              {statuses.map(({ estado, count }) => (
                <div className="library-stats-status-row" key={estado}>
                  <span className="library-stats-status-label">{estadoLabel(estado, isAudio)}</span>
                  <div className="library-stats-status-track" aria-hidden="true">
                    <span style={{ width: `${(count / maxStatus) * 100}%`, background: STATUS_TONES[estado] }} />
                  </div>
                  <span className="library-stats-status-count">{count}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="library-stats-card">
            <div className="library-stats-card-heading">
              <div><h2>Valoraciones</h2><p>Distribución de las puntuaciones</p></div>
            </div>
            {ratedCount === 0 ? (
              <div className="library-stats-no-ratings">Aún no hay valoraciones.</div>
            ) : (
              <div className="library-stats-rating-chart" role="img" aria-label={`Distribución de valoraciones de 1 a 10 sobre ${ratedCount} títulos`}>
                {ratings.map(({ rating, count }) => (
                  <div className="library-stats-rating-column" key={rating}>
                    <span className="library-stats-rating-value">{count || ""}</span>
                    <div className="library-stats-rating-track">
                      <span style={{ height: `${(count / maxRating) * 100}%` }} />
                    </div>
                    <span className="library-stats-rating-label">{rating}</span>
                  </div>
                ))}
              </div>
            )}
          </article>

        </div>
      )}
    </section>
  );
}
