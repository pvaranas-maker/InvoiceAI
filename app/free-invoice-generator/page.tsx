'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

interface LineItem {
  id: string;
  description: string;
  qty: number | '';
  unitPrice: number | '';
}

// --- Theme system ---------------------------------------------------------
// Same approach as the estimate generator: each theme carries plain RGB
// triples for jsPDF (which can't read CSS/Tailwind) and parallel Tailwind
// classes for the live HTML preview. One click swaps both at once.
type ThemeId = 'classic' | 'modern' | 'minimal' | 'purple' | 'blueCorporate' | 'contractor';

interface Theme {
  id: ThemeId;
  label: string;
  swatch: string;
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

export default function FreeInvoiceGenerator() {
  // Sender (business) details — previously missing entirely from the PDF
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');

  const [customerName, setCustomerName] = useState('');

  // IMPORTANT: invoiceNumber and issueDate must NOT be computed from Date.now()
  // during initial render. The server renders once, then the client renders
  // again on hydration a few milliseconds later — Date.now() returns a
  // different value each time, so React sees mismatched HTML and throws a
  // hydration error. Start with empty/stable placeholders, then fill them in
  // via useEffect, which only ever runs on the client after hydration.
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Theme selection — purely presentational, never read by validation or totals
  const [themeId, setThemeId] = useState<ThemeId>('purple');
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  // Runs once, client-side only, after the component has mounted —
  // safe place for anything time-based or random.
  useEffect(() => {
    setInvoiceNumber('INV-' + Date.now().toString().slice(-6));
    setIssueDate(new Date().toISOString().split('T')[0]);
  }, []);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', qty: 1, unitPrice: 0 }
  ]);
  const [taxRate, setTaxRate] = useState<number | ''>(8.25);
  const [notes, setNotes] = useState('');

  // Surfaced validation message shown near the Generate button
  const [formError, setFormError] = useState('');

  // Fallback parsers so number inputs don't crash or trap stubborn zeros during backspaces
  const getNumericQty = (item: LineItem) => (item.qty === '' ? 0 : item.qty);
  const getNumericPrice = (item: LineItem) => (item.unitPrice === '' ? 0 : item.unitPrice);
  const getNumericTaxRate = () => (taxRate === '' ? 0 : taxRate);

  // Math calculations built on top of safety parsers
  const subtotal = lineItems.reduce((sum, item) => sum + getNumericQty(item) * getNumericPrice(item), 0);
  const taxAmount = subtotal * (getNumericTaxRate() / 100);
  const total = subtotal + taxAmount;

  const addItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), description: '', qty: '', unitPrice: '' }
    ]);
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

  // Validation checks EVERY line item that has any data entered, not just
  // whether at least one item somewhere is fully valid. Otherwise a partially
  // filled row (e.g. price entered but qty left blank) can silently compute
  // to $0.00 and ship in a real PDF as long as some other row is complete.
  const validateInvoice = () => {
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
    const error = validateInvoice();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError('');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 20;
    const rightMargin = 185;
    const descriptionMaxWidth = 80; // keeps long descriptions from overlapping Qty/Price columns

    const { heading, accent, muted, line, headingFont } = theme.pdf;

    doc.setFont(headingFont, 'bold');
    doc.setTextColor(heading[0], heading[1], heading[2]);
    doc.setFontSize(22);
    doc.text('INVOICE', 105, 25, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    // From / business details — previously absent, so the PDF had no sender identity
    doc.setFontSize(10);
    doc.text(businessName || 'Your Business Name', leftMargin, 38);
    if (businessEmail) {
      doc.text(businessEmail, leftMargin, 44);
    }

    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoiceNumber}`, leftMargin, 56);
    doc.text(`Date: ${issueDate}`, leftMargin, 63);
    doc.text(`Due Date: ${dueDate || 'Upon Receipt'}`, leftMargin, 70);

    doc.setFontSize(11);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text('Bill To:', leftMargin, 85);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(customerName, leftMargin, 93);

    let y = 112;
    doc.setFontSize(10);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text('Description', leftMargin, y);
    doc.text('Qty', 110, y, { align: 'center' });
    doc.text('Unit Price', 145, y, { align: 'right' });
    doc.text('Total', rightMargin, y, { align: 'right' });

    y += 4;
    doc.setDrawColor(line[0], line[1], line[2]);
    doc.line(leftMargin, y, rightMargin, y);

    y += 8;
    doc.setTextColor(0, 0, 0);
    lineItems.forEach(item => {
      const text = item.description || 'Item Description';
      // Wrap long descriptions instead of letting them run into other columns
      const wrappedLines = doc.splitTextToSize(text, descriptionMaxWidth);
      doc.text(wrappedLines, leftMargin, y);
      doc.text(getNumericQty(item).toString(), 110, y, { align: 'center' });
      doc.text(`$${getNumericPrice(item).toFixed(2)}`, 145, y, { align: 'right' });
      doc.text(`$${(getNumericQty(item) * getNumericPrice(item)).toFixed(2)}`, rightMargin, y, { align: 'right' });
      // Advance extra space if the description wrapped to multiple lines
      y += Math.max(10, wrappedLines.length * 6);
    });

    y += 5;
    doc.setDrawColor(line[0], line[1], line[2]);
    doc.line(120, y, rightMargin, y);
    y += 8;
    doc.setTextColor(0, 0, 0);
    doc.text(`Subtotal:`, 145, y, { align: 'right' });
    doc.text(`$${subtotal.toFixed(2)}`, rightMargin, y, { align: 'right' });

    y += 8;
    doc.text(`Tax (${getNumericTaxRate()}%):`, 145, y, { align: 'right' });
    doc.text(`$${taxAmount.toFixed(2)}`, rightMargin, y, { align: 'right' });

    y += 10;
    doc.setFont(headingFont, 'bold');
    doc.setFontSize(14);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(`Total Due:`, 145, y, { align: 'right' });
    doc.text(`$${total.toFixed(2)}`, rightMargin, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    if (notes) {
      y += 20;
      doc.setFontSize(10);
      doc.text('Notes / Payment Terms:', leftMargin, y);
      doc.setFontSize(9);
      // Wrap notes text so long paragraphs don't run off the page edge
      const wrappedNotes = doc.splitTextToSize(notes, rightMargin - leftMargin);
      doc.text(wrappedNotes, leftMargin, y + 8);
      y += 8 + wrappedNotes.length * 5;
    }

    // Subtle, durable brand exposure on every PDF this tool produces
    doc.setFontSize(8);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text(
      'Generated free with InvoiceAI — invoiceai.com',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    doc.save(`Invoice-${invoiceNumber}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white py-12 px-6 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Marketing Header */}
        <div className="text-center mb-12">
          <span className="bg-purple-900/40 text-purple-400 border border-purple-800/60 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
            Free Developer Tool
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-3 mb-3 tracking-tight">Free Invoice Generator</h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">Create and download polished invoices instantly. No card details or registration necessary.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-start">

          {/* Form Side */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
              <h2 className="text-xl font-semibold mb-6 text-gray-200">Invoice Details</h2>

              <div className="space-y-4">
                {/* From / business details — new section */}
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
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Invoice ID</label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
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
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Payment Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
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
                        placeholder="Description (e.g. System Audit)"
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
                      <input
                        type="number"
                        min="0"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                        className="w-24 bg-[#252b3d] border border-gray-700/40 focus:border-purple-500 rounded-lg px-3 py-2 text-sm outline-none"
                      />
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
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      value={taxRate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (isNaN(val)) {
                          setTaxRate('');
                        } else {
                          setTaxRate(Math.max(0, val));
                        }
                      }}
                      className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Notes & Terms</label>
                    <textarea
                      placeholder="Notes or explicit banking wire details..."
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
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-left ${
                      themeId === t.id
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
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className={`text-xl font-black tracking-tight ${theme.preview.headingText}`}>
                    {businessName || <span className="text-slate-300 italic font-normal">Your Business Name</span>}
                  </div>
                  {businessEmail && <div className={`text-xs mt-0.5 ${theme.preview.mutedText}`}>{businessEmail}</div>}
                </div>
                <div className={`text-right text-xs ${theme.preview.mutedText}`}>
                  <div className={`font-bold ${theme.preview.headingText}`}>#{invoiceNumber || '—'}</div>
                  <div className="mt-1">Date: {issueDate}</div>
                  {dueDate && <div className={`font-medium ${theme.preview.accentText}`}>Due: {dueDate}</div>}
                </div>
              </div>

              <div className="mb-6">
                <div className={`text-xs font-bold uppercase tracking-wide mb-1 ${theme.preview.accentText}`}>Billed To</div>
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
                      ${(getNumericQty(item) * getNumericPrice(item)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className={`space-y-2 text-sm pb-4 mb-4 border-b ${theme.preview.border}`}>
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-700">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax ({getNumericTaxRate()}%)</span>
                  <span className="font-medium text-slate-700">${taxAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className={`font-bold ${theme.preview.headingText}`}>Total Due</span>
                <span className={`text-2xl font-black ${theme.preview.accentText}`}>${total.toFixed(2)}</span>
              </div>

              {notes && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-500 whitespace-pre-line">
                  <span className="font-bold block text-slate-600 mb-0.5">Notes:</span>
                  {notes}
                </div>
              )}
            </div>

            {/* Single, consolidated upgrade CTA — replaces the inline nudge that interrupted the form */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-5 text-center border-t border-purple-900">
              <p className="text-xs text-purple-200">Want saved clients, online payments, and auto-reminders?</p>
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