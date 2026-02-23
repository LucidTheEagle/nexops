export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div style={{ textAlign: "center" }}>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "48px",
          fontWeight: 800,
          color: "var(--color-violet)",
          letterSpacing: "-0.03em"
        }}>
          NexOps
        </h1>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--color-text-muted)",
          marginTop: "8px",
          letterSpacing: "0.1em",
          textTransform: "uppercase"
        }}>
          CP-01.1 — Design tokens live
        </p>
      </div>
    </main>
  );
}