import React, { useState } from "react";
import Nav, { NavSection } from "./components/Nav";
import TheStack from "./sections/TheStack";
import Overview from "./sections/Overview";
import Capabilities from "./sections/Capabilities";
import Compute from "./sections/Compute";
import Runtimes from "./sections/Runtimes";
import BuiltinAI from "./sections/BuiltinAI";
import Transport from "./sections/Transport";
import Storage from "./sections/Storage";
import Concurrency from "./sections/Concurrency";
import Multimodal from "./sections/Multimodal";
import Rag from "./sections/Rag";
import Patterns from "./sections/Patterns";
import Plan from "./sections/Plan";
import Resources from "./sections/Resources";
import Connect from "./sections/Connect";

interface SectionMeta extends NavSection {
  Component: React.ComponentType;
}

const SECTIONS: SectionMeta[] = [
  { id: "the-stack",    icon: "🧱",  group: "Start here", title: "The Stack",          Component: TheStack },
  { id: "overview",     icon: "🗺️",  group: "Start here", title: "Overview",           Component: Overview },
  { id: "capabilities", icon: "🔬",  group: "Start here", title: "Live Capabilities",  Component: Capabilities },
  { id: "compute",      icon: "🧮",  group: "The Stack",  title: "Compute",            Component: Compute },
  { id: "runtimes",     icon: "📦",  group: "The Stack",  title: "Models & Runtimes",  Component: Runtimes },
  { id: "builtin",      icon: "✨",  group: "The Stack",  title: "Built-in AI",        Component: BuiltinAI },
  { id: "transport",    icon: "🔌",  group: "The Stack",  title: "Transport",          Component: Transport },
  { id: "storage",      icon: "💾",  group: "The Stack",  title: "Storage",            Component: Storage },
  { id: "concurrency",  icon: "🧵",  group: "The Stack",  title: "Concurrency",        Component: Concurrency },
  { id: "multimodal",   icon: "🎬",  group: "The Stack",  title: "Multimodal I/O",     Component: Multimodal },
  { id: "rag",          icon: "🔎",  group: "The Stack",  title: "In-browser RAG",     Component: Rag },
  { id: "patterns",     icon: "🏛️",  group: "Wrap up",    title: "Patterns & Architecture", Component: Patterns },
  { id: "plan",         icon: "📅",  group: "Wrap up",    title: "10-Day Plan",        Component: Plan },
  { id: "resources",    icon: "📚",  group: "Wrap up",    title: "Resources",          Component: Resources },
  { id: "connect",      icon: "🔗",  group: "Wrap up",    title: "Connect",            Component: Connect },
];

const navSections: NavSection[] = SECTIONS.map(({ id, icon, title, group }) => ({ id, icon, title, group }));

export default function App() {
  const [current, setCurrent] = useState("overview");

  const active = SECTIONS.find((s) => s.id === current) ?? SECTIONS[0];
  const { Component } = active;

  return (
    <>
      <div className="topbar">
        <div className="brand">
          <div className="logo">⚡</div>
          <div>
            The New Web AI Stack
            <br />
            <small>React Delhi · Learning Hub</small>
          </div>
        </div>
        <div className="topbar-right">
          <div className="progress-mini">{SECTIONS.length} sections</div>
          <div className="live-pill">
            <span className="live-dot"></span> Live in your browser
          </div>
        </div>
      </div>

      <div className="layout">
        <Nav sections={navSections} current={current} onSelect={setCurrent} />
        <main className="content">
          <div className="page active">
            <Component />
          </div>
        </main>
      </div>
    </>
  );
}
