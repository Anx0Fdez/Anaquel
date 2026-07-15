import type { Progreso } from "../types/book";

/**
 * Calcula el porcentaje de progreso a partir de la página actual y el total.
 * Devuelve null cuando no hay datos suficientes para calcularlo (evita la
 * división entre cero), y siempre limita el resultado entre 0 y 100.
 */
export function computePorcentaje(
  paginaActual: number | null,
  paginasTotales: number | null,
): number | null {
  if (paginaActual == null || paginasTotales == null || paginasTotales <= 0) return null;
  const pct = (paginaActual / paginasTotales) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

/**
 * Aplica un cambio a pagina_actual y/o paginas_totales, manteniendo el
 * conjunto consistente: pagina_actual no puede ser negativa ni superar
 * paginas_totales, y porcentaje se recalcula siempre a partir de ambas.
 */
export function withProgreso(
  progreso: Progreso,
  updates: Partial<Pick<Progreso, "pagina_actual" | "paginas_totales">>,
): Progreso {
  const paginas_totales =
    updates.paginas_totales !== undefined ? updates.paginas_totales : progreso.paginas_totales;
  let pagina_actual =
    updates.pagina_actual !== undefined ? updates.pagina_actual : progreso.pagina_actual;

  if (pagina_actual != null && pagina_actual < 0) pagina_actual = 0;
  if (pagina_actual != null && paginas_totales != null && pagina_actual > paginas_totales) {
    pagina_actual = paginas_totales;
  }

  return {
    ...progreso,
    pagina_actual,
    paginas_totales,
    porcentaje: computePorcentaje(pagina_actual, paginas_totales),
  };
}
