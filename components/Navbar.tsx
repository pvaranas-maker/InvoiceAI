export default function Navbar() {
  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
      <h1 className="text-2xl font-bold text-white">
        InvoiceAI
      </h1>

      <div className="hidden gap-8 md:flex">
        <a href="#" className="hover:text-blue-400">
          Features
        </a>

        <a href="#" className="hover:text-blue-400">
          Pricing
        </a>

        <a href="#" className="hover:text-blue-400">
          Contact
        </a>
      </div>

      <button className="rounded-lg bg-blue-600 px-5 py-2 font-semibold hover:bg-blue-500">
        Login
      </button>
    </nav>
  );
}