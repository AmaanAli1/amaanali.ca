"use client";

import React from "react";
import { flushSync } from "react-dom";
import { Logic as DarkPage } from "@/components/HomeDark";
import { Logic as LightPage } from "@/components/HomeLight";

type Theme = "dark" | "light";
const PATH: Record<Theme, string> = { dark: "/", light: "/light" };
const BG: Record<Theme, string> = { dark: "#101010", light: "#F5F5F7" };

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> };
};

/**
 * The home page in both themes. Switching Dark ⇄ Light swaps the page in place
 * (no reload), keeps the visitor's exact scroll position, and cross-fades
 * between the two themes.
 */
export default function HomeApp({ initial }: { initial: Theme }) {
  // false during the static build, true in the browser (the page shows live clocks)
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [theme, setTheme] = React.useState<Theme>(initial);
  const busy = React.useRef(false);

  React.useEffect(() => {
    document.body.classList.toggle("light", theme === "light");
    try {
      localStorage.setItem("theme", theme); // case studies open in the same theme
    } catch {}
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BG[theme]);
  }, [theme]);

  // Back/forward between / and /light swaps the theme instead of staying stale
  React.useEffect(() => {
    const onPop = () => {
      const t: Theme = window.location.pathname.startsWith("/light") ? "light" : "dark";
      setTheme((cur) => (cur === t ? cur : t));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // The page scrolls inside #home, so the browser can't restore the position by itself.
  // Coming back from a case study puts you exactly where you left (saved in transitions.tsx);
  // plain /#section links jump to that section.
  React.useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      const c = document.getElementById("home");
      if (!c) return;
      let saved: { path: string; scroll: number; card: string; at: number } | null = null;
      try {
        saved = JSON.parse(sessionStorage.getItem("home-return") || "null");
      } catch {}
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const here = window.location.pathname.replace(/\/$/, "") || "/";
      const was = saved ? saved.path.replace(/\/$/, "") || "/" : "";
      const returning =
        saved && was === here && Date.now() - saved.at < 30 * 60 * 1000 &&
        (window.location.hash === "#projects" || nav?.type === "back_forward");
      const prev = c.style.scrollSnapType;
      c.style.scrollSnapType = "none";
      if (returning && saved) {
        c.classList.add("returned");
        c.scrollTop = saved.scroll;
        const card = document.querySelector<HTMLElement>('a.pcard[href="' + saved.card + '"]');
        if (card) {
          card.classList.add("just-returned");
          setTimeout(() => card.classList.remove("just-returned"), 1600);
        }
        sessionStorage.removeItem("home-return");
      } else {
        const id = decodeURIComponent(window.location.hash.slice(1));
        const el = id ? document.getElementById(id) : null;
        if (el) {
          c.classList.add("returned");
          c.scrollTop = el.offsetTop;
        }
      }
      requestAnimationFrame(() => {
        c.style.scrollSnapType = prev;
        c.dispatchEvent(new Event("scroll"));
      });
      if (window.location.hash) history.replaceState(null, "", window.location.pathname);
    }, 40);
    return () => clearTimeout(t);
  }, [mounted]);

  // Dark ⇄ Light: swap in place with a cross-fade
  React.useEffect(() => {
    if (!mounted) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('[aria-label="Appearance"] a') as HTMLAnchorElement | null;
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const next: Theme = (a.getAttribute("href") || "/").startsWith("/light") ? "light" : "dark";
      if (next === theme || busy.current) return;
      busy.current = true;

      const scroller = document.getElementById("home");
      const scroll = scroller?.scrollTop ?? 0;

      const swap = () => {
        flushSync(() => setTheme(next));
        const c = document.getElementById("home");
        if (c) {
          const snap = c.style.scrollSnapType;
          c.style.scrollSnapType = "none";
          c.scrollTop = scroll;
          requestAnimationFrame(() => {
            c.style.scrollSnapType = snap;
            c.dispatchEvent(new Event("scroll"));
          });
        }
        history.replaceState(null, "", PATH[next]);
      };

      const doc = document as ViewTransitionDoc;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!doc.startViewTransition || reduce) {
        swap();
        busy.current = false;
        return;
      }
      const root = document.documentElement;
      root.classList.add("theme-vt");
      const vt = doc.startViewTransition(swap);
      vt.finished.finally(() => {
        root.classList.remove("theme-vt");
        busy.current = false;
      });
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [mounted, theme]);

  if (!mounted) return <div style={{ height: "100vh", background: BG[initial] }} />;
  return (
    <>
      <div className="dc-enter">{theme === "dark" ? <DarkPage /> : <LightPage />}</div>
      <MobileMenuButton />
    </>
  );
}

/**
 * Phones only (hidden by CSS on wider screens): the sidebar collapses into a top bar,
 * and this button opens it as a full-screen menu. Picking anything in the menu closes it.
 */
function MobileMenuButton() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.classList.toggle("navopen", open);
    return () => document.body.classList.remove("navopen");
  }, [open]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.("aside a")) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const mq = window.matchMedia("(min-width: 761px)");
    const onWide = () => mq.matches && setOpen(false);
    document.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onWide);
    };
  }, []);

  return (
    <button
      type="button"
      className="m-menu"
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      onClick={() => setOpen((o) => !o)}
    >
      <span />
      <span />
    </button>
  );
}
