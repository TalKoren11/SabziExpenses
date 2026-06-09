"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Add", icon: "➕" },
  { href: "/overview", label: "Overview", icon: "📊" },
  { href: "/import", label: "Import", icon: "📸" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname.startsWith("/auth")) return null;

  return (
    <nav
      className="sticky bottom-0 z-10 mt-auto grid grid-cols-4 border-t border-border bg-card/90 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-xs transition ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className={active ? "font-semibold" : ""}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
