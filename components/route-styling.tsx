"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

export function RouteStyling() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const path = pathname.replace(/\/$/, "") || "/";
    const chapterMatch = path.match(/^\/(?:1-corinthians|2-corinthians)\/(\d+)$/);

    // Cross-page reader navigation must never inherit an outer-page scroll
    // position. Each reader pane maintains its own independent scroll state.
    window.history.scrollRestoration = "manual";
    const resetOuterScroll = () => {
      html.scrollTop = 0;
      body.scrollTop = 0;
      window.scrollTo(0, 0);
    };
    resetOuterScroll();
    const resetFrame = window.requestAnimationFrame(resetOuterScroll);
    const resetTimer = window.setTimeout(resetOuterScroll, 100);

    html.classList.add("dark");
    html.style.colorScheme = "dark";
    body.classList.add("mbe-shell-managed");
    body.removeAttribute("data-corinthians-chapter");

    if (path === "/") body.dataset.corinthiansRoute = "home";
    else if (path === "/background") body.dataset.corinthiansRoute = "introduction";
    else if (chapterMatch) {
      body.dataset.corinthiansRoute = "commentary";
      body.dataset.corinthiansChapter = chapterMatch[1];
    } else body.removeAttribute("data-corinthians-route");

    return () => {
      window.cancelAnimationFrame(resetFrame);
      window.clearTimeout(resetTimer);
    };
  }, [pathname]);

  return null;
}
