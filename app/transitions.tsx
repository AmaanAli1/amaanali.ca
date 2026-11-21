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
    };

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

    document.addEventListener("click", onClick, true);
    window.addEventListener("pageswap", onPageSwap);
    window.addEventListener("pagereveal", onPageReveal);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pageswap", onPageSwap);
      window.removeEventListener("pagereveal", onPageReveal);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
