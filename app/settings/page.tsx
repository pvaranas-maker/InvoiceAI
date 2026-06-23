"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "../../components/Sidebar";

type CompanySettings = {
  companyName: string;
  logoBase64: string; // data URL (e.g. "data:image/png;base64,...") or "" if none
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  taxRate: number;
  defaultPaymentTerms: string;
  defaultEstimateValidityDays: number;
};

// Logos are stored as base64 directly in settings, so a hard size cap keeps
// the JSON payload from ballooning every time settings load/save. 2MB is a
// generous ceiling for a logo image; anything larger almost certainly wasn't
// sized for this use case.
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>({
    companyName: "",
    logoBase64: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    taxId: "",
    taxRate: 8.6,
    defaultPaymentTerms: "Net 30",
    defaultEstimateValidityDays: 30,
  });

  const [logoError, setLogoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      const res = await fetch("/api/settings");

      if (res.ok) {
        const data = await res.json();

        if (data) {
          // Merge over defaults rather than replacing outright, so older
          // saved settings (from before these new fields existed) don't
          // wipe out the new defaults with `undefined`.
          setSettings((prev) => ({ ...prev, ...data }));
        }
      }
    }

    loadSettings();
  }, []);

  function updateSettings(
    field: keyof CompanySettings,
    value: string | number
  ) {
    setSettings({
      ...settings,
      [field]: value,
    });
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError("");

    if (!file.type.startsWith("image/")) {
      setLogoError("Please choose an image file (PNG, JPG, etc.).");
      return;
    }

    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Logo is too large — please choose an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateSettings("logoBase64", reader.result as string);
    };
    reader.onerror = () => {
      setLogoError("Couldn't read that file — please try again.");
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    updateSettings("logoBase64", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function saveSettings() {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    if (res.ok) {
      alert("Settings saved!");
    } else {
      alert("Unable to save settings.");
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
                Business Profile
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold mt-3 mb-3 tracking-tight">Settings</h1>
              <p className="text-lg text-gray-400 max-w-xl mx-auto">
                Manage your business information for invoices and PDFs.
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">

              {/* Logo */}
              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                <h2 className="text-xl font-semibold mb-1 text-gray-200">Business Logo</h2>
                <p className="text-sm text-gray-500 mb-5">Shown on your invoices, estimates, and receipts. PNG or JPG, under 2MB.</p>

                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-xl bg-[#1c202f] border border-gray-700/60 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {settings.logoBase64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={settings.logoBase64} alt="Business logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-gray-600 text-xs text-center px-2">No logo</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl bg-[#1c202f] border border-gray-700/60 hover:border-purple-500 transition-colors px-4 py-2 text-sm font-medium text-gray-200"
                      >
                        {settings.logoBase64 ? "Replace Logo" : "Upload Logo"}
                      </button>
                      {settings.logoBase64 && (
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="rounded-xl bg-[#1c202f] border border-gray-700/60 hover:border-red-500 transition-colors px-4 py-2 text-sm font-medium text-gray-400 hover:text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    {logoError && <p className="text-xs text-red-400">{logoError}</p>}
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                <h2 className="text-xl font-semibold mb-6 text-gray-200">Business Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Company Name</label>
                    <input
                      value={settings.companyName}
                      onChange={(e) => updateSettings("companyName", e.target.value)}
                      placeholder="e.g. Acme Consulting"
                      className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Business Address</label>
                    <textarea
                      value={settings.address}
                      onChange={(e) => updateSettings("address", e.target.value)}
                      placeholder={"123 Main St\nAnytown, ST 00000"}
                      rows={2}
                      className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                      <input
                        value={settings.phone}
                        onChange={(e) => updateSettings("phone", e.target.value)}
                        placeholder="(555) 555-5555"
                        className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Business Email</label>
                      <input
                        value={settings.email}
                        onChange={(e) => updateSettings("email", e.target.value)}
                        placeholder="billing@acme.com"
                        className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Website</label>
                      <input
                        value={settings.website}
                        onChange={(e) => updateSettings("website", e.target.value)}
                        placeholder="www.acme.com"
                        className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Tax ID / EIN</label>
                      <input
                        value={settings.taxId}
                        onChange={(e) => updateSettings("taxId", e.target.value)}
                        placeholder="12-3456789"
                        className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Defaults */}
              <div className="bg-[#12151f] border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                <h2 className="text-xl font-semibold mb-1 text-gray-200">Defaults</h2>
                <p className="text-sm text-gray-500 mb-5">Applied automatically to new invoices and estimates — you can still override them per document.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Default Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      value={settings.taxRate}
                      onChange={(e) =>
                        updateSettings("taxRate", Math.max(0, Number(e.target.value)))
                      }
                      placeholder="8.6"
                      className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Default Payment Terms</label>
                      <input
                        value={settings.defaultPaymentTerms}
                        onChange={(e) => updateSettings("defaultPaymentTerms", e.target.value)}
                        placeholder="Net 30"
                        className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Default Estimate Validity (days)</label>
                      <input
                        type="number"
                        min="1"
                        value={settings.defaultEstimateValidityDays}
                        onChange={(e) =>
                          updateSettings("defaultEstimateValidityDays", Math.max(1, Number(e.target.value)))
                        }
                        placeholder="30"
                        className="w-full bg-[#1c202f] border border-gray-700/60 focus:border-purple-500 rounded-xl px-4 py-3 text-sm transition-colors outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={saveSettings}
                className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 transition-colors px-6 py-3 font-semibold shadow-lg"
              >
                Save Settings
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}