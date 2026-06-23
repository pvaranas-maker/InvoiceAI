"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";

interface Customer {
    id: number;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    outstanding: number;
    invoices: number;
    estimates: number;
}

function formatPhone(phone: string | null) {
    if (!phone) return "";

    const digits = phone.replace(/\D/g, "");

    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    return phone;
}

export default function CustomersPage() {
    const [showModal, setShowModal] = useState(false);

    const [customerName, setCustomerName] = useState("");
    const [business, setBusiness] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");

    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [editName, setEditName] = useState("");
    const [editBusiness, setEditBusiness] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPhone, setEditPhone] = useState("");

    useEffect(() => {
        async function fetchCustomers() {
            const response = await fetch("/api/customers");
            const customers = await response.json();
            setCustomers(customers);
        }

        fetchCustomers();
    }, []);

    function closeModal() {
        setShowModal(false);
        setEditingCustomer(null);
    }

    function openNewCustomerModal() {
        setEditingCustomer(null);
        setCustomerName("");
        setBusiness("");
        setEmail("");
        setPhone("");
        setShowModal(true);
    }

    function openEditCustomerModal(customer: Customer) {
        setEditingCustomer(customer);
        setEditName(customer.name);
        setEditBusiness(customer.company ?? "");
        setEditEmail(customer.email ?? "");
        setEditPhone(customer.phone ?? "");
        setShowModal(true);
    }

    async function saveCustomer() {
        if (!customerName.trim()) return;

        const response = await fetch("/api/customers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: customerName,
                company: business,
                email,
                phone,
                address: null,
                notes: null,
            }),
        });

        const newCustomer = await response.json();

        setCustomers([newCustomer, ...customers]);

        setCustomerName("");
        setBusiness("");
        setEmail("");
        setPhone("");
        setShowModal(false);
    }

    async function updateCustomer() {
        if (!editingCustomer) return;

        const response = await fetch("/api/customers", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: editingCustomer.id,
                name: editName,
                company: editBusiness,
                email: editEmail,
                phone: editPhone,
            }),
        });

        const updatedCustomer = await response.json();

        setCustomers(
            customers.map((customer) =>
                customer.id === updatedCustomer.id ? updatedCustomer : customer
            )
        );

        setEditingCustomer(null);
        setShowModal(false);
    }

    async function deleteCustomer(customer: Customer) {
        const confirmed = window.confirm(
            `Delete ${customer.name}? This cannot be undone.`
        );

        if (!confirmed) return;

        const response = await fetch("/api/customers", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: customer.id,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Unable to delete customer");
            return;
        }

        setCustomers(customers.filter((c) => c.id !== customer.id));
    }

    const filteredCustomers = customers.filter((customer) =>
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        (customer.company ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (customer.email ?? "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <main className="h-screen w-screen bg-[#0a0c14] text-white font-sans overflow-hidden">
            <div className="flex h-full w-full">
                <Sidebar />

                {/* Main section wrapper limits outer scroll entirely */}
                <section className="flex-1 flex flex-col px-6 py-8 h-full max-w-6xl mx-auto overflow-hidden">
                    
                    {/* Fixed Static Header Area */}
                    <div className="flex-shrink-0 mb-6">
                        <div className="inline-block bg-purple-900/40 text-purple-400 border border-purple-800/60 text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                            Customers
                        </div>
                        <h1 className="text-3xl font-extrabold mt-1 tracking-tight">Customers</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            Manage all of your active accounts and document tracking in real-time.
                        </p>
                    </div>

                    {/* Permanently Anchor Search Control Box */}
                    <div className="flex-shrink-0 flex items-center gap-3 mb-6">
                        <input
                            type="text"
                            placeholder="Search customers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                        />

                        <button
                            onClick={openNewCustomerModal}
                            className="rounded-xl bg-purple-600 hover:bg-purple-700 transition-colors px-5 py-3 text-sm font-semibold shadow-lg whitespace-nowrap"
                        >
                            + New Customer
                        </button>
                    </div>

                    {/* Independent Scroll Container Section */}
                    <div className="flex-1 overflow-hidden relative">
                        {filteredCustomers.length === 0 ? (
                            <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-8 text-center">
                                <p className="text-gray-500 text-sm">
                                    {customers.length === 0
                                        ? "No customers yet — add your first one to get started."
                                        : "No customers match your search query."}
                                </p>
                            </div>
                        ) : (
                            <div
                                className="h-full w-full overflow-y-auto pr-1 space-y-3 pb-6"
                                style={{ scrollbarColor: "#3d4250 #12151f", scrollbarWidth: "thin" }}
                            >
                                {filteredCustomers.map((customer) => (
                                    <div
                                        key={customer.id}
                                        className="bg-[#12151f] border border-gray-800/60 rounded-xl p-4 md:p-5 shadow-md transition-all hover:border-gray-700/80"
                                    >
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <h3 className="text-lg font-bold text-white">{customer.name}</h3>
                                                    {customer.company && (
                                                        <span className="text-xs text-purple-400 font-medium">
                                                            • {customer.company}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
                                                    {customer.email && <span>{customer.email}</span>}
                                                    {customer.phone && <span className="text-gray-500">{formatPhone(customer.phone)}</span>}
                                                </div>

                                                <div className="mt-3 flex gap-2">
                                                    <button
                                                        onClick={() => openEditCustomerModal(customer)}
                                                        className="rounded-lg bg-[#1c202f] border border-gray-700/60 hover:border-purple-500 transition-colors px-3 py-1.5 text-[11px] font-semibold text-gray-300 hover:text-white"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() => deleteCustomer(customer)}
                                                        className="rounded-lg bg-[#1c202f] border border-gray-700/60 hover:border-red-500 transition-colors px-3 py-1.5 text-[11px] font-semibold text-gray-400 hover:text-red-400"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="text-left sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-gray-800/60">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Outstanding Balance</p>
                                                <p className="text-2xl font-black text-emerald-400 tracking-tight mt-0.5">
                                                    ${(customer.outstanding ?? 0).toFixed(2)}
                                                </p>

                                                <div className="mt-2 flex sm:justify-end gap-3 text-xs text-gray-400 font-medium">
                                                    <span>{customer.invoices} Invoices</span>
                                                    <span className="text-gray-600">|</span>
                                                    <span>{customer.estimates} Estimates</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Modal Layer */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
                    <div className="w-full max-w-lg bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-2xl">
                        <h2 className="text-lg font-bold mb-5 text-gray-200">
                            {editingCustomer ? "Edit Customer" : "New Customer"}
                        </h2>

                        <div className="space-y-3">
                            <input
                                value={editingCustomer ? editName : customerName}
                                onChange={(e) =>
                                    editingCustomer ? setEditName(e.target.value) : setCustomerName(e.target.value)
                                }
                                placeholder="Customer Name"
                                className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                            />

                            <input
                                value={editingCustomer ? editBusiness : business}
                                onChange={(e) =>
                                    editingCustomer ? setEditBusiness(e.target.value) : setBusiness(e.target.value)
                                }
                                placeholder="Business Name"
                                className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                            />

                            <input
                                value={editingCustomer ? editEmail : email}
                                onChange={(e) =>
                                    editingCustomer ? setEditEmail(e.target.value) : setEmail(e.target.value)
                                }
                                placeholder="Email"
                                className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                            />

                            <input
                                value={editingCustomer ? editPhone : phone}
                                onChange={(e) =>
                                    editingCustomer ? setEditPhone(e.target.value) : setPhone(e.target.value)
                                }
                                placeholder="Phone"
                                className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="rounded-xl bg-[#1c202f] border border-gray-700/60 hover:border-purple-500 transition-colors px-4 py-2.5 text-xs font-semibold text-gray-300 hover:text-white"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={editingCustomer ? updateCustomer : saveCustomer}
                                className="rounded-xl bg-purple-600 hover:bg-purple-700 transition-colors px-4 py-2.5 text-xs font-semibold"
                            >
                                {editingCustomer ? "Update Customer" : "Save Customer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}