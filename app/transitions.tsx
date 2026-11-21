"use client";

import { useEffect } from "react";

/**
 * Gives the clicked project card's screenshot a shared view-transition name right
 * before the browser leaves the page, so it morphs into the case study's stage.
 * Pairs with the `@view-transition` rules in globals.css.
 */
export default function Transitions() {
  useEffect(() => {
    let clicked: HTMLElement | null = null;

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a.pcard") as HTMLAnchorElement | null;
      clicked = a?.getAttribute("href")?.startsWith("/projects/") ? a : null;
      // remember exactly where the visitor was, so "back to projects" returns them there
      const home = document.getElementById("home");
      if (clicked && home) {
        try {
          sessionStorage.setItem(
            "home-return",
            JSON.stringify({ path: window.location.pathname, scroll: home.scrollTop, card: clicked.getAttribute("href"), at: Date.now() }),
          );
        } catch {}
      }
    };

    // On a case study, point the "back to projects" links at the theme the visitor came from
    try {
      const saved = JSON.parse(sessionStorage.getItem("home-return") || "null");
      if (saved?.path && window.location.pathname.startsWith("/projects/")) {
        document.querySelectorAll<HTMLAnchorElement>('a[href="/#projects"]').forEach((a) => {
          a.setAttribute("href", saved.path.replace(/\/?$/, "/") + "#projects");
        });
      }
    } catch {}

    const onPageSwap = (e: Event) => {
      const vt = (e as Event & { viewTransition?: unknown }).viewTransition;
      const frame = clicked?.querySelector("img")?.parentElement?.parentElement as HTMLElement | null;
      if (vt && frame) frame.style.viewTransitionName = "project-hero";
    };

    const onPageReveal = (e: Event) => {
      const vt = (e as Event & { viewTransition?: unknown }).viewTransition;
      const stage = document.querySelector<HTMLElement>(".stage");
      if (vt && stage) stage.style.viewTransitionName = "project-hero";
    };

    // reset after a back/forward cache restore so names never collide
    const onPageShow = () => {
      document.querySelectorAll<HTMLElement>("a.pcard *").forEach((el) => (el.style.viewTransitionName = ""));
      clicked = null;
    };

    // If an old copy of a page asks for build files from a previous deploy, reload once
    // to get the current version instead of showing an error.
    const onError = (e: ErrorEvent | PromiseRejectionEvent) => {
      const err = "reason" in e ? e.reason : e.error;
      const msg = String(err?.name || "") + " " + String(err?.message || ("message" in e ? e.message : ""));
      if (!/ChunkLoadError|Failed to load chunk|Loading chunk/i.test(msg)) return;
      try {
        if (sessionStorage.getItem("chunk-reload") === window.location.pathname) return;
        sessionStorage.setItem("chunk-reload", window.location.pathname);
      } catch {}
      window.location.reload();
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onError);
    const clearGuard = setTimeout(() => {
      try { sessionStorage.removeItem("chunk-reload"); } catch {}
    }, 5000);

    // Older deploys told browsers to keep case-study pages for a week. Refresh those
    // cached copies once per visit so a returning visitor never opens an outdated one.
    try {
      if (!sessionStorage.getItem("pages-refreshed")) {
        sessionStorage.setItem("pages-refreshed", "1");
        for (const p of ["/projects/gymflow/", "/projects/rep-theory/"]) {
          if (p !== window.location.pathname) fetch(p, { cache: "reload" }).catch(() => {});
        }
      }
    } catch {}

    document.addEventListener("click", onClick, true);
    window.addEventListener("pageswap", onPageSwap);
    window.addEventListener("pagereveal", onPageReveal);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onError);
      clearTimeout(clearGuard);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pageswap", onPageSwap);
      window.removeEventListener("pagereveal", onPageReveal);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
