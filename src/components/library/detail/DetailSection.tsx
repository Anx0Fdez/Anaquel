import type { ReactNode } from "react";
import "../../ui/fields/Fields.css";

interface DetailSectionProps {
  title: string;
  children: ReactNode;
}

export function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <section className="detail-section">
      <h2 className="detail-section-title">{title}</h2>
      <div className="detail-section-grid">{children}</div>
    </section>
  );
}
