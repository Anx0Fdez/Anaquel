import { useState } from "react";
import { Trash2 } from "lucide-react";
import "./ConfirmDeleteButton.css";

interface ConfirmDeleteButtonProps {
  onConfirm: () => void;
  confirmText: string;
  size?: "sm" | "md";
}

export function ConfirmDeleteButton({ onConfirm, confirmText, size = "md" }: ConfirmDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className={`confirm-delete-row confirm-delete-row--${size}`}>
        <span>{confirmText}</span>
        <button className="confirm-delete-yes" onClick={onConfirm}>
          Sí, eliminar
        </button>
        <button className="confirm-delete-no" onClick={() => setConfirming(false)}>
          Cancelar
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      className={`confirm-delete-trigger confirm-delete-trigger--${size}`}
      onClick={() => setConfirming(true)}
      aria-label="Eliminar"
    >
      <Trash2 size={size === "sm" ? 13 : 15} />
    </button>
  );
}
