"use client";

import { useState, useEffect } from "react";
import { formatINR, formatDate } from "@/lib/utils";

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 1l12 12M13 1L1 13" />
  </svg>
);

const CATEGORIES = [
  "Office Expenses", "Travel & Conveyance", "Rent", "Electricity & Utilities",
  "Telephone & Internet", "Salaries & Wages", "Advertisement", "Bank Charges",
  "Purchases", "Professional Fees", "Maintenance", "Other",
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [form, setForm] = useState({
    billNumber: "", billDate: new Date().toISOString().split("T")[0],
    contactId: "", category: "Office Expenses", notes: "",
  });
  const [items, setItems] = useState([
    { id: "1", description: "", quantity: 1, rate: 0, amount: 0, taxRateId: "", taxAmount: 0, total: 0 },
  ]);

  const fetchExpenses = () => {
    fetch("/api/expenses").then((r) => r.json()).then(setExpenses).finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchExpenses();
    fetch("/api/tax-rates").then((r) => r.json()).then(setTaxRates);
    fetch("/api/contacts?type=VENDOR").then((r) => r.json()).then(setContacts);
  }, []);

  const updateLine = (id: string, field: string, value: any) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      const amount = updated.quantity * updated.rate;
      const taxRate = taxRates.find((t) => t.id === updated.taxRateId);
      const taxAmount = taxRate ? (amount * taxRate.rate) / 100 : 0;
      return { ...updated, amount, taxAmount, total: amount + taxAmount };
    }));
  };

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const totalTax = items.reduce((s, i) => s + i.taxAmount, 0);
  const grandTotal = subtotal + totalTax;

  const handleSubmit = async () => {
    setSaving(true);
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items, subtotal, totalTax, grandTotal }),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ billNumber: "", billDate: new Date().toISOString().split("T")[0], contactId: "", category: "Office Expenses", notes: "" });
    setItems([{ id: "1", description: "", quantity: 1, rate: 0, amount: 0, taxRateId: "", taxAmount: 0, total: 0 }]);
    fetchExpenses();
  };

  const totalSpend = expenses.reduce((s, e) => s + e.grandTotal, 0);

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Expenses
          <div className="topbar-sub">{expenses.length} bills · {formatINR(totalSpend)} total</div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">Add Expense</button>
      </div>

      <div className="page-content">
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Vendor</th>
                <th>Date</th>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-3)" }}>Loading…</td></tr>}
              {!loading && expenses.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-3)" }}>
                  No expenses yet.{" "}
                  <button onClick={() => setShowModal(true)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13 }}>
                    Add first expense →
                  </button>
                </td></tr>
              )}
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td><span className="mono" style={{ color: "var(--accent)", fontSize: 12 }}>{exp.billNumber || "—"}</span></td>
                  <td style={{ color: exp.contact?.name ? "var(--text-1)" : "var(--text-3)" }}>
                    {exp.contact?.name || "Cash / Direct"}
                  </td>
                  <td style={{ color: "var(--text-3)", fontSize: 12 }}>{formatDate(exp.billDate)}</td>
                  <td style={{ fontSize: 12, color: "var(--text-2)" }}>{exp.category || "—"}</td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: "var(--negative)", fontVariantNumeric: "tabular-nums" }}>
                    {formatINR(exp.grandTotal)}
                  </td>
                  <td>
                    <span className={`badge ${exp.status === "PAID" ? "badge-paid" : exp.status === "CANCELLED" ? "badge-cancelled" : "badge-pending"}`}>
                      {exp.status[0] + exp.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box modal-box-lg">
            <div className="modal-header">
              <span className="modal-title">Add Expense / Purchase Bill</span>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Bill Number</label>
                  <input className="form-input" value={form.billNumber} onChange={(e) => setForm({ ...form, billNumber: e.target.value })} placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bill Date</label>
                  <input type="date" className="form-input" value={form.billDate} onChange={(e) => setForm({ ...form, billDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Vendor (optional)</label>
                  <select className="form-input form-select" value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })}>
                    <option value="">Cash / Direct Expense</option>
                    {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: "var(--text-2)" }}>Line Items</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Description", "Qty", "Rate (₹)", "Tax", "Total"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "4px 8px", fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: "3px 4px" }}>
                        <input className="form-input" style={{ fontSize: 13 }} placeholder="Description" value={item.description} onChange={(e) => updateLine(item.id, "description", e.target.value)} />
                      </td>
                      <td style={{ padding: "3px 4px", width: 64 }}>
                        <input type="number" className="form-input" style={{ fontSize: 13 }} value={item.quantity} onChange={(e) => updateLine(item.id, "quantity", parseFloat(e.target.value) || 0)} />
                      </td>
                      <td style={{ padding: "3px 4px", width: 100 }}>
                        <input type="number" className="form-input" style={{ fontSize: 13 }} value={item.rate} onChange={(e) => updateLine(item.id, "rate", parseFloat(e.target.value) || 0)} />
                      </td>
                      <td style={{ padding: "3px 4px", width: 140 }}>
                        <select className="form-input form-select" style={{ fontSize: 13 }} value={item.taxRateId} onChange={(e) => updateLine(item.id, "taxRateId", e.target.value)}>
                          <option value="">No tax</option>
                          {taxRates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </td>
                      <td className="mono" style={{ padding: "3px 8px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => setItems((prev) => [...prev, { id: String(Date.now()), description: "", quantity: 1, rate: 0, amount: 0, taxRateId: "", taxAmount: 0, total: 0 }])}
                className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}>
                Add Line
              </button>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 16, fontSize: 13, color: "var(--text-2)", alignItems: "baseline" }}>
                <span>Subtotal: <strong className="mono">{formatINR(subtotal)}</strong></span>
                <span>Tax: <strong className="mono">{formatINR(totalTax)}</strong></span>
                <span style={{ color: "var(--negative)", fontWeight: 700, fontSize: 15 }} className="mono">Total: {formatINR(grandTotal)}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSubmit} className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Expense"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
