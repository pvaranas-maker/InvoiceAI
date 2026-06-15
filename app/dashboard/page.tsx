export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex">
        <aside className="min-h-screen w-64 border-r border-white/10 bg-slate-900 p-6">
          <h1 className="text-2xl font-bold">InvoiceAI</h1>

          <nav className="mt-10 space-y-4 text-slate-300">
            <p>Dashboard</p>
            <p>Customers</p>
            <p>Invoices</p>
            <p>Estimates</p>
            <p>Settings</p>
          </nav>
        </aside>

        <section className="flex-1 p-8">
          <h2 className="text-4xl font-bold">Dashboard</h2>
          <p className="mt-2 text-slate-400">Welcome back, Patrick.</p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="rounded-xl bg-red-600 p-6">
              <p className="text-slate-400">Revenue</p>
              <h3 className="mt-2 text-3xl font-bold">$18,420</h3>
            </div>

            <div className="rounded-xl bg-slate-900 p-6">
              <p className="text-slate-400">Invoices</p>
              <h3 className="mt-2 text-3xl font-bold">124</h3>
            </div>

            <div className="rounded-xl bg-slate-900 p-6">
              <p className="text-slate-400">Customers</p>
              <h3 className="mt-2 text-3xl font-bold">58</h3>
            </div>

            <div className="rounded-xl bg-slate-900 p-6">
              <p className="text-slate-400">Pending</p>
              <h3 className="mt-2 text-3xl font-bold">7</h3>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}