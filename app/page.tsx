import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import DashboardPreview from "../components/DashboardPreview";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "64px 24px",
          display: "flex",
          alignItems: "center",
          gap: "64px",
        }}
      >
        <div style={{ flex: 1 }}>
          <Hero />
        </div>

        <div style={{ flex: 1 }}>
          <DashboardPreview />
        </div>
      </section>
    </main>
  );
}