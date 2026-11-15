import { Icon } from "./Icon";
import type { NavItem, PageKey } from "../features/dashboard/navigation";

interface MobileNavProps {
  items: readonly NavItem[];
  page: PageKey;
  onNavigate: (page: PageKey) => void;
}

export function MobileNav({ items, page, onNavigate }: MobileNavProps) {
  return (
    <nav className="mobile-nav">
      {items.map(({ key, label, icon }) => (
        <button
          key={key}
          className={page === key ? "active" : ""}
          aria-current={page === key ? "page" : undefined}
          onClick={() => onNavigate(key)}
        >
          <Icon name={icon} />
          <small>{label.split(" ")[0]}</small>
        </button>
      ))}
    </nav>
  );
}
