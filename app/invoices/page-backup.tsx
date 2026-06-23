"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    customerName: string;
    customerId?: number | null;
    customer?: Customer | null;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    status: string;
    dueDate?: string | null;
    createdAt: string;
};

type Customer = {
    id: number;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
};

export default function InvoicesPage() {
    const [customerName, setCustomerName] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [status, setStatus] = useState("Draft");
    const [dueDate, setDueDate] = useState("");

    const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerCompany, setNewCustomerCompany] = useState("");
    const [newCustomerEmail, setNewCustomerEmail] = useState("");
    const [newCustomerPhone, setNewCustomerPhone] = useState("");

    const [items, setItems] = useState<InvoiceItem[]>([
        { description: "", quantity: 1, price: 0 },
    ]);
    const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<SavedInvoice | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);

    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerResults, setShowCustomerResults] = useState(false);

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailTo, setEmailTo] = useState("");
    const [emailSubject, setEmailSubject] = useState("");
    const [emailMessage, setEmailMessage] = useState("");

    const [companySettings, setCompanySettings] = useState({
        companyName: "InvoiceAI",
        address: "",
        phone: "",
        email: "",
        website: "",
        taxRate: 8.6,
    });
    useEffect(() => {
        async function loadInvoices() {
            const response = await fetch("/api/invoices");
            const data = await response.json();
            setInvoices(data);
        }

        async function loadCustomers() {
            const res = await fetch("/api/customers");
            const data = await res.json();
            setCustomers(data);
        }
        loadInvoices();
        loadCustomers();

        async function loadSettings() {
            const res = await fetch("/api/settings");

            if (res.ok) {
                const data = await res.json();
                setCompanySettings({
                    companyName: data.companyName || "InvoiceAI",
                    address: data.address || "",
                    phone: data.phone || "",
                    email: data.email || "",
                    website: data.website || "",
                    taxRate: data.taxRate ?? 8.6,
                });
            }
        }

        loadSettings();
    },

        []);
    useEffect(() => {
        localStorage.setItem("invoices", JSON.stringify(invoices));
    }, [invoices]);
    const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
    );

    const tax = subtotal * (companySettings.taxRate / 100);

    const total = subtotal + tax;
    const nextInvoiceNumber =
        invoices.length > 0
            ? Math.max(...invoices.map((invoice) => invoice.invoiceNumber || 1000)) + 1
            : 1001;

    function getInvoiceStatus(invoice: SavedInvoice) {
        if (invoice.status === "Paid") return "Paid";

        if (
            invoice.dueDate &&
            new Date(invoice.dueDate) < new Date()
        ) {
            return "Overdue";
        }

        return invoice.status;
    }
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
    async function deleteInvoice(id: number) {
        const confirmed = window.confirm(
            "Delete this invoice? This cannot be undone."
        );

        if (!confirmed) return;

        await fetch(`/api/invoices/${id}`, {
            method: "DELETE",
        });

        setInvoices(invoices.filter((invoice) => invoice.id !== id));

        if (selectedInvoice?.id === id) {
            setSelectedInvoice(null);
            setSelectedCustomerId(null);
            setStatus("Draft");
            setCustomerName("");
            setItems([{ description: "", quantity: 1, price: 0 }]);
            setDueDate("");
        }
    }

    async function saveInvoice() {
        if (items.length === 0) {
            alert("Add at least one line item before saving.");
            return;
        }
        if (!selectedCustomerId) {
            alert("Please select a customer before saving.");
            return;
        }

        if (selectedInvoice) {
            const response = await fetch(`/api/invoices/${selectedInvoice.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customerName: customerName || "Unnamed Customer",
                    customerId: selectedCustomerId,
                    subtotal,
                    tax,
                    total,
                    items,
                    status,
                    dueDate,
                }),
            });

            const updatedInvoice = await response.json();

            setInvoices(
                invoices.map((invoice) =>
                    invoice.id === updatedInvoice.id ? updatedInvoice : invoice
                )
            );

            setSelectedInvoice(updatedInvoice);
            return;
        }

        const response = await fetch("/api/invoices", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                invoiceNumber: nextInvoiceNumber,
                customerName: customerName || "Unnamed Customer",
                customerId: selectedCustomerId,
                subtotal,
                tax,
                total,
                status,
                items,
                dueDate,

            }),
        });

        const newInvoice = await response.json();

        setInvoices([newInvoice, ...invoices]);

        setSelectedInvoice(null);
        setStatus("Draft");
        setCustomerName("");
        setItems([{ description: "", quantity: 1, price: 0 }]);
        setDueDate("");
    }


    const selectedCustomer = customers.find(
        (c) => c.id === selectedCustomerId
    );


    function generateInvoicePDF() {

        const doc = new jsPDF();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);

        doc.text(companySettings.companyName, 14, 18);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        doc.text(companySettings.address, 14, 26);
        doc.text(companySettings.phone, 14, 32);
        doc.text(companySettings.email, 14, 38);
        doc.text(companySettings.website, 14, 44);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);

        doc.text("INVOICE", 150, 20);

        doc.setFontSize(11);

        doc.setFont("helvetica", "normal");

        doc.text(
            `Invoice #: ${selectedInvoice?.invoiceNumber ?? nextInvoiceNumber}`,
            140,
            32
        );

        doc.text(
            `Date: ${new Date().toLocaleDateString()}`,
            140,
            40
        );

        doc.text(
            `Due: ${dueDate || "N/A"}`,
            140,
            48
        );

        doc.setFont("helvetica", "bold");
        doc.text("Bill To", 14, 60);

        doc.setFont("helvetica", "normal");

        doc.text(
            selectedCustomer
                ? `${selectedCustomer.name}${selectedCustomer.company
                    ? ` (${selectedCustomer.company})`
                    : ""
                }`
                : "No Customer",
            14,
            68
        );
        autoTable(doc, {
            startY: 84,
            head: [["Description", "Qty", "Unit Price", "Total"]],
            body: items.map((item) => [
                item.description,
                item.quantity.toString(),
                `$${item.price.toFixed(2)}`,
                `$${(item.quantity * item.price).toFixed(2)}`
            ]),
        });

        const finalY =
            (doc as any).lastAutoTable?.finalY || 100;

        doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY + 10);
        doc.text(`Tax: $${tax.toFixed(2)}`, 140, finalY + 18);

        doc.setFontSize(16);
        doc.text(`Total: $${total.toFixed(2)}`, 140, finalY + 32);

        return doc.output("datauristring").split(",")[1];

    }

    function downloadPDF() {
        const doc = new jsPDF();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);

        doc.text(companySettings.companyName, 14, 18);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        doc.text(companySettings.address, 14, 26);
        doc.text(companySettings.phone, 14, 32);
        doc.text(companySettings.email, 14, 38);
        doc.text(companySettings.website, 14, 44);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);

        doc.text("INVOICE", 150, 20);

        doc.setFontSize(11);

        doc.setFont("helvetica", "normal");

        doc.text(
            `Invoice #: ${selectedInvoice?.invoiceNumber ?? nextInvoiceNumber}`,
            140,
            32
        );

        doc.text(
            `Date: ${new Date().toLocaleDateString()}`,
            140,
            40
        );

        doc.text(
            `Due: ${dueDate || "N/A"}`,
            140,
            48
        );

        doc.setFont("helvetica", "bold");
        doc.text("Bill To", 14, 60);

        doc.setFont("helvetica", "normal");

        doc.text(
            selectedCustomer
                ? `${selectedCustomer.name}${selectedCustomer.company
                    ? ` (${selectedCustomer.company})`
                    : ""
                }`
                : "No Customer",
            14,
            68
        );
        autoTable(doc, {
            startY: 84,
            head: [["Description", "Qty", "Unit Price", "Total"]],
            body: items.map((item) => [
                item.description,
                item.quantity.toString(),
                `$${item.price.toFixed(2)}`,
                `$${(item.quantity * item.price).toFixed(2)}`
            ]),
        });

        const finalY =
            (doc as any).lastAutoTable?.finalY || 100;

        doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY + 10);
        doc.text(`Tax: $${tax.toFixed(2)}`, 140, finalY + 18);

        doc.setFontSize(16);
        doc.text(`Total: $${total.toFixed(2)}`, 140, finalY + 32);

        doc.save(`Invoice-${nextInvoiceNumber}.pdf`);
    }

    async function emailInvoice() {
        if (!emailTo) {
            alert("Please enter an email address.");
            return;
        }


        const response = await fetch("/api/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                to: emailTo,
                subject: emailSubject,
                html: emailMessage.replace(/\n/g, "<br />"),


                pdfBase64: generateInvoicePDF(),
                filename: `Invoice - ${selectedInvoice?.invoiceNumber ?? nextInvoiceNumber}.pdf`,
            }),
        });

        if (!response.ok) {
            alert("Email failed to send.");
            return;
        }

        alert("Invoice email sent!");
        setStatus("Sent");

        if (selectedInvoice) {
            const updatedInvoice = {
                ...selectedInvoice,
                status: "Sent",
            };

            await fetch(`/api/invoices/${selectedInvoice.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedInvoice),
            });

            setSelectedInvoice(updatedInvoice);
            setInvoices(
                invoices.map((invoice) =>
                    invoice.id === updatedInvoice.id ? updatedInvoice : invoice
                )
            );
        }

        setShowEmailModal(false);
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

                            <div className="relative">
                                <input
                                    value={customerSearch || customerName}
                                    onChange={(e) => {
                                        setCustomerSearch(e.target.value);
                                        setShowCustomerResults(true);
                                        setSelectedCustomerId(null);
                                        setCustomerName(e.target.value);
                                    }}
                                    onFocus={() => setShowCustomerResults(true)}
                                    onBlur={() => {
                                        setTimeout(() => {
                                            setShowCustomerResults(false);
                                        }, 150);
                                    }}
                                    placeholder="Search customer..."
                                    className="mt-6 w-full rounded-lg bg-slate-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                {showCustomerResults && (
                                    <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-lg bg-slate-800 shadow-xl">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowNewCustomerModal(true);
                                                setShowCustomerResults(false);
                                            }}
                                            className="block w-full px-4 py-3 text-left hover:bg-slate-700"
                                        >
                                            + New Customer
                                        </button>

                                        {customers
                                            .filter((customer) =>
                                                `${customer.name} ${customer.company ?? ""}`
                                                    .toLowerCase()
                                                    .includes(customerSearch.toLowerCase())
                                            )
                                            .map((customer) => (
                                                <button
                                                    key={customer.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCustomerId(customer.id);
                                                        setCustomerName(customer.name);
                                                        setCustomerSearch(`${customer.name}${customer.company ? ` (${customer.company})` : ""}`);
                                                        setDueDate("");
                                                        setShowCustomerResults(false);
                                                    }}
                                                    className="block w-full px-4 py-3 text-left hover:bg-slate-700"
                                                >
                                                    {customer.name}
                                                    {customer.company ? ` (${customer.company})` : ""}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4">
                                <label className="mb-2 block text-sm text-slate-300">
                                    Status
                                </label>

                                <div className="grid grid-cols-4 gap-2">
                                    {["Draft", "Sent", "Paid", "Overdue"].map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => setStatus(option)}
                                            className={`rounded-lg px-3 py-2 text-sm font-semibold ${status === option
                                                ? "bg-blue-600 text-white"
                                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                                } `}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="mb-2 block text-sm text-slate-300">
                                    Due Date
                                </label>

                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    onClick={(e) => e.currentTarget.showPicker?.()}
                                    className="w-full cursor-pointer rounded-lg bg-slate-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
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
                                    className="rounded-lg bg-green-600 px-4 py-2 font-semibold hover:bg-green-500"
                                >
                                    + Add Item
                                </button>

                                <button
                                    onClick={saveInvoice}
                                    className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
                                >
                                    {selectedInvoice ? "Update Invoice" : "Save Invoice"}
                                </button>

                                {selectedInvoice && (
                                    <button
                                        onClick={() => {
                                            setSelectedInvoice(null);
                                            setSelectedCustomerId(null);
                                            setCustomerName("");
                                            setItems([
                                                {
                                                    description: "",
                                                    quantity: 1,
                                                    price: 0,
                                                },
                                            ]);
                                            setStatus("Draft");
                                            setDueDate("");
                                        }}
                                        className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600"
                                    >
                                        New Invoice
                                    </button>
                                )}

                                <button
                                    onClick={downloadPDF}
                                    className="rounded-lg bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-500"
                                >
                                    Download PDF
                                </button>

                                <button
                                    onClick={() => {
                                        setEmailTo(selectedCustomer?.email || "");
                                        setEmailSubject(
                                            `Invoice #${selectedInvoice?.invoiceNumber ?? nextInvoiceNumber} `
                                        );
                                        setEmailMessage("Hello,\n\nYour invoice is attached.\n\nThank you.");
                                        setShowEmailModal(true);
                                    }} className="rounded-lg bg-pink-600 px-6 py-3 font-semibold hover:bg-pink-500"
                                >
                                    Email Invoice
                                </button>

                            </div>

                            <div className="rounded-xl bg-white p-8 text-slate-950">
                                <h3 className="text-3xl font-bold">Invoice Preview</h3>

                                <div className="mt-6 border-t border-slate-300 pt-6">
                                    <p className="font-semibold">
                                        {selectedCustomer
                                            ? `${selectedCustomer.name}${selectedCustomer.company ? ` (${selectedCustomer.company})` : ""} `
                                            : customerName || "No customer selected"}
                                    </p>
                                    <p className="text-slate-500">
                                        Invoice #
                                        {selectedInvoice
                                            ? selectedInvoice.invoiceNumber
                                            : nextInvoiceNumber}
                                    </p>
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
                        </div>

                        {invoices.length === 0 ? (
                            <p className="mt-4 text-slate-400">No invoices saved yet.</p>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {invoices.map((invoice) => (
                                    <div
                                        key={invoice.id}
                                        onClick={async () => {
                                            const res = await fetch(`/api/invoices/${invoice.id}`);
                                            const fullInvoice = await res.json();

                                            setSelectedInvoice(fullInvoice);
                                            setStatus(getInvoiceStatus(fullInvoice));
                                            setDueDate(
                                                fullInvoice.dueDate
                                                    ? fullInvoice.dueDate.substring(0, 10)
                                                    : ""
                                            );

                                            setCustomerName(fullInvoice.customerName || "");


                                            const customer = customers.find(
                                                (c) => c.id === fullInvoice.customerId
                                            );

                                            if (customer) {
                                                setSelectedCustomerId(customer.id);
                                            } else {
                                                setSelectedCustomerId(null);
                                            }
                                            setCustomerSearch(
                                                customer
                                                    ? customer.company
                                                        ? `${customer.name} (${customer.company})`
                                                        : customer.name
                                                    : fullInvoice.customerName || ""
                                            );

                                            setItems(fullInvoice.items || []);
                                        }}
                                        className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-800 p-4 hover:bg-slate-700"
                                    >
                                        <div>
                                            <p className="font-semibold">
                                                {invoice.customer?.name || invoice.customerName}
                                                {invoice.customer?.company
                                                    ? ` (${invoice.customer.company})`
                                                    : ""}
                                            </p>
                                            <p className="text-sm text-slate-400">
                                                Invoice #{invoice.invoiceNumber} • {invoice.createdAt}
                                            </p>

                                            <div className="mt-2">
                                                <span
                                                    className="rounded-full bg-yellow-500 px-2 py-1 text-xs font-semibold text-black"
                                                >
                                                    {getInvoiceStatus(invoice)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <p className="text-xl font-bold">
                                                    ${(invoice.total ?? 0).toFixed(2)}                                                </p>

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
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
            {showNewCustomerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="w-full max-w-md rounded-xl bg-slate-900 p-6 text-white">
                        <h2 className="text-2xl font-bold">New Customer</h2>

                        <input
                            placeholder="Customer name"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            className="mt-4 w-full rounded-lg bg-slate-800 p-3 outline-none"
                        />

                        <input
                            placeholder="Company"
                            value={newCustomerCompany}
                            onChange={(e) => setNewCustomerCompany(e.target.value)}
                            className="mt-3 w-full rounded-lg bg-slate-800 p-3 outline-none"
                        />

                        <input
                            placeholder="Email"
                            value={newCustomerEmail}
                            onChange={(e) => setNewCustomerEmail(e.target.value)}
                            className="mt-3 w-full rounded-lg bg-slate-800 p-3 outline-none"
                        />

                        <input
                            placeholder="Phone"
                            value={newCustomerPhone}
                            onChange={(e) => setNewCustomerPhone(e.target.value)}
                            className="mt-3 w-full rounded-lg bg-slate-800 p-3 outline-none"
                        />

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowNewCustomerModal(false)}
                                className="rounded-lg bg-slate-700 px-4 py-2 font-semibold"
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                onClick={async () => {
                                    const res = await fetch("/api/customers", {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            name: newCustomerName,
                                            company: newCustomerCompany,
                                            email: newCustomerEmail,
                                            phone: newCustomerPhone,
                                        }),
                                    });

                                    const createdCustomer = await res.json();
                                    setCustomers([createdCustomer, ...customers]);

                                    setSelectedCustomerId(createdCustomer.id);
                                    setCustomerName(createdCustomer.name);

                                    setSelectedInvoice(null);
                                    setStatus("Draft");

                                    setItems([
                                        {
                                            description: "",
                                            quantity: 1,
                                            price: 0,
                                        },
                                    ]);

                                    setNewCustomerName("");
                                    setNewCustomerCompany("");
                                    setNewCustomerEmail("");
                                    setNewCustomerPhone("");
                                    setDueDate("");
                                    setCustomerSearch(
                                        createdCustomer.company
                                            ? `${createdCustomer.name} (${createdCustomer.company})`
                                            : createdCustomer.name
                                    );

                                    setShowNewCustomerModal(false);
                                    setShowCustomerResults(false);


                                }}
                                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold"
                            >
                                Save Customer
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-slate-900 rounded-xl p-6 w-full max-w-lg space-y-4">

                        <h2 className="text-2xl font-bold">
                            Email Invoice
                        </h2>

                        <div>
                            <label className="text-sm text-slate-400">
                                To
                            </label>

                            <input
                                value={emailTo}
                                onChange={(e) => setEmailTo(e.target.value)}
                                className="mt-1 w-full rounded-lg bg-slate-800 p-3"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-400">
                                Subject
                            </label>

                            <input
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                className="mt-1 w-full rounded-lg bg-slate-800 p-3"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-400">
                                Message
                            </label>

                            <textarea
                                rows={8}
                                value={emailMessage}
                                onChange={(e) => setEmailMessage(e.target.value)}
                                className="mt-1 w-full rounded-lg bg-slate-800 p-3"
                            />
                        </div>

                        <div className="flex justify-end gap-3">

                            <button
                                onClick={() => setShowEmailModal(false)}
                                className="rounded-lg bg-slate-700 px-5 py-2"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={emailInvoice}
                                className="rounded-lg bg-pink-600 px-5 py-2"
                            >
                                Send Invoice
                            </button>

                        </div>

                    </div>
                </div>
            )}
        </main >
    );
}