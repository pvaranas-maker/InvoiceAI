export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center max-w-3xl px-8">
        <h1 className="text-6xl font-bold mb-6">
          InvoiceAI
        </h1>

        <p className="text-2xl text-gray-300 mb-10">
          The AI Office Manager for Small Businesses
        </p>

        <div className="space-y-3 text-lg text-gray-400">
          <p>✅ Create invoices instantly</p>
          <p>✅ Track customers</p>
          <p>✅ Accept online payments</p>
          <p>✅ Let AI do the paperwork</p>
        </div>

        <button className="mt-10 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold hover:bg-blue-500 transition">
          Coming Soon
        </button>
      </div>
    </main>
  );
}