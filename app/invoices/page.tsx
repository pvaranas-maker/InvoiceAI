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

        const savedSettings = localStorage.getItem("companySettings");

        if (savedSettings) {
            setCompanySettings(JSON.parse(savedSettings));
        }
    }, []);
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

    // --- Visual-only helper, no behavior change: maps a status string to the
    // same pill-badge treatment used across the free/estimate generators ---
    function statusBadgeClasses(label: string) {
        switch (label) {
            case "Paid":
                return "bg-emerald-900/40 text-emerald-300 border border-emerald-700/60";
            case "Overdue":
                return "bg-red-900/40 text-red-300 border border-red-700/60";
            case "Sent":
                return "bg-blue-900/40 text-blue-300 border border-blue-700/60";
            default:
                return "bg-purple-900/40 text-purple-300 border border-purple-700/60";
        }
    }

    return (
        <main className="min-h-screen bg-[#0a0c14] text-white font-sans">
            <div className="flex">
                <Sidebar />

                <section className="flex-1 py-12 px-6">
                    <div className="max-w-6xl mx-auto">

                        {/* Header — matches the centered marketing-style header on the free generators */}
                        <div className="text-center mb-12">
                            <span className="bg-purple-900/40 text-purple-400 border border-purple-800/60 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                                Invoicing
                            </span>
                            <h1 className="text-4xl md:text-5xl font-extrabold mt-3 mb-3 tracking-tight">New Invoice</h1>
                            <p className="text-lg text-gray-400 max-w-xl mx-auto">
                                Create an invoice and calculate totals automatically.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-12 gap-10 items-start">

                            {/* Form Side */}
                            <div className="lg:col-span-7 space-y-6">
                                <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                                    <h2 className="text-xl font-semibold mb-6 text-gray-200">Invoice Details</h2>

                                    <div className="space-y-4">
                                        <div className="relative">
                                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Client Details</label>
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
                                                className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                                            />

                                            {showCustomerResults && (
                                                <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl bg-[#1c202f] border border-gray-700/60 shadow-2xl">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowNewCustomerModal(true);
                                                            setShowCustomerResults(false);
                                                        }}
                                                        className="block w-full px-4 py-3 text-left text-sm text-purple-400 hover:bg-[#252b3d] hover:text-purple-300 transition-colors"
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
                                                                className="block w-full px-4 py-3 text-left text-sm hover:bg-[#252b3d] transition-colors"
                                                            >
                                                                {customer.name}
                                                                {customer.company ? ` (${customer.company})` : ""}
                                                            </button>
                                                        ))}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                                                Status
                                            </label>

                                            <div className="grid grid-cols-4 gap-2">
                                                {["Draft", "Sent", "Paid", "Overdue"].map((option) => (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() => setStatus(option)}
                                                        className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${status === option
                                                            ? "bg-purple-600 text-white"
                                                            : "bg-[#1c202f] border border-gray-700/60 text-gray-400 hover:text-white hover:border-purple-500"
                                                            }`}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                                                Due Date
                                            </label>

                                            <input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                onClick={(e) => e.currentTarget.showPicker?.()}
                                                style={{ colorScheme: "dark" }}
                                                className="w-full cursor-pointer bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                                            />
                                        </div>

                                        {/* Line Items */}
                                        <div className="space-y-3 pt-2">
                                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Line Items</label>
                                            {items.map((item, index) => (
                                                <div key={index} className="flex gap-3 items-center bg-[#1c202f]/50 border border-gray-800 p-3 rounded-xl">
                                                    <input
                                                        value={item.description}
                                                        onChange={(e) =>
                                                            updateItem(index, "description", e.target.value)
                                                        }
                                                        placeholder="Description"
                                                        className="flex-1 bg-[#252b3d] border border-gray-700/40 focus:border-purple-500 rounded-lg px-3 py-2 text-sm outline-none"
                                                    />

                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            updateItem(index, "quantity", Number(e.target.value))
                                                        }
                                                        className="w-16 bg-[#252b3d] border border-gray-700/40 focus:border-purple-500 rounded-lg px-2 py-2 text-sm text-center outline-none"
                                                    />

                                                    <div className="relative flex items-center">
                                                        <span className="absolute left-2.5 text-sm text-gray-500 select-none">$</span>
                                                        <input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={item.price === 0 ? "" : item.price}
                                                            onChange={(e) =>
                                                                updateItem(index, "price", parseFloat(e.target.value) || 0)
                                                            }
                                                            className="w-24 bg-[#252b3d] border border-gray-700/40 focus:border-purple-500 rounded-lg pl-6 pr-2 py-2 text-sm outline-none"
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={() => removeItem(index)}
                                                        disabled={items.length === 1}
                                                        className="text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:hover:text-gray-500 p-1 transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={addItem}
                                            className="w-full border border-dashed border-gray-700 hover:border-purple-500 text-gray-400 hover:text-purple-400 transition-colors py-3 rounded-xl text-sm font-medium"
                                        >
                                            + Add Line Item
                                        </button>

                                        {/* Action buttons — same shapes/sizes as the free generators' CTA row, colors preserved as-is from the original (green/blue/slate/purple/pink) since those map to existing functionality */}
                                        <div className="flex flex-wrap gap-3 pt-2">
                                            <button
                                                onClick={saveInvoice}
                                                className="rounded-xl bg-purple-600 hover:bg-purple-700 transition-colors px-6 py-3 font-semibold shadow-lg"
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
                                                    className="rounded-xl bg-[#1c202f] border border-gray-700/60 hover:border-purple-500 transition-colors px-5 py-3 font-semibold text-gray-300 hover:text-white"
                                                >
                                                    New Invoice
                                                </button>
                                            )}

                                            <button
                                                onClick={downloadPDF}
                                                className="rounded-xl bg-[#1c202f] border border-gray-700/60 hover:border-purple-500 transition-colors px-6 py-3 font-semibold text-gray-200 hover:text-white inline-flex items-center gap-2"
                                            >
                                                📥 Download PDF
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setEmailTo(selectedCustomer?.email || "");
                                                    setEmailSubject(
                                                        `Invoice #${selectedInvoice?.invoiceNumber ?? nextInvoiceNumber} `
                                                    );
                                                    setEmailMessage("Hello,\n\nYour invoice is attached.\n\nThank you.");
                                                    setShowEmailModal(true);
                                                }}
                                                className="rounded-xl bg-pink-600 hover:bg-pink-700 transition-colors px-6 py-3 font-semibold"
                                            >
                                                Email Invoice
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Saved Invoices List — restyled to match the dark card system, sits below the form on this side */}
                                <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                                    <h2 className="text-xl font-semibold mb-6 text-gray-200">Saved Invoices</h2>

                                    {invoices.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No invoices saved yet.</p>
                                    ) : (
                                        <div
                                            className="max-h-[65vh] overflow-y-auto pr-2 space-y-3"
                                            style={{ scrollbarColor: "#3d4250 #12151f", scrollbarWidth: "thin" }}
                                        >
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
                                                    className="flex cursor-pointer items-center justify-between rounded-xl bg-[#1c202f]/50 border border-gray-800 hover:border-purple-500/60 p-4 transition-colors"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-sm">
                                                            {invoice.customer?.name || invoice.customerName}
                                                            {invoice.customer?.company
                                                                ? ` (${invoice.customer.company})`
                                                                : ""}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            Invoice #{invoice.invoiceNumber} • {invoice.createdAt}
                                                        </p>

                                                        <div className="mt-2">
                                                            <span
                                                                className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${statusBadgeClasses(getInvoiceStatus(invoice))}`}
                                                            >
                                                                {getInvoiceStatus(invoice)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <p className="text-lg font-bold">
                                                            ${(invoice.total ?? 0).toFixed(2)}
                                                        </p>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteInvoice(invoice.id);
                                                            }}
                                                            className="text-gray-500 hover:text-red-400 p-1 transition-colors text-sm"
                                                            title="Delete invoice"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sticky Preview Side — matches the free/estimate generator white card exactly */}
                            <div className="lg:col-span-5 lg:sticky lg:top-8 bg-white text-slate-900 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                                <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                                    <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Live Document Preview</span>
                                    <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-semibold">
                                        {selectedInvoice ? "Saved" : "Draft"}
                                    </span>
                                </div>

                                <div className="p-6 md:p-8">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <div className="text-xl font-black tracking-tight text-slate-800">
                                                {companySettings.companyName || <span className="text-slate-300 italic">Your Business Name</span>}
                                            </div>
                                            {companySettings.email && (
                                                <div className="text-xs text-slate-400 mt-0.5">{companySettings.email}</div>
                                            )}
                                        </div>
                                        <div className="text-right text-xs text-slate-500">
                                            <div className="font-bold text-slate-800">
                                                #{selectedInvoice ? selectedInvoice.invoiceNumber : nextInvoiceNumber}
                                            </div>
                                            {dueDate && <div className="text-purple-600 font-medium mt-1">Due: {dueDate}</div>}
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Billed To</div>
                                        <div className="text-sm font-semibold text-slate-800">
                                            {selectedCustomer
                                                ? `${selectedCustomer.name}${selectedCustomer.company ? ` (${selectedCustomer.company})` : ""}`
                                                : customerName || <span className="text-slate-300 italic font-normal">No customer selected</span>}
                                        </div>
                                    </div>

                                    <div className="border-b border-slate-100 pb-2 mb-4">
                                        <div className="grid grid-cols-12 text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                                            <div className="col-span-6">Description</div>
                                            <div className="col-span-2 text-center">Qty</div>
                                            <div className="col-span-4 text-right">Total</div>
                                        </div>

                                        {items.map((item, index) => (
                                            <div key={index} className="grid grid-cols-12 text-sm py-2.5 text-slate-700 border-b border-slate-50 last:border-0 items-center">
                                                <div className="col-span-6 truncate pr-2">
                                                    {item.description || <span className="text-slate-300 italic">No description yet</span>}
                                                </div>
                                                <div className="col-span-2 text-center text-slate-500">{item.quantity}</div>
                                                <div className="col-span-4 text-right font-medium">
                                                    ${(item.quantity * item.price).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2 text-sm border-b border-slate-100 pb-4 mb-4">
                                        <div className="flex justify-between text-slate-500">
                                            <span>Subtotal</span>
                                            <span className="font-medium text-slate-700">${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span>Tax ({companySettings.taxRate}%)</span>
                                            <span className="font-medium text-slate-700">${tax.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-slate-800">Total Due</span>
                                        <span className="text-2xl font-black text-slate-900">${total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Status badge footer — visual only, reflects current `status` state */}
                                <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-5 text-center border-t border-purple-900">
                                    <p className="text-xs text-purple-200">Current status</p>
                                    <span className={`inline-block mt-2 text-xs font-bold px-4 py-2 rounded-lg uppercase tracking-wider ${statusBadgeClasses(status)}`}>
                                        {status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {showNewCustomerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-md bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-2xl text-white">
                        <h2 className="text-xl font-semibold mb-6 text-gray-200">New Customer</h2>

                        <div className="space-y-3">
                            <input
                                placeholder="Customer name"
                                value={newCustomerName}
                                onChange={(e) => setNewCustomerName(e.target.value)}
                                className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                            />

                            <input
                                placeholder="Company"
                                value={newCustomerCompany}
                                onChange={(e) => setNewCustomerCompany(e.target.value)}
                                className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                            />

                            <input
                                placeholder="Email"
                                value={newCustomerEmail}
                                onChange={(e) => setNewCustomerEmail(e.target.value)}
                                className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                            />

                            <input
                                placeholder="Phone"
                                value={newCustomerPhone}
                                onChange={(e) => setNewCustomerPhone(e.target.value)}
                                className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                            />
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowNewCustomerModal(false)}
                                className="rounded-xl bg-[#1c202f] border border-gray-700/60 hover:border-purple-500 transition-colors px-4 py-2.5 font-semibold text-gray-300 hover:text-white"
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
                                className="rounded-xl bg-purple-600 hover:bg-purple-700 transition-colors px-4 py-2.5 font-semibold"
                            >
                                Save Customer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEmailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
                    <div className="w-full max-w-lg bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-2xl space-y-4">
                        <h2 className="text-xl font-semibold text-gray-200">Email Invoice</h2>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">To</label>
                            <input
                                value={emailTo}
                                onChange={(e) => setEmailTo(e.target.value)}
                                className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Subject</label>
                            <input
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Message</label>
                            <textarea
                                rows={8}
                                value={emailMessage}
                                onChange={(e) => setEmailMessage(e.target.value)}
                                className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setShowEmailModal(false)}
                                className="rounded-xl bg-[#1c202f] border border-gray-700/60 hover:border-purple-500 transition-colors px-5 py-2.5 font-semibold text-gray-300 hover:text-white"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={emailInvoice}
                                className="rounded-xl bg-pink-600 hover:bg-pink-700 transition-colors px-5 py-2.5 font-semibold"
                            >
                                Send Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}