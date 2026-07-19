import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import "../../ui/fields/Fields.css";

interface DetailSectionProps {
  title: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
}

export function DetailSection({ title, icon: Icon, actions, children }: DetailSectionProps) {
  return (
    <section className="detail-section">
      <div className="detail-section-header">
        <h2 className="detail-section-title">
          {Icon && <Icon size={16} strokeWidth={2} />}
          {title}
        </h2>
        {actions}
      </div>
      <div className="detail-section-grid">{children}</div>
    </section>
  );
}
