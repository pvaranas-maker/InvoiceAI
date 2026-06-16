import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen border-r border-slate-800 bg-slate-900 p-6">
      <h1 className="text-3xl font-bold text-white">InvoiceAI</h1>

      <nav className="mt-10 space-y-4">
        <Link
          href="/dashboard"
          className="block rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Dashboard
        </Link>

        <Link
          href="/customers"
          className="block rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Customers
        </Link>

        <Link
          href="/invoices"
          className="block rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Invoices
        </Link>

        <Link
          href="/estimates"
          className="block rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Estimates
        </Link>

        <Link
          href="/settings"
          className="block rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Settings
        </Link>
      </nav>
    </aside>
  );
}