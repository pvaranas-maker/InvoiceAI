"use client";

import { useState } from "react";

export default function CustomersPage() {
  const [showModal, setShowModal] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [business, setBusiness] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [customers, setCustomers] = useState([
    {
      name: "John Smith",
      city: "Phoenix, AZ",
      email: "john@email.com",
      phone: "(480) 555-1234",
      outstanding: "$420",
      invoices: 6,
      estimates: 2,
    },
    {
      name: "Sarah Johnson",
      city: "Scottsdale, AZ",
      email: "sarah@email.com",
      phone: "(602) 555-7788",
      outstanding: "Paid",
      invoices: 3,
      estimates: 1,
    },
  ]);

  function saveCustomer() {
    if (!customerName.trim()) return;

    setCustomers([
      {
        name: customerName,
        city: business || "No location",
        email: email || "No email",
        phone: phone || "No phone",
        outstanding: "Paid",
        invoices: 0,
        estimates: 0,
      },
      ...customers,
    ]);

    setCustomerName("");
    setBusiness("");
    setEmail("");
    setPhone("");
    setShowModal(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex">
        <aside className="w-64 border-r border-slate-800 bg-slate-900 p-6">
          <h1 className="text-3xl font-bold">InvoiceAI</h1>

          <nav className="mt-10 space-y-4 text-slate-300">
            <a href="/dashboard" className="block hover:text-white">Dashboard</a>
            <a href="/customers" className="block font-semibold text-white">Customers</a>
            <a href="/invoices" className="block hover:text-white">Invoices</a>
            <a href="/estimates" className="block hover:text-white">Estimates</a>
            <a href="/settings" className="block hover:text-white">Settings</a>
          </nav>
        </aside>

        <section className="flex-1 p-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-5xl font-bold">Customers</h2>
              <p className="mt-2 text-slate-400">
                Manage all of your customers in one place.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
            >
              + New Customer
            </button>
          </div>

          <input
            type="text"
            placeholder="Search customers..."
            className="mt-8 w-full rounded-xl border border-slate-800 bg-slate-900 p-4 outline-none focus:border-blue-500"
          />

          <div className="mt-8 space-y-5">
            {customers.map((customer, index) => (
              <div
                key={index}
                className="rounded-xl bg-slate-900 p-6 transition hover:bg-slate-800"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold">{customer.name}</h3>
                    <p className="text-slate-400">{customer.city}</p>
                    <p className="mt-2">{customer.email}</p>
                    <p>{customer.phone}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-slate-400">Outstanding</p>
                    <h3
                      className={`text-3xl font-bold ${
                        customer.outstanding === "Paid"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {customer.outstanding}
                    </h3>
                    <p className="mt-4">{customer.invoices} Invoices</p>
                    <p>{customer.estimates} Estimates</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 p-8">
            <h2 className="mb-6 text-3xl font-bold">New Customer</h2>

            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name"
              className="mb-4 w-full rounded-lg bg-slate-800 p-3"
            />

            <input
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              placeholder="City / Business"
              className="mb-4 w-full rounded-lg bg-slate-800 p-3"
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="mb-4 w-full rounded-lg bg-slate-800 p-3"
            />

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="mb-6 w-full rounded-lg bg-slate-800 p-3"
            />

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg bg-slate-700 px-5 py-3"
              >
                Cancel
              </button>

              <button
                onClick={saveCustomer}
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}