import { BookMarked, BookOpen, CheckCircle2, Headphones, XCircle } from "lucide-react";
import type { EstadoLectura } from "../../types/book";
import { ESTADO_LABEL } from "../../types/book";
import "./StatusPill.css";

const ICON: Record<EstadoLectura, React.ComponentType<{ size?: number }>> = {
  leyendo: BookOpen,
  leido: CheckCircle2,
  quiero_leer: BookMarked,
  audiolibro: Headphones,
  abandonado: XCircle,
};

export function StatusPill({ estado }: { estado: EstadoLectura }) {
  const Icon = ICON[estado];
  return (
    <span className={`status-pill status-pill--${estado}`}>
      <Icon size={13} />
      {ESTADO_LABEL[estado]}
    </span>
  );
}
