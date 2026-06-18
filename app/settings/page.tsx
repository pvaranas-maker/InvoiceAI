"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";

type CompanySettings = {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxRate: number;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>({
    companyName: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    taxRate: 8.6,
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem("companySettings");

    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  function updateSetting(field: keyof CompanySettings, value: string | number) {
    setSettings({
      ...settings,
      [field]: value,
    });
  }

  function saveSettings() {
    localStorage.setItem("companySettings", JSON.stringify(settings));
    alert("Settings saved!");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex">
        <Sidebar />

        <section className="flex-1 p-10">
          <h2 className="text-5xl font-bold">Settings</h2>
          <p className="mt-2 text-slate-400">
            Manage your business information for invoices and PDFs.
          </p>

          <div className="mt-8 max-w-3xl rounded-xl bg-slate-900 p-6">
            <div className="space-y-5">
              <input
                value={settings.companyName}
                onChange={(e) => updateSetting("companyName", e.target.value)}
                placeholder="Company Name"
                className="w-full rounded-lg bg-slate-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                value={settings.address}
                onChange={(e) => updateSetting("address", e.target.value)}
                placeholder="Business Address"
                className="w-full rounded-lg bg-slate-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                value={settings.phone}
                onChange={(e) => updateSetting("phone", e.target.value)}
                placeholder="Phone Number"
                className="w-full rounded-lg bg-slate-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                value={settings.email}
                onChange={(e) => updateSetting("email", e.target.value)}
                placeholder="Business Email"
                className="w-full rounded-lg bg-slate-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                value={settings.website}
                onChange={(e) => updateSetting("website", e.target.value)}
                placeholder="Website"
                className="w-full rounded-lg bg-slate-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="number"
                value={settings.taxRate}
                onChange={(e) =>
                  updateSetting("taxRate", Number(e.target.value))
                }
                placeholder="Tax Rate"
                className="w-full rounded-lg bg-slate-800 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={saveSettings}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
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