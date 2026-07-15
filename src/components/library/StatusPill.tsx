import { BookMarked, BookOpen, CheckCircle2, Headphones, PauseCircle, XCircle } from "lucide-react";
import type { EstadoLectura } from "../../types/book";
import { estadoLabel } from "../../types/book";
import "./StatusPill.css";

const ICON: Record<EstadoLectura, React.ComponentType<{ size?: number }>> = {
  leyendo: BookOpen,
  pospuesto: PauseCircle,
  leido: CheckCircle2,
  quiero_leer: BookMarked,
  audiolibro: Headphones,
  abandonado: XCircle,
};

interface StatusPillProps {
  estado: EstadoLectura;
  audio?: boolean;
  size?: "sm" | "md";
}

export function StatusPill({ estado, audio = false, size = "md" }: StatusPillProps) {
  const Icon = audio && estado === "leyendo" ? Headphones : ICON[estado];
  return (
    <span className={`status-pill status-pill--${estado} status-pill--${size}`}>
      <Icon size={size === "sm" ? 11 : 13} />
      {estadoLabel(estado, audio)}
    </span>
  );
}
