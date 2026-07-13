"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Home", active: (pathname: string) => pathname === "/" },
  { href: "/background", label: "Background", active: (pathname: string) => pathname === "/background" },
  { href: "/1-corinthians/1", label: "1 Corinthians", active: (pathname: string) => pathname.startsWith("/1-corinthians") },
  { href: "/2-corinthians/1", label: "2 Corinthians", active: (pathname: string) => pathname.startsWith("/2-corinthians") }
];

export function SiteHeader() {
  const pathname = usePathname();
  const activePathname = pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
  const [open, setOpen] = useState(false);

  return (
    <header className="reader-header no-print">
      <Link href="/" className="reader-brand" aria-label="Corinthians Study Home">
        <span className="reader-logo" aria-hidden="true">
          <BookOpenText className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <span className="reader-brand-text">
          <span className="reader-brand-strong">Corinthians Study</span>
        </span>
      </Link>

      <nav className="reader-nav" aria-label="Primary navigation">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={link.active(activePathname) ? "reader-nav-link reader-nav-link-active" : "reader-nav-link"}
            aria-current={link.active(activePathname) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="reader-header-actions">
        <Button
          className="reader-menu-button"
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {open ? (
        <nav className="reader-menu">
          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
            {links.map((link) => {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={link.active(activePathname) ? "reader-menu-link reader-menu-link-active" : "reader-menu-link"}
                  aria-current={link.active(activePathname) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
