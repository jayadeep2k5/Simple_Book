"use client";

import { useState, useEffect } from "react";
import { formatINR, formatDate } from "@/lib/utils";

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 1l12 12M13 1L1 13" />
  </svg>
);

const METHODS = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [form, setForm] = useState({
    amount: "", method: "CASH", reference: "", invoiceId: "", notes: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  const fetchPayments = () => {
    fetch("/api/payments").then((r) => r.json()).then(setPayments).finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchPayments();
    fetch("/api/invoices?status=SENT").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setInvoices(d); });
  }, []);

  const handleSubmit = async () => {
    if (!form.amount) return;
    setSaving(true);
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ amount: "", method: "CASH", reference: "", invoiceId: "", notes: "", paymentDate: new Date().toISOString().split("T")[0] });
    fetchPayments();
  };

  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Payments Received
          <div className="topbar-sub">{payments.length} payments · {formatINR(totalReceived)} total</div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">Record Payment</button>
      </div>

      <div className="page-content">
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Reference</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-3)" }}>Loading…</td></tr>}
              {!loading && payments.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-3)" }}>No payments recorded yet.</td></tr>
              )}
              {payments.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: "var(--text-3)", fontSize: 12 }}>{formatDate(p.paymentDate)}</td>
                  <td>
                    <span className="badge badge-draft" style={{ textTransform: "capitalize", letterSpacing: 0 }}>
                      {p.method.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    {p.invoice
                      ? <span className="mono" style={{ color: "var(--accent)", fontSize: 12, fontWeight: 500 }}>{p.invoice.invoiceNumber}</span>
                      : <span style={{ color: "var(--text-3)" }}>—</span>}
                  </td>
                  <td style={{ color: "var(--text-2)" }}>{p.invoice?.contact?.name || "—"}</td>
                  <td className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>{p.reference || "—"}</td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: "var(--positive)", fontVariantNumeric: "tabular-nums", fontSize: 14 }}>
                    {formatINR(p.amount)}
                  </td>
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
              <span className="modal-title">Record Payment</span>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Link to Invoice (optional)</label>
                  <select className="form-input form-select" value={form.invoiceId}
                    onChange={(e) => {
                      const inv = invoices.find((i) => i.id === e.target.value);
                      setForm({ ...form, invoiceId: e.target.value, amount: inv ? String(inv.balanceDue) : form.amount });
                    }}>
                    <option value="">No invoice / standalone payment</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} – {inv.contact?.name} – {formatINR(inv.balanceDue)} due
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className="form-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min={0} step="any" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-input form-select" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                      {METHODS.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Date</label>
                    <input type="date" className="form-input" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reference / Transaction ID</label>
                  <input className="form-input" placeholder="UPI ref, cheque no., etc." value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSubmit} className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
