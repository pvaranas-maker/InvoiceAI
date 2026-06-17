"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";

type InvoiceItem = {
  description: string;
  quantity: number;
  price: number;
};

type SavedInvoice = {
  id: number;
  invoiceNumber: number;
  customer: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
};

export default function InvoicesPage() {
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, price: 0 },
  ]);
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<SavedInvoice | null>(null);
 
useEffect(() => {
    const savedInvoices = localStorage.getItem("invoices");

    if (savedInvoices) {
        setInvoices(JSON.parse(savedInvoices));
    }
}, []); 
useEffect(() => {
    localStorage.setItem("invoices", JSON.stringify(invoices));
}, [invoices]);
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const tax = subtotal * 0.086;
  const total = subtotal + tax;
  const nextInvoiceNumber = 1001 + invoices.length;

  function addItem() {
    setItems([...items, { description: "", quantity: 1, price: 0 }]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) {
    const updatedItems = [...items];

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    setItems(updatedItems);
  }

  function saveInvoice() {
    const invoiceToSave: SavedInvoice = {
      id: selectedInvoice ? selectedInvoice.id : Date.now(),
      invoiceNumber: selectedInvoice ? selectedInvoice.invoiceNumber : nextInvoiceNumber,
      customer: customerName || "Unnamed Customer",
      items,
      subtotal,
      tax,
      total,
      createdAt: selectedInvoice
        ? selectedInvoice.createdAt
        : new Date().toLocaleDateString(),
    };

    if (selectedInvoice) {
      setInvoices(
        invoices.map((invoice) =>
          invoice.id === selectedInvoice.id ? invoiceToSave : invoice
        )
      );
    } else {
      setInvoices([invoiceToSave, ...invoices]);
    }

    setSelectedInvoice(null);
    setCustomerName("");
    setItems([{ description: "", quantity: 1, price: 0 }]);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex">
        <Sidebar />

        <section className="flex-1 p-10">
          <h2 className="text-5xl font-bold">New Invoice</h2>
          <p className="mt-2 text-slate-400">
            Create an invoice and calculate totals automatically.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
            <div className="rounded-xl bg-slate-900 p-6">
              <h3 className="text-2xl font-bold">Invoice Details</h3>

              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                className="mt-6 w-full rounded-lg bg-slate-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="mt-6 space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3">
                    <input
                      value={item.description}
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                      placeholder="Description"
                      className="col-span-6 rounded-lg bg-slate-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", Number(e.target.value))
                      }
                      className="col-span-2 rounded-lg bg-slate-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(index, "price", Number(e.target.value))
                      }
                      className="col-span-2 rounded-lg bg-slate-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      onClick={() => removeItem(index)}
                      className="col-span-2 rounded-lg bg-red-600 font-semibold hover:bg-red-500"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={addItem}
                  className="rounded-lg bg-green-600 px-6 py-3 font-semibold hover:bg-green-500"
                >
                  + Add Item
                </button>

                <button
                  onClick={saveInvoice}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
                >
                  {selectedInvoice ? "Update Invoice" : "Save Invoice"}
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-white p-8 text-slate-950">
              <h3 className="text-3xl font-bold">Invoice Preview</h3>

              <div className="mt-6 border-t border-slate-300 pt-6">
                <p className="font-semibold">InvoiceAI</p>
                <p className="text-slate-500">Invoice #{nextInvoiceNumber}</p>
              </div>

              <div className="mt-8">
                <p className="font-semibold">Line Items</p>

                {items.map((item, index) => (
                  <div key={index} className="mt-3 flex justify-between gap-4">
                    <span>{item.description || "No description yet"}</span>
                    <span>${(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between border-t border-slate-300 pt-4 text-xl font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-slate-900 p-6">
            <h3 className="text-2xl font-bold">Invoice History</h3>

            {invoices.length === 0 ? (
              <p className="mt-4 text-slate-400">No invoices saved yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {invoices.map((invoice) => (
                 <div
                    key={invoice.id}
                    onClick={() => {
                        setSelectedInvoice(invoice);
                        setCustomerName(invoice.customer);
                        setItems(invoice.items);
                  }}
                className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-800 p-4 hover:bg-slate-700"
>
                    <div>
                      <p className="font-semibold">{invoice.customer}</p>
                      <p className="text-sm text-slate-400">
                        Invoice #{invoice.invoiceNumber} • {invoice.createdAt}
                      </p>
                    </div>

                    <p className="text-xl font-bold">
                      ${invoice.total.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}