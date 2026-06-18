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
    function deleteInvoice(id: number) {
        const updatedInvoices = invoices.filter(
            (invoice) => invoice.id !== id
        );

        setInvoices(updatedInvoices);

        if (selectedInvoice?.id === id) {
            setSelectedInvoice(null);
            setCustomerName("");
            setItems([
                {
                    description: "",
                    quantity: 1,
                    price: 0,
                },
            ]);
        }
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
                            <div className="mb-2 grid grid-cols-12 gap-3 px-1 text-sm font-semibold text-slate-400">
                                <div className="col-span-6">Description</div>
                                <div className="col-span-2 text-center">Qty</div>
                                <div className="col-span-2 text-center">Unit Price</div>
                                <div className="col-span-2"></div>
                            </div>
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

                                        <div className="relative col-span-2">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                $
                                            </span>

                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={item.price === 0 ? "" : item.price}
                                                onChange={(e) =>
                                                    updateItem(index, "price", parseFloat(e.target.value) || 0)
                                                }
                                                className="w-full rounded-lg bg-slate-800 p-3 pl-7 outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

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

                                <div className="mt-4">
                                    <div className="grid grid-cols-12 border-b border-slate-300 pb-2 text-sm font-semibold text-slate-500">
                                        <div className="col-span-6">Description</div>
                                        <div className="col-span-2 text-center">Qty</div>
                                        <div className="col-span-2 text-right">Unit</div>
                                        <div className="col-span-2 text-right">Total</div>
                                    </div>

                                    {items.map((item, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-12 py-3 border-b border-slate-200"
                                        >
                                            <div className="col-span-6">
                                                {item.description || "No description yet"}
                                            </div>

                                            <div className="col-span-2 text-center">
                                                {item.quantity}
                                            </div>

                                            <div className="col-span-2 text-right">
                                                ${item.price.toFixed(2)}
                                            </div>

                                            <div className="col-span-2 text-right font-medium">
                                                ${(item.quantity * item.price).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}

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

                                            <div className="flex items-center gap-4">
                                                <p className="text-xl font-bold">
                                                    ${invoice.total.toFixed(2)}
                                                </p>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteInvoice(invoice.id);
                                                    }}
                                                    className="rounded bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}