export default function Hero() {
  return (
    <section>
      <p className="text-blue-400 font-semibold uppercase tracking-widest">
        AI Office Manager
      </p>

         <h1 className="max-w-3xl text-6xl font-bold text-white">   
              Spend less time on paperwork.
      </h1>

      <p className="mt-6 max-w-2xl text-xl text-slate-300">
        Create invoices, manage customers, accept payments, and let AI handle
        the busywork so you can focus on growing your business.
      </p>

      <div className="mt-12 flex gap-4">
        <button className="rounded-xl bg-blue-600 px-6 py-4 font-semibold hover:bg-blue-500">
          Start Free Trial
        </button>

        <button className="rounded-xl border border-white/20 px-6 py-4 font-semibold hover:bg-white/10">
          Watch Demo
        </button>
      </div>
    </section>
  );
}