import { CheckCircle2 } from "lucide-react";
import "./Toast.css";

interface ToastProps {
  message: string;
  closing?: boolean;
}

export function Toast({ message, closing }: ToastProps) {
  return (
    <div className={`toast${closing ? " toast--closing" : ""}`} role="status">
      <CheckCircle2 size={16} strokeWidth={2} />
      <span>{message}</span>
    </div>
  );
}
