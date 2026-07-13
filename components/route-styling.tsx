"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

export function RouteStyling() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const path = pathname.replace(/\/$/, "") || "/";
    const chapterMatch = path.match(/^\/(?:romans|1-corinthians|2-corinthians)\/(\d+)$/);

    html.classList.add("dark");
    html.style.colorScheme = "dark";
    body.classList.add("mbe-shell-managed");
    body.removeAttribute("data-romans-chapter");

    if (path === "/") body.dataset.romansRoute = "home";
    else if (path === "/introduction" || path === "/background") body.dataset.romansRoute = "introduction";
    else if (path === "/search") body.dataset.romansRoute = "search";
    else if (path === "/articles" || path.startsWith("/articles/")) body.dataset.romansRoute = "articles";
    else if (chapterMatch) {
      body.dataset.romansRoute = "commentary";
      body.dataset.romansChapter = chapterMatch[1];
    } else body.removeAttribute("data-romans-route");
  }, [pathname]);

  return null;
}
