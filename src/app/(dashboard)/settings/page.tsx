"use client";

import { useState, useEffect } from "react";
import { INDIAN_STATES } from "@/lib/utils";

export default function SettingsPage() {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "", gstin: "", pan: "", address: "", city: "",
    state: "", stateCode: "", pincode: "", phone: "", email: "", website: "",
    fyStartMonth: "4",
  });

  useEffect(() => {
    fetch("/api/company")
      .then((r) => r.json())
      .then((c) => {
        setCompany(c);
        setForm({
          name: c.name || "",
          gstin: c.gstin || "",
          pan: c.pan || "",
          address: c.address || "",
          city: c.city || "",
          state: c.state || "",
          stateCode: c.stateCode || "",
          pincode: c.pincode || "",
          phone: c.phone || "",
          email: c.email || "",
          website: c.website || "",
          fyStartMonth: String(c.fyStartMonth || 4),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStateChange = (stateName: string) => {
    const found = INDIAN_STATES.find((s) => s.name === stateName);
    setForm((f) => ({ ...f, state: stateName, stateCode: found?.code || "" }));
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="empty-state"><p>Loading…</p></div>;

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Settings
          <div className="topbar-sub">Company profile &amp; preferences</div>
        </div>
        {saved && <span style={{ color: "var(--positive)", fontSize: 13 }}>Saved</span>}
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div className="page-content" style={{ maxWidth: 800 }}>
        {/* Company Profile */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Company Profile</span>
          </div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Company / Business Name *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Sharma Traders Pvt Ltd"
                />
              </div>
              <div className="form-group">
                <label className="form-label">GSTIN</label>
                <input
                  className="form-input"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                  placeholder="27AABCS1429B1Z1"
                  style={{ fontFamily: "monospace" }}
                />
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                  15-character GST Identification Number
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">PAN</label>
                <input
                  className="form-input"
                  value={form.pan}
                  onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                  placeholder="AABCS1429B"
                  style={{ fontFamily: "monospace" }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  className="form-input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Registered Address</label>
                <input
                  className="form-input"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  className="form-input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <select
                  className="form-select form-input"
                  value={form.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                >
                  <option value="">Select state...</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.name}>{s.code} – {s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input
                  className="form-input"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Website</label>
                <input
                  className="form-input"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Year Settings */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Financial Year</span>
          </div>
          <div className="card-body">
            <div className="form-group" style={{ maxWidth: 300 }}>
              <label className="form-label">Financial Year Starts In</label>
              <select
                className="form-select form-input"
                value={form.fyStartMonth}
                onChange={(e) => setForm({ ...form, fyStartMonth: e.target.value })}
              >
                {[
                  { value: "1", label: "January" },
                  { value: "4", label: "April (Standard India)" },
                  { value: "7", label: "July" },
                  { value: "10", label: "October" },
                ].map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                Standard Indian financial year: April – March
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="card">
          <div className="card-body">
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: "var(--text-1)" }}>
              About BaaS
            </div>
            <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
              Bookkeeping as a Service (BaaS) is a GST-compliant accounting solution for Indian MSMEs.
              Built for shopkeepers, traders, service providers, and their accountants.
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 16, fontSize: 12, color: "var(--text-3)" }}>
              <span>Data stored locally (SQLite)</span>
              <span>GST Compliant</span>
              <span>Double-Entry Bookkeeping</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
