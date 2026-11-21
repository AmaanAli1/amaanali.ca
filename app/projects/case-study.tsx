"use client";

import React from "react";
import GymFlowDark from "@/components/GymFlowCaseStudy";
import GymFlowLight from "@/components/GymFlowCaseStudyLight";
import RepTheoryDark from "@/components/RepTheoryCaseStudy";
import RepTheoryLight from "@/components/RepTheoryCaseStudyLight";

/** The theme the visitor last used on the home page (saved by home-app.tsx). */
function useLightTheme() {
  return React.useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem("theme") === "light";
      } catch {
        return false;
      }
    },
    () => false,
  );
}

function CaseStudy({ Dark, Light }: { Dark: React.ComponentType; Light: React.ComponentType }) {
  const light = useLightTheme();
  React.useEffect(() => {
    window.dispatchEvent(new Event("cs-render"));
  }, [light]);
  return <div className={light ? "cs-wrap cs-ready" : "cs-wrap"}>{light ? <Light /> : <Dark />}</div>;
}

export function GymFlowPage() {
  return <CaseStudy Dark={GymFlowDark} Light={GymFlowLight} />;
}

export function RepTheoryPage() {
  return <CaseStudy Dark={RepTheoryDark} Light={RepTheoryLight} />;
}
