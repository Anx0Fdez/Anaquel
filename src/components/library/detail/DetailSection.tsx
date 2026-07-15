import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import "../../ui/fields/Fields.css";

interface DetailSectionProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}

export function DetailSection({ title, icon: Icon, children }: DetailSectionProps) {
  return (
    <section className="detail-section">
      <h2 className="detail-section-title">
        {Icon && <Icon size={16} strokeWidth={2} />}
        {title}
      </h2>
      <div className="detail-section-grid">{children}</div>
    </section>
  );
}
