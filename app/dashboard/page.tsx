"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

type Invoice = {
  id: number;
  invoiceNumber: number;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  dueDate?: string | null;
  customerId?: number | null;
  customer?: {
    id?: number;
    name: string;
    company: string | null;
  } | null;
};

type Estimate = {
  id: number;
  estimateNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  validUntil?: string | null;
  customerId?: number | null;
  customer?: {
    id?: number;
    name: string;
    company: string | null;
  } | null;
};

type Customer = {
  id: number;
  name: string;
  company?: string | null;
};

type ActivityItem = {
  id: string;
  type: "invoice" | "estimate" | "customer";
  label: string;
  detail: string;
  date: string;
};

const STATUS_COLORS: Record<string, string> = {
  Paid: "#34d399",
  Sent: "#60a5fa",
  Overdue: "#f87171",
  Draft: "#a78bfa",
  Accepted: "#22c55e",
  Declined: "#fb7185",
  Converted: "#fbbf24",
};

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function daysUntil(date?: string | null) {
  if (!date) return null;
  const today = new Date();
  const target = new Date(date);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function statusBadgeClasses(label: string) {
  switch (label) {
    case "Paid":
    case "Accepted":
      return "bg-emerald-900/40 text-emerald-300 border border-emerald-700/60";
    case "Overdue":
    case "Declined":
      return "bg-red-900/40 text-red-300 border border-red-700/60";
    case "Sent":
      return "bg-blue-900/40 text-blue-300 border border-blue-700/60";
    case "Converted":
      return "bg-amber-900/40 text-amber-300 border border-amber-700/60";
    default:
      return "bg-purple-900/40 text-purple-300 border border-purple-700/60";
  }
}

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [range, setRange] = useState<"7" | "30" | "90" | "365">("30");

  useEffect(() => {
    async function loadDashboard() {
      const [invoicesRes, estimatesRes, customersRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/estimates"),
        fetch("/api/customers"),
      ]);

      if (invoicesRes.ok) setInvoices(await invoicesRes.json());
      if (estimatesRes.ok) setEstimates(await estimatesRes.json());
      if (customersRes.ok) setCustomers(await customersRes.json());
    }

    loadDashboard();
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const invoicesThisMonth = invoices.filter((invoice) => {
    const date = new Date(invoice.createdAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const paidInvoices = invoices.filter((invoice) => invoice.status === "Paid");
  const paidTotal = paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const revenueThisMonth = invoicesThisMonth.reduce((sum, invoice) => sum + invoice.total, 0);

  const paidThisMonth = invoicesThisMonth
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const outstandingTotal = invoices
    .filter((invoice) => invoice.status !== "Paid")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const overdueTotal = invoices
    .filter((invoice) => invoice.status === "Overdue")
    .reduce((sum, invoice) => sum + invoice.total, 0);



  const overdueInvoices = invoices.filter(
    (invoice) => invoice.status === "Overdue"
  );

  const paidRate =
    invoices.length > 0
      ? (paidInvoices.length / invoices.length) * 100
      : 100;

  const overduePenalty =
    invoices.length > 0
      ? (overdueInvoices.length / invoices.length) * 40
      : 0;

  const healthScore = Math.max(
    0,
    Math.min(100, Math.round(paidRate - overduePenalty))
  );

  const healthColor =
    healthScore >= 80
      ? "text-green-400"
      : healthScore >= 60
        ? "text-yellow-400"
        : "text-red-400";

  const healthLabel =
    healthScore >= 90
      ? "Excellent"
      : healthScore >= 75
        ? "Healthy"
        : healthScore >= 60
          ? "Needs Attention"
          : "Critical";

  const invoiceCount = invoices.length;
  const customerCount = customers.length;

  const revenueChartData = useMemo(() => {
    const days = Number(range);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const buckets: Record<string, number> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      buckets[date.toISOString().slice(0, 10)] = 0;
    }

    invoices.forEach((invoice) => {
      const date = new Date(invoice.createdAt);
      if (date >= startDate) {
        const key = date.toISOString().slice(0, 10);
        buckets[key] = (buckets[key] || 0) + invoice.total;
      }
    });

    return Object.entries(buckets).map(([date, total]) => ({
      date: date.slice(5),
      total: Math.round(total * 100) / 100,
    }));
  }, [invoices, range]);

  const invoiceStatusChartData = useMemo(() => {
    const statusCounts = invoices.reduce<Record<string, number>>((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: STATUS_COLORS[status] || "#a78bfa",
    }));
  }, [invoices]);

  const estimatePipelineData = useMemo(() => {
    const statusCounts = estimates.reduce<Record<string, number>>((acc, estimate) => {
      acc[estimate.status] = (acc[estimate.status] || 0) + 1;
      return acc;
    }, {});

    return ["Draft", "Sent", "Accepted", "Declined", "Converted"].map((status) => ({
      status,
      count: statusCounts[status] || 0,
    }));
  }, [estimates]);

  const lateInvoices = invoices
    .filter((invoice) => {
      if (invoice.status === "Paid") return false;
      if (!invoice.dueDate) return false;

      return new Date(invoice.dueDate) < new Date();
    })
    .sort(
      (a, b) =>
        new Date(a.dueDate || "").getTime() -
        new Date(b.dueDate || "").getTime()
    );

  const upcomingDueDates = invoices
    .filter((invoice) => invoice.status !== "Paid" && invoice.dueDate)
    .map((invoice) => ({ ...invoice, daysLeft: daysUntil(invoice.dueDate) }))
    .filter((invoice) => invoice.daysLeft !== null)
    .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999))
    .slice(0, 5);

  const topCustomers = useMemo(() => {
    const totals: Record<string, number> = {};
    invoices.forEach((invoice) => {
      const name = invoice.customer?.company || invoice.customer?.name || invoice.customerName || "Unknown";
      totals[name] = (totals[name] || 0) + invoice.total;
    });
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, total]) => ({ name, total }));
  }, [invoices]);

  const recentActivity: ActivityItem[] = useMemo(() => {
    const invoiceActivity = invoices.slice(0, 8).map((invoice) => ({
      id: `invoice-${invoice.id}`,
      type: "invoice" as const,
      label: `Invoice #${invoice.invoiceNumber}`,
      detail: `${invoice.status} • ${formatCurrency(invoice.total)}`,
      date: invoice.createdAt,
    }));

    const estimateActivity = estimates.slice(0, 8).map((estimate) => ({
      id: `estimate-${estimate.id}`,
      type: "estimate" as const,
      label: `Estimate ${estimate.estimateNumber}`,
      detail: `${estimate.status} • ${formatCurrency(estimate.total)}`,
      date: estimate.createdAt,
    }));

    return [...invoiceActivity, ...estimateActivity]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [invoices, estimates]);

  async function sendReminder(invoice: Invoice) {
    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "pvaranas@gmail.com",
          subject: `Payment Reminder - Invoice #${invoice.invoiceNumber}`,
          filename: `Invoice-${invoice.invoiceNumber}.pdf`,
          pdfBase64: "",
          html: `
          <h2>Payment Reminder</h2>

          <p>Hello ${invoice.customer?.name || invoice.customerName},</p>

          <p>This is a friendly reminder that the following invoice is overdue.</p>

          <ul>
            <li><strong>Invoice:</strong> #${invoice.invoiceNumber}</li>
            <li><strong>Amount Due:</strong> ${formatCurrency(invoice.total)}</li>
            <li><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"}</li>
          </ul>

          <p>Please submit payment at your earliest convenience.</p>

          <p>Thank you,<br/>InvoiceAI</p>
        `,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to send reminder.");
      }

      alert("Reminder sent successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to send reminder.");
    }
  }



  return (
    <main className="min-h-screen bg-[#0a0c14] text-white font-sans">
      <div className="flex">
        <Sidebar />

        <section className="flex-1 py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <span className="bg-purple-900/40 text-purple-400 border border-purple-800/60 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                Overview
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold mt-3 mb-3 tracking-tight">Dashboard</h1>
              <p className="text-lg text-gray-400 max-w-xl mx-auto">
                Welcome back, Patrick. Here's what is happening with your business today.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-5 shadow-xl">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Revenue This Month</p>
                <h3 className="mt-2 text-2xl font-black text-white">{formatCurrency(revenueThisMonth)}</h3>
              </div>
              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-5 shadow-xl">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Outstanding</p>
                <h3 className="mt-2 text-2xl font-black text-amber-400">{formatCurrency(outstandingTotal)}</h3>
              </div>
              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-5 shadow-xl">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Paid This Month</p>
                <h3 className="mt-2 text-2xl font-black text-emerald-400">{formatCurrency(paidThisMonth)}</h3>
              </div>
              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-5 shadow-xl">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Overdue</p>
                <h3 className="mt-2 text-2xl font-black text-red-400">{formatCurrency(overdueTotal)}</h3>
              </div>
              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-5 shadow-xl">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Customers</p>
                <h3 className="mt-2 text-2xl font-black text-white">{customerCount}</h3>
              </div>
              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-5 shadow-xl">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Invoices</p>
                <h3 className="mt-2 text-2xl font-black text-white">{invoiceCount}</h3>
              </div>
            </div>

            <div className="mt-8 grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-200">Revenue Over Time</h2>
                    <p className="text-sm text-gray-500">Total invoiced amount by date created.</p>
                  </div>
                  <div className="flex rounded-xl bg-[#1c202f] border border-gray-800 p-1">
                    {(["7", "30", "90", "365"] as const).map((option) => (
                      <button
                        key={option}
                        onClick={() => setRange(option)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${range === option ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
                      >
                        {option === "365" ? "Year" : `${option}D`}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={revenueChartData}>
                      <CartesianGrid stroke="#1c202f" strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                      <YAxis stroke="#6b7280" fontSize={11} />
                      <Tooltip
                        contentStyle={{ background: "#12151f", border: "1px solid #374151", borderRadius: 8 }}
                        labelStyle={{ color: "#e5e7eb" }}
                        formatter={(value) => [
                          formatCurrency(Number(value)),
                          "Revenue",
                        ]}
                      />
                      <Line type="monotone" dataKey="total" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: "#a855f7", r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                <h2 className="text-xl font-semibold text-gray-200">Business Health</h2>
                <p className="text-sm text-gray-500 mb-6">Simple score based on collections and overdue invoices.</p>
                <div className="text-center">
                  <p className={`text-6xl font-black ${healthColor}`}>{healthScore}</p>
                  <p className="text-gray-500 text-sm mt-1">out of 100</p>
                </div>
                <div className="mt-6 space-y-3 text-sm text-gray-400">
                  <p>Paid rate: {paidRate}%</p>
                  <p>Outstanding: {formatCurrency(outstandingTotal)}</p>
                  <p>Overdue: {formatCurrency(overdueTotal)}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid lg:grid-cols-3 gap-6">
              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                <h2 className="text-xl font-semibold mb-1 text-gray-200">Invoice Status</h2>
                <p className="text-sm text-gray-500 mb-6">Invoice count by status.</p>
                {invoiceStatusChartData.length === 0 ? (
                  <p className="text-gray-500 text-sm">No invoice data yet.</p>
                ) : (
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={invoiceStatusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                          {invoiceStatusChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#12151f", border: "1px solid #374151", borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                <h2 className="text-xl font-semibold mb-1 text-gray-200">Estimate Pipeline</h2>
                <p className="text-sm text-gray-500 mb-6">Draft, sent, accepted, declined, and converted estimates.</p>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={estimatePipelineData}>
                      <CartesianGrid stroke="#1c202f" strokeDasharray="3 3" />
                      <XAxis dataKey="status" stroke="#6b7280" fontSize={10} />
                      <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "#12151f", border: "1px solid #374151", borderRadius: 8 }} />
                      <Bar dataKey="count" fill="#a855f7" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                <h2 className="text-xl font-semibold mb-1 text-gray-200">Quick Actions</h2>
                <p className="text-sm text-gray-500 mb-6">Start common tasks faster.</p>
                <div className="grid gap-3">
                  <Link href="/invoices" className="rounded-xl bg-purple-600 hover:bg-purple-700 transition-colors px-4 py-3 font-semibold text-center">+ New Invoice</Link>
                  <Link href="/estimates" className="rounded-xl bg-[#1c202f] border border-gray-700/60 hover:border-purple-500 transition-colors px-4 py-3 font-semibold text-center">+ New Estimate</Link>
                  <Link href="/customers" className="rounded-xl bg-[#1c202f] border border-gray-700/60 hover:border-purple-500 transition-colors px-4 py-3 font-semibold text-center">+ New Customer</Link>
                  <Link href="/settings" className="rounded-xl bg-[#1c202f] border border-gray-700/60 hover:border-purple-500 transition-colors px-4 py-3 font-semibold text-center">Settings</Link>
                </div>
              </div>
            </div>

            <div className="mt-8 grid lg:grid-cols-3 gap-6">
              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                <h2 className="text-xl font-semibold mb-6 text-gray-200">Upcoming Due Dates</h2>
                {upcomingDueDates.length === 0 ? <p className="text-gray-500 text-sm">No upcoming unpaid invoices.</p> : (
                  <div className="space-y-3">
                    {upcomingDueDates.map((invoice) => (
                      <div key={invoice.id} className="rounded-xl bg-[#1c202f]/50 border border-gray-800 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-sm">Invoice #{invoice.invoiceNumber}</p>
                            <p className="text-xs text-gray-500">{invoice.customer?.name || invoice.customerName}</p>
                          </div>
                          <p className="font-bold">{formatCurrency(invoice.total)}</p>
                        </div>
                        <p className="text-xs text-amber-300 mt-2">
                          {invoice.daysLeft === 0 ? "Due today" : invoice.daysLeft && invoice.daysLeft > 0 ? `Due in ${invoice.daysLeft} day${invoice.daysLeft === 1 ? "" : "s"}` : `${Math.abs(invoice.daysLeft || 0)} day${Math.abs(invoice.daysLeft || 0) === 1 ? "" : "s"} overdue`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                <h2 className="text-xl font-semibold mb-6 text-gray-200">Top Customers</h2>
                {topCustomers.length === 0 ? <p className="text-gray-500 text-sm">No customer revenue yet.</p> : (
                  <div className="space-y-3">
                    {topCustomers.map((customer, index) => (
                      <div key={customer.name} className="flex items-center justify-between rounded-xl bg-[#1c202f]/50 border border-gray-800 p-4">
                        <div>
                          <p className="text-xs text-gray-500">#{index + 1}</p>
                          <p className="font-semibold text-sm">{customer.name}</p>
                        </div>
                        <p className="font-bold">{formatCurrency(customer.total)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                <h2 className="text-xl font-semibold mb-6 text-gray-200">Recent Activity</h2>
                {recentActivity.length === 0 ? <p className="text-gray-500 text-sm">No recent activity yet.</p> : (
                  <div className="space-y-3">
                    {recentActivity.map((item) => (
                      <div key={item.id} className="rounded-xl bg-[#1c202f]/50 border border-gray-800 p-4">
                        <p className="font-semibold text-sm">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-red-300">
                    Late & Actionable Invoices
                  </h2>
                  <p className="text-sm text-gray-500">
                    Unpaid invoices that require follow-up.
                  </p>
                </div>

                <span className="rounded-full bg-red-900/40 border border-red-700/50 px-3 py-1 text-xs font-semibold text-red-300">
                  {lateInvoices.length} Late
                </span>
              </div>

              {lateInvoices.length === 0 ? (
                <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-5">
                  <p className="font-semibold text-emerald-300">No late invoices 🎉</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Everything looks current. No urgent follow-ups needed.
                  </p>
                </div>
              ) : (
                lateInvoices.slice(0, 10).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="rounded-xl bg-[#1c202f]/50 border border-gray-800 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">
                          {invoice.customer?.name || invoice.customerName}
                          {invoice.customer?.company ? ` (${invoice.customer.company})` : ""}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">Invoice #{invoice.invoiceNumber}</p>

                        <p className="text-xs text-red-400 mt-2">
                          {Math.abs(daysUntil(invoice.dueDate) ?? 0)} day{Math.abs(daysUntil(invoice.dueDate) ?? 0) === 1 ? "" : "s"} overdue
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold">{formatCurrency(invoice.total)}</p>

                        <p className="text-xs text-gray-500 mt-1">Due {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Unknown"}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => sendReminder(invoice)}
                        className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 transition py-2 text-sm font-semibold">

                        Send Reminder

                      </button>

                      <button
                        className="flex-1 rounded-lg bg-[#252b3c] hover:bg-[#31384c] transition py-2 text-sm font-semibold">

                        View Invoice

                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
