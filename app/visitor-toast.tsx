"use client";

import React from "react";

/**
 * A once-per-visit greeting that reacts to the visitor's local time of day.
 * Desktop: slides in from the right at the top. Phones: slides up from the bottom.
 */

type Bucket = {
  to: number;
  key: string;
  emoji: string;
  title: string;
  dark: string;
  light: string;
  meter: [string, number, string];
  lines: [string, string];
};

const BUCKETS: Bucket[] = [
  { to: 5, key: "night_owl", emoji: "🦉", title: "Hey night owl.", dark: "#A9B4FF", light: "#4F5BD5", meter: ["sleep schedule", 18, "deprecated"],
    lines: ["It's {t} and you're reading portfolios? I see you stalking 👀", "{t}? Either you're a recruiter on a deadline or you can't sleep either. Hi."] },
  { to: 8, key: "early_bird", emoji: "🌅", title: "Up before the sun?", dark: "#FFB27A", light: "#C8651B", meter: ["caffeine", 30, "loading…"],
    lines: ["Early bird gets the intern. Coffee first, then commits ☕", "Up at {t}? You're either very disciplined or never went to bed."] },
  { to: 12, key: "morning", emoji: "☀️", title: "Good morning!", dark: "#E3C08D", light: "#A8741F", meter: ["coffee", 85, "kicking in"],
    lines: ["Hope the coffee's strong. Let's get through this before standup.", "Standup in 5? Quick version: I build things and they work."] },
  { to: 14, key: "lunch_break", emoji: "🥪", title: "Lunch-break scroll?", dark: "#9BD67A", light: "#3B8A3E", meter: ["hunger", 96, "critical"],
    lines: ["Eat first, I'll wait. …okay, now scroll.", "Reading portfolios on your lunch? That's dedication. Or procrastination."] },
  { to: 17, key: "afternoon", emoji: "🌤️", title: "Good afternoon.", dark: "#E3C08D", light: "#A8741F", meter: ["3 p.m. slump", 64, "fighting it"],
    lines: ["Fighting the 3 p.m. slump? This is quicker than a nap.", "Afternoon slump detected. Prescribing: one (1) portfolio."] },
  { to: 21, key: "evening", emoji: "🌆", title: "Good evening!", dark: "#FF9A62", light: "#D35A1E", meter: ["work-life balance", 35, "questionable"],
    lines: ["Off the clock and still recruiting? Respect.", "Dinner's getting cold, but sure, one more project."] },
  { to: 24, key: "late_night", emoji: "🌙", title: "Burning the midnight oil?", dark: "#A9B4FF", light: "#4F5BD5", meter: ["midnight oil", 80, "burning"],
    lines: ["Same here. Grab a snack and stay a while.", "{t}. One more project, then bed. (We both know that's a lie.)"] },
];

function timeLabel(d: Date) {
  const H = d.getHours();
  const h12 = ((H + 11) % 12) + 1;
  return `${h12}:${String(d.getMinutes()).padStart(2, "0")} ${H < 12 ? "a.m." : "p.m."}`;
}

function tzQuip(now: Date) {
  try {
    const there = new Date(now.toLocaleString("en-US", { timeZone: "America/Toronto" }));
    const here = new Date(now.toLocaleString("en-US"));
    const diff = Math.round((here.getTime() - there.getTime()) / 36e5);
    if (diff === 0) return "same time zone as me 👀 suspicious.";
    if (diff < 0) return `you're ${-diff}h behind me. I'm probably asleep. Probably.`;
    return `you're ${diff}h ahead. greetings from the past 👋`;
  } catch {
    return "";
  }
}

type Greeting = { b: Bucket; line: string; tz: string; visit: number };

export default function VisitorToast({ theme }: { theme: "dark" | "light" }) {
  const [g, setG] = React.useState<Greeting | null>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    let visit = 1;
    try {
      if (sessionStorage.getItem("greeted")) return;
      sessionStorage.setItem("greeted", "1");
      visit = (parseInt(localStorage.getItem("visits") || "0", 10) || 0) + 1;
      localStorage.setItem("visits", String(visit));
    } catch {}
    const now = new Date();
    const h = now.getHours() + now.getMinutes() / 60;
    const b = BUCKETS.find((x) => h < x.to) ?? BUCKETS[BUCKETS.length - 1];
    const line = b.lines[Math.floor(Math.random() * 2)].replace("{t}", timeLabel(now));
    const timers = [
      setTimeout(() => setG({ b, line, tz: tzQuip(now), visit }), 900),
      setTimeout(() => setShown(true), 1000),
      // tucks itself away: 10s on phones, 15s on bigger screens
      setTimeout(() => setShown(false), window.innerWidth <= 760 ? 11000 : 16000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShown(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!g) return null;
  const acc = theme === "light" ? g.b.light : g.b.dark;
  const style = { "--acc": acc } as React.CSSProperties;

  return (
    <div className={`vtoast${shown ? " in" : ""}`} style={style} role="status" aria-live="polite" aria-hidden={!shown}>
      <div className="vt-drain" />
      <div className="vt-head">
        <span>
          <i className="vt-dot" />
          visitor.log
        </span>
        <button type="button" className="vt-x" aria-label="Dismiss greeting" onClick={() => setShown(false)} tabIndex={shown ? 0 : -1}>
          ×
        </button>
      </div>
      <div className="vt-body">
        <div className="vt-who">
          $ whoami → <b>{g.b.key}</b>
          {g.visit >= 3 && <span className="vt-visit"> · visit #{g.visit} (okay, definitely stalking)</span>}
        </div>
        <div className="vt-title">
          {g.b.title} {g.b.emoji}
        </div>
        <div className="vt-line">{g.line}</div>
        <div className="vt-meter">
          <span>{g.b.meter[0]}</span>
          <span className="vt-track">
            <span className="vt-fill" style={{ width: shown ? `${g.b.meter[1]}%` : "0%" }} />
          </span>
          <b>{g.b.meter[2]}</b>
        </div>
        {g.tz && <div className="vt-tz">{"// " + g.tz}</div>}
      </div>
    </div>
  );
}
