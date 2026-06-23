'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { PDF_THEMES } from "../../lib/pdfThemes";

interface LineItem {
    id: string;
    description: string;
    qty: number | '';
    unitPrice: number | '';
}

const CURRENCIES = [
    { symbol: '$', code: 'USD', label: 'USD ($)' },
    { symbol: '€', code: 'EUR', label: 'EUR (€)' },
    { symbol: '£', code: 'GBP', label: 'GBP (£)' },
    { symbol: '¥', code: 'JPY', label: 'JPY (¥)' }
];

// --- Theme system ---------------------------------------------------------
// Each theme carries two parallel sets of colors:
//   - `pdf`: plain RGB triples ([r,g,b], 0-255) fed straight into jsPDF's
//     setTextColor/setDrawColor, since jsPDF can't read CSS or Tailwind.
//   - `preview`: Tailwind classes applied to the live HTML preview card.
// Same invoice data renders through both; only color/typography differs.
type ThemeId = 'classic' | 'modern' | 'minimal' | 'purple' | 'blueCorporate' | 'contractor';

interface Theme {
    id: ThemeId;
    label: string;
    swatch: string; // small color dot shown on the theme picker button
    pdf: {
        heading: [number, number, number];
        accent: [number, number, number];
        muted: [number, number, number];
        line: [number, number, number];
        headingFont: 'helvetica' | 'times' | 'courier';
    };
    preview: {
        headingText: string;
        accentText: string;
        mutedText: string;
        border: string;
        fontClass: string;
    };
}

const THEMES: Theme[] = [
    {
        id: 'classic',
        label: 'Classic',
        swatch: 'bg-slate-700',
        pdf: { heading: [20, 20, 20], accent: [20, 20, 20], muted: [120, 120, 120], line: [180, 180, 180], headingFont: 'times' },
        preview: {
            headingText: 'text-slate-900', accentText: 'text-slate-900',
            mutedText: 'text-slate-500', border: 'border-slate-200',
            fontClass: 'font-serif',
        },
    },
    {
        id: 'modern',
        label: 'Modern',
        swatch: 'bg-zinc-900',
        pdf: { heading: [10, 10, 10], accent: [10, 10, 10], muted: [140, 140, 140], line: [20, 20, 20], headingFont: 'helvetica' },
        preview: {
            headingText: 'text-zinc-900', accentText: 'text-zinc-900',
            mutedText: 'text-zinc-400', border: 'border-zinc-200',
            fontClass: 'font-sans',
        },
    },
    {
        id: 'minimal',
        label: 'Minimal',
        swatch: 'bg-gray-300 border border-gray-400',
        pdf: { heading: [60, 60, 60], accent: [60, 60, 60], muted: [170, 170, 170], line: [225, 225, 225], headingFont: 'helvetica' },
        preview: {
            headingText: 'text-gray-700', accentText: 'text-gray-700',
            mutedText: 'text-gray-400', border: 'border-gray-100',
            fontClass: 'font-sans',
        },
    },
    {
        id: 'purple',
        label: 'Purple (InvoiceAI)',
        swatch: 'bg-purple-600',
        pdf: { heading: [88, 28, 135], accent: [147, 51, 234], muted: [148, 138, 168], line: [216, 180, 254], headingFont: 'helvetica' },
        preview: {
            headingText: 'text-purple-900', accentText: 'text-purple-700',
            mutedText: 'text-purple-400/70', border: 'border-purple-100',
            fontClass: 'font-sans',
        },
    },
    {
        id: 'blueCorporate',
        label: 'Blue Corporate',
        swatch: 'bg-blue-700',
        pdf: { heading: [21, 60, 110], accent: [30, 90, 160], muted: [130, 150, 170], line: [190, 210, 230], headingFont: 'helvetica' },
        preview: {
            headingText: 'text-blue-900', accentText: 'text-blue-700',
            mutedText: 'text-blue-400/70', border: 'border-blue-100',
            fontClass: 'font-sans',
        },
    },
    {
        id: 'contractor',
        label: 'Contractor',
        swatch: 'bg-amber-600',
        pdf: { heading: [120, 53, 15], accent: [180, 83, 9], muted: [150, 130, 100], line: [253, 186, 116], headingFont: 'helvetica' },
        preview: {
            headingText: 'text-amber-900', accentText: 'text-amber-700',
            mutedText: 'text-amber-700/60', border: 'border-amber-100',
            fontClass: 'font-sans',
        },
    },
];

