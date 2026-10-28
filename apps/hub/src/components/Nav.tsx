import React from "react";

export interface NavSection {
  id: string;
  icon: string;
  title: string;
  group: string;
}

interface NavProps {
  sections: NavSection[];
  current: string;
  onSelect: (id: string) => void;
  collapsed?: boolean;
}

export default function Nav({ sections, current, onSelect, collapsed = false }: NavProps) {
  let lastGroup = "";

  const items: React.ReactNode[] = [];

  sections.forEach((s) => {
    if (s.group !== lastGroup) {
      items.push(
        <div className="nav-group-label" key={`group-${s.group}`}>
          {s.group}
        </div>
      );
      lastGroup = s.group;
    }

    const isActive = s.id === current;

    items.push(
      <div
        key={s.id}
        className={`nav-item${isActive ? " active" : ""}`}
        onClick={() => onSelect(s.id)}
        title={collapsed ? s.title : undefined}
      >
        <div className="ico">{s.icon}</div>
        <span>{s.title}</span>
      </div>
    );
  });

  return (
    <nav id="site-nav" className={`nav${collapsed ? " collapsed" : ""}`} aria-label="Sections">
      {items}
    </nav>
  );
}
