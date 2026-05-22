"use client";

import { useState, useEffect } from "react";
import { INDIAN_STATES } from "@/lib/utils";

const TYPE_BADGE: Record<string, string> = {
  CUSTOMER: "badge-customer",
  VENDOR:   "badge-vendor",
  BOTH:     "badge-both",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "CUSTOMER", gstin: "", pan: "",
    phone: "", email: "", address: "", city: "", state: "", stateCode: "", pincode: "",
  });

  const fetchContacts = () => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then(setContacts)
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchContacts(); }, []);

  const handleStateChange = (stateName: string) => {
    const found = INDIAN_STATES.find((s) => s.name === stateName);
    setForm((f) => ({ ...f, state: stateName, stateCode: found?.code || "" }));
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    setSaving(true);
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ name: "", type: "CUSTOMER", gstin: "", pan: "", phone: "", email: "", address: "", city: "", state: "", stateCode: "", pincode: "" });
    fetchContacts();
  };

  const filtered = contacts.filter((c) => {
    const matchType = filter === "ALL" || c.type === filter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.gstin || "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Contacts
          <div className="topbar-sub">{contacts.length} contacts</div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">Add Contact</button>
      </div>

      <div className="page-content">
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
          <input type="text" placeholder="Search name or GSTIN…" className="form-input" style={{ maxWidth: 260 }}
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {["ALL", "CUSTOMER", "VENDOR", "BOTH"].map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`btn btn-sm ${filter === t ? "btn-primary" : "btn-secondary"}`}>
              {t === "ALL" ? "All" : t[0] + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>GSTIN</th>
                <th>Phone</th>
                <th>City / State</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-3)" }}>Loading…</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-3)" }}>No contacts found.</td></tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td><span className={`badge ${TYPE_BADGE[c.type] || "badge-draft"}`}>{c.type[0] + c.type.slice(1).toLowerCase()}</span></td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-3)" }}>{c.gstin || "—"}</td>
                  <td style={{ color: "var(--text-2)" }}>{c.phone || "—"}</td>
                  <td style={{ color: "var(--text-2)" }}>{[c.city, c.state].filter(Boolean).join(", ") || "—"}</td>
                  <td><button className="btn btn-ghost btn-sm">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Add Contact</span>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Business or person name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="CUSTOMER">Customer</option>
                    <option value="VENDOR">Vendor</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN</label>
                  <input className="form-input mono" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} placeholder="27AABCS1429B1Z1" />
                </div>
                <div className="form-group">
                  <label className="form-label">PAN</label>
                  <input className="form-input mono" value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select className="form-input form-select" value={form.state} onChange={(e) => handleStateChange(e.target.value)}>
                    <option value="">Select state…</option>
                    {INDIAN_STATES.map((s) => <option key={s.code} value={s.name}>{s.code} – {s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSubmit} className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save Contact"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