export default function FreeEstimateGenerator() {
    // Sender (business) details — mirrors the invoice generator's fix for missing sender identity
    const [businessName, setBusinessName] = useState('');
    const [businessEmail, setBusinessEmail] = useState('');



    const [customerName, setCustomerName] = useState('');

    // IMPORTANT: estimateNumber and issueDate must NOT be computed from Date.now()
    // during initial render — see FreeInvoiceGenerator.tsx for the full explanation
    // of the hydration mismatch this avoids. Start empty, fill in via useEffect.
    const [estimateNumber, setEstimateNumber] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [currency, setCurrency] = useState('$');

    const [lineItems, setLineItems] = useState<LineItem[]>([
        { id: crypto.randomUUID(), description: '', qty: 1, unitPrice: 0 }
    ]);
    const [taxRate, setTaxRate] = useState<number | ''>(8.25);
    const [notes, setNotes] = useState('');
    const [formError, setFormError] = useState('');
    const [themeId, setThemeId] = useState<ThemeId>("purple");


    // Theme selection — purely presentational, never read by validation or totals
    const pdfTheme = PDF_THEMES[themeId] ?? PDF_THEMES.purple;
    const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];


    // Runs once, client-side only, after the component has mounted
    useEffect(() => {
        setEstimateNumber('EST-' + Date.now().toString().slice(-6));
        setIssueDate(new Date().toISOString().split('T')[0]);
    }, []);

    // Structural input protection parsers
    const getNumericQty = (item: LineItem) => (item.qty === '' ? 0 : item.qty);
    const getNumericPrice = (item: LineItem) => (item.unitPrice === '' ? 0 : item.unitPrice);
    const getNumericTaxRate = () => (taxRate === '' ? 0 : taxRate);

    const subtotal = lineItems.reduce((sum, item) => sum + getNumericQty(item) * getNumericPrice(item), 0);
    const taxAmount = subtotal * (getNumericTaxRate() / 100);
    const total = subtotal + taxAmount;

    const addItem = () => {
        setLineItems([...lineItems, { id: crypto.randomUUID(), description: '', qty: '', unitPrice: '' }]);
    };

    // Clamp qty/price to non-negative so totals can't go negative from a typo or stray minus sign
    const updateItem = (id: string, field: keyof LineItem, value: string) => {
        setLineItems(lineItems.map(item => {
            if (item.id !== id) return item;
            if (field === 'qty' || field === 'unitPrice') {
                const parsed = parseFloat(value);
                if (isNaN(parsed)) return { ...item, [field]: '' };
                return { ...item, [field]: Math.max(0, parsed) };
            }
            return { ...item, [field]: value };
        }));
    };

    const deleteItem = (id: string) => {
        if (lineItems.length === 1) return;
        setLineItems(lineItems.filter(item => item.id !== id));
    };

    // Validation now checks EVERY line item that has any data entered, not just
    // whether at least one item somewhere is fully valid. Previously, a row like
    // "Labor, qty blank, price $355" would silently pass and compute to $0.00 as
    // long as some other row (e.g. "Parts") was complete — so an incomplete row
    // could end up on a real PDF without any warning.
    const validateForm = () => {
        if (!customerName.trim()) return 'Add a customer name before generating the PDF.';

        const touchedItems = lineItems.filter(
            item => item.description.trim() !== '' || getNumericQty(item) > 0 || getNumericPrice(item) > 0
        );

        if (touchedItems.length === 0) {
            return 'Add at least one line item with a description, quantity, and price.';
        }

        const incompleteItem = touchedItems.find(
            item => item.description.trim() === '' || getNumericQty(item) <= 0 || getNumericPrice(item) <= 0
        );

        if (incompleteItem) {
            const label = incompleteItem.description.trim() || 'one of your line items';
            return `"${label}" is missing a description, quantity, or price. Fill it in or remove it before generating the PDF.`;
        }

        return '';
    };

    const generatePDF = () => {
        const error = validateForm();
        if (error) {
            setFormError(error);
            return;
        }

        setFormError("");

        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const accent = theme.pdf.accent;
        const heading = theme.pdf.heading;
        const muted = theme.pdf.muted;
        const line = theme.pdf.line;
        const headingFont = theme.pdf.headingFont;

        const light = [248, 250, 252] as [number, number, number];

        const left = 20;
        const right = 190;

        doc.setFont(headingFont, "bold");
        doc.setFontSize(22);
        doc.setTextColor(...heading);
        doc.text(businessName || "Your Business Name", left, 22);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...muted);

        if (businessEmail) {
            doc.text(businessEmail, left, 30);
        }

        doc.setFont(headingFont, "bold");
        doc.setFontSize(32);
        doc.setTextColor(...heading);
        doc.text("ESTIMATE", right, 24, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...muted);
        doc.text("This is an estimate, not an invoice.", right, 33, {
            align: "right",
        });

        doc.setDrawColor(...line);
        doc.line(left, 42, right, 42);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...heading);
        doc.text("Prepared For:", left, 56);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(13);
        doc.text(customerName, left, 65);

        doc.setFontSize(10);
        doc.setTextColor(...muted);
        doc.text(`Estimate #: ${estimateNumber}`, right, 54, { align: "right" });
        doc.text(`Date: ${issueDate}`, right, 61, { align: "right" });
        doc.text(`Valid Until: ${validUntil || "Upon Review"}`, right, 68, {
            align: "right",
        });

        let y = 86;

        doc.setFillColor(...accent);
        doc.roundedRect(left, y, right - left, 10, 2, 2, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);

        doc.text("Description", left + 4, y + 6.7);
        doc.text("Qty", 110, y + 6.7, { align: "center" });
        doc.text("Unit Price", 150, y + 6.7, { align: "right" });
        doc.text("Total", right - 4, y + 6.7, { align: "right" });

        y += 17;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...heading);

        lineItems.forEach((item, index) => {
            const qty = getNumericQty(item);
            const price = getNumericPrice(item);
            const rowTotal = qty * price;
            const wrapped = doc.splitTextToSize(item.description || "Line Item", 75);
            const rowHeight = Math.max(13, wrapped.length * 6);

            if (y + rowHeight > pageHeight - 45) {
                doc.addPage();
                y = 25;
            }

            if (index % 2 === 0) {
                doc.setFillColor(...light);
                doc.rect(left, y - 6, right - left, rowHeight, "F");
            }

            doc.text(wrapped, left + 4, y);
            doc.text(String(qty), 110, y, { align: "center" });
            doc.text(`${currency}${price.toFixed(2)}`, 150, y, { align: "right" });
            doc.text(`${currency}${rowTotal.toFixed(2)}`, right - 4, y, {
                align: "right",
            });

            y += rowHeight;
        });

        y += 10;

        doc.setDrawColor(...line);
        doc.line(112, y, right, y);

        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(...muted);
        doc.text("Subtotal:", 150, y, { align: "right" });

        doc.setTextColor(...heading);
        doc.text(`${currency}${subtotal.toFixed(2)}`, right, y, { align: "right" });

        y += 8;

        doc.setTextColor(...muted);
        doc.text(`Tax (${getNumericTaxRate()}%):`, 150, y, { align: "right" });

        doc.setTextColor(...heading);
        doc.text(`${currency}${taxAmount.toFixed(2)}`, right, y, {
            align: "right",
        });

        y += 14;

        doc.setFillColor(...accent);
        doc.roundedRect(112, y - 9, 78, 20, 3, 3, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("ESTIMATED TOTAL", 118, y - 1);

        doc.setFontSize(17);
        doc.text(`${currency}${total.toFixed(2)}`, right - 5, y + 7, {
            align: "right",
        });

        if (notes.trim()) {
            y += 32;

            const wrappedNotes = doc.splitTextToSize(notes, right - left - 8);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(...heading);
            doc.text("Notes / Scope of Work", left, y);

            y += 8;

            doc.setFillColor(...light);
            doc.roundedRect(
                left,
                y - 5,
                right - left,
                wrappedNotes.length * 5 + 10,
                3,
                3,
                "F"
            );

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...muted);
            doc.text(wrappedNotes, left + 4, y + 2);
        }

        doc.setDrawColor(...line);
        doc.line(left, 275, right, 275);

        doc.setFontSize(8);
        doc.setTextColor(...muted);
        doc.text(
            "Generated free with InvoiceAI • Create unlimited invoices and estimates at invoiceai.com",
            pageWidth / 2,
            284,
            { align: "center" }
        );

        doc.save(`Estimate-${estimateNumber}.pdf`);
    };
    return (
        <div className="min-h-screen bg-[#0a0c14] text-white py-12 px-6 font-sans">
            <div className="max-w-6xl mx-auto">

                {/* Marketing Header — copy cleaned up to match the invoice generator's plain, direct tone */}
                <div className="text-center mb-12">
                    <span className="bg-purple-900/40 text-purple-400 border border-purple-800/60 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                        BEAUTIFUL ESTIMATES, FAST
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold mt-3 mb-3 tracking-tight">Free Estimate Generator</h1>
                    <p className="text-lg text-gray-400 max-w-xl mx-auto">Create professional project estimates in minutes. No card details or registration necessary.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-10 items-start">

                    {/* Form Side */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                            <h2 className="text-xl font-semibold mb-6 text-gray-200">Estimate Details</h2>

                            <div className="space-y-4">
                                {/* From / business details — new section, mirrors the invoice generator */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Your Business Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Acme Consulting"
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Your Email (optional)</label>
                                        <input
                                            type="email"
                                            placeholder="billing@acme.com"
                                            value={businessEmail}
                                            onChange={(e) => setBusinessEmail(e.target.value)}
                                            className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Client Details</label>
                                    <input
                                        type="text"
                                        placeholder="Customer or Company Name"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Estimate ID</label>
                                        <input
                                            type="text"
                                            value={estimateNumber}
                                            onChange={(e) => setEstimateNumber(e.target.value)}
                                            className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Issue Date</label>
                                        <input
                                            type="date"
                                            value={issueDate}
                                            onChange={(e) => setIssueDate(e.target.value)}
                                            style={{ colorScheme: 'dark' }}
                                            className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Valid Until</label>
                                    <input
                                        type="date"
                                        value={validUntil}
                                        onChange={(e) => setValidUntil(e.target.value)}
                                        style={{ colorScheme: 'dark' }}
                                        className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                                    />
                                </div>

                                {/* Line Items Container */}
                                <div className="space-y-3 pt-2">
                                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Line Items</label>
                                    {lineItems.map((item) => (
                                        <div key={item.id} className="flex gap-3 items-center bg-[#1c202f]/50 border border-gray-800 p-3 rounded-xl">
                                            <input
                                                type="text"
                                                placeholder="Description (e.g. Content Strategy)"
                                                value={item.description}
                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                className="flex-1 bg-[#252b3d] border border-gray-700/40 focus:border-purple-500 rounded-lg px-3 py-2 text-sm outline-none"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Qty"
                                                value={item.qty}
                                                onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                                className="w-16 bg-[#252b3d] border border-gray-700/40 focus:border-purple-500 rounded-lg px-2 py-2 text-sm text-center outline-none"
                                            />
                                            <div className="relative flex items-center">
                                                <span className="absolute left-2.5 text-sm text-gray-500 select-none">{currency}</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Price"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                                                    className="w-24 bg-[#252b3d] border border-gray-700/40 focus:border-purple-500 rounded-lg pl-6 pr-2 py-2 text-sm outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={() => deleteItem(item.id)}
                                                disabled={lineItems.length === 1}
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

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Currency</label>
                                        <select
                                            value={currency}
                                            onChange={(e) => setCurrency(e.target.value)}
                                            className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none cursor-pointer"
                                        >
                                            {CURRENCIES.map(c => (
                                                <option key={c.code} value={c.symbol} className="bg-[#12151f]">{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Tax Rate (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={taxRate}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setTaxRate(isNaN(val) ? '' : Math.max(0, val));
                                            }}
                                            className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Notes & Terms</label>
                                        <textarea
                                            placeholder="Scope details, deadlines, terms..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows={3}
                                            className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Theme Picker — one click changes both the live preview and the generated PDF */}
                        <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                            <h2 className="text-xl font-semibold mb-1 text-gray-200">Document Theme</h2>
                            <p className="text-sm text-gray-500 mb-5">Same data. Different look. Pick a style for your PDF.</p>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {THEMES.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setThemeId(t.id)}
                                        aria-pressed={themeId === t.id}
                                        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-left ${themeId === t.id
                                            ? 'border-purple-500 bg-purple-500/10 text-white'
                                            : 'border-gray-700/60 bg-[#1c202f] text-gray-300 hover:border-gray-500'
                                            }`}
                                    >
                                        <span className={`h-3.5 w-3.5 rounded-full flex-shrink-0 ${t.swatch}`} />
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sticky Preview Side */}
                    <div className="lg:col-span-5 lg:sticky lg:top-8 bg-white text-slate-900 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Live Document Preview</span>
                            <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-semibold">Free Generator</span>
                        </div>

                        <div className={`p-6 md:p-8 ${theme.preview.fontClass}`}>
                            {/* "Not a Bill" banner — prevents an estimate from being mistaken for a payable invoice */}
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-lg px-3 py-2 mb-6 text-center">
                                ESTIMATE — Not a Bill. No payment is due.
                            </div>

                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <div className={`text-xl font-black tracking-tight ${theme.preview.headingText}`}>
                                        {businessName || <span className="text-slate-300 italic font-normal">Your Business Name</span>}
                                    </div>
                                    {businessEmail && <div className={`text-xs mt-0.5 ${theme.preview.mutedText}`}>{businessEmail}</div>}
                                </div>
                                <div className={`text-right text-xs ${theme.preview.mutedText}`}>
                                    <div className={`font-bold ${theme.preview.headingText}`}>#{estimateNumber || '—'}</div>
                                    <div className="mt-1">Date: {issueDate}</div>
                                    {validUntil && <div className={`font-medium ${theme.preview.accentText}`}>Valid Thru: {validUntil}</div>}
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className={`text-xs font-bold uppercase tracking-wide mb-1 ${theme.preview.accentText}`}>Prepared For</div>
                                <div className={`text-sm font-semibold ${theme.preview.headingText}`}>{customerName || <span className="text-slate-300 italic font-normal">Add customer...</span>}</div>
                            </div>

                            <div className={`pb-2 mb-4 border-b ${theme.preview.border}`}>
                                <div className={`grid grid-cols-12 text-xs font-bold uppercase tracking-wider pb-2 border-b ${theme.preview.mutedText} ${theme.preview.border}`}>
                                    <div className="col-span-6">Description</div>
                                    <div className="col-span-2 text-center">Qty</div>
                                    <div className="col-span-4 text-right">Total</div>
                                </div>

                                {lineItems.map(item => (
                                    <div key={item.id} className={`grid grid-cols-12 text-sm py-2.5 text-slate-700 border-b last:border-0 items-center ${theme.preview.border}`}>
                                        <div className="col-span-6 truncate pr-2">
                                            {item.description || <span className="text-slate-300 italic">Untitled Line Item</span>}
                                        </div>
                                        <div className="col-span-2 text-center text-slate-500">{getNumericQty(item)}</div>
                                        <div className="col-span-4 text-right font-medium">
                                            {currency}{(getNumericQty(item) * getNumericPrice(item)).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={`space-y-2 text-sm pb-4 mb-4 border-b ${theme.preview.border}`}>
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-slate-700">{currency}{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Tax ({getNumericTaxRate()}%)</span>
                                    <span className="font-medium text-slate-700">{currency}{taxAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <span className={`font-bold ${theme.preview.headingText}`}>Estimated Total</span>
                                <span className={`text-2xl font-black ${theme.preview.accentText}`}>{currency}{total.toFixed(2)}</span>
                            </div>

                            {notes && (
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-500 whitespace-pre-line">
                                    <span className="font-bold block text-slate-600 mb-0.5">Notes:</span>
                                    {notes}
                                </div>
                            )}
                        </div>

                        {/* Single, consolidated upgrade CTA */}
                        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-5 text-center border-t border-purple-900">
                            <p className="text-xs text-purple-200">Want to convert estimates to invoices instantly and collect payments online?</p>
                            <a href="/signup" className="inline-block text-white text-xs font-bold bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg mt-2 shadow transition-colors">
                                Upgrade to Full Dashboard Engine →
                            </a>
                        </div>
                    </div>
                </div>

                {/* Big Trigger Callout */}
                <div className="text-center mt-12 bg-[#12151f]/40 border border-gray-800 rounded-3xl p-8 max-w-3xl mx-auto">
                    <button
                        onClick={generatePDF}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-lg font-bold px-12 py-5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 inline-flex items-center gap-2"
                    >
                        📥 Generate & Download PDF
                    </button>
                    {formError && (
                        <p className="text-sm text-red-400 mt-3 font-medium">{formError}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-3 font-medium">Valid, high-fidelity PDF standard architecture file format.</p>
                </div>

            </div>
        </div>
    );
}