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

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-slate-900 p-6">
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

          <div className="mt-10 rounded-xl bg-slate-900 p-6">
            <h3 className="text-2xl font-bold">Quick Actions</h3>

            <div className="mt-6 flex gap-4">
              <button className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500">
                New Invoice
              </button>

              <button className="rounded-lg bg-slate-800 px-5 py-3 font-semibold hover:bg-slate-700">
                New Customer
              </button>

              <button className="rounded-lg bg-slate-800 px-5 py-3 font-semibold hover:bg-slate-700">
                New Estimate
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}