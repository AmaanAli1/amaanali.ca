import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 18,
        padding: "0 clamp(24px, 8vw, 120px)",
        background: "#101010",
        color: "#F2F2F2",
        fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
      }}
    >
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: "#8A8A8A" }}>
        ~ % cd {"<this page>"}
      </span>
      <h1 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "clamp(48px, 8vw, 96px)", letterSpacing: "-0.05em", lineHeight: 0.95 }}>
        404<span style={{ color: "#E3C08D" }}>.</span> No such file or directory.
      </h1>
      <p style={{ margin: 0, fontSize: 17, color: "#B5B5B5" }}>This page doesn&apos;t exist, or it moved.</p>
      <Link href="/" style={{ marginTop: 8, color: "#101010", background: "#F2F2F2", padding: "10px 18px", borderRadius: 10, textDecoration: "none", fontWeight: 600 }}>
        cd ~ ← back home
      </Link>
    </main>
  );
}
