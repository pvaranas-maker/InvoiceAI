export default function DashboardPreview() {
  return (
 <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Revenue</p>
          <h2 className="text-2xl font-bold">$18,420</h2>
        </div>

        <div className="rounded-xl bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Invoices</p>
          <h2 className="text-2xl font-bold">124</h2>
        </div>

        <div className="rounded-xl bg-slate-800 p-4">
          <p className="text-sm text-slate-400">Customers</p>
          <h2 className="text-2xl font-bold">58</h2>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-slate-800 p-5">
        <p className="text-sm text-slate-400">AI Assistant</p>

        <div className="mt-3 rounded-lg bg-slate-950 p-4">
          Installed water heater for John Smith.
          Labor $350. Parts $420.
        </div>

        <button className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-500">
          Generate Invoice
        </button>
      </div>
    </div>
  );
}