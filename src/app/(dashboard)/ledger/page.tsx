"use client";

import { useState, useEffect } from "react";
import { formatINR, formatDate } from "@/lib/utils";

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 1l12 12M13 1L1 13" />
  </svg>
);

export default function LedgerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterAccount, setFilterAccount] = useState("");
  const [form, setForm] = useState({
    narration: "", entryDate: new Date().toISOString().split("T")[0],
    debitAccountId: "", creditAccountId: "", amount: "",
  });

  const fetchEntries = () => {
    fetch("/api/ledger").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setEntries(d);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEntries();
    fetch("/api/accounts").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setAccounts(d); });
  }, []);

  const handleSubmit = async () => {
    if (!form.debitAccountId || !form.creditAccountId || !form.amount || !form.narration) return;
    setSaving(true);
    await fetch("/api/ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ narration: "", entryDate: new Date().toISOString().split("T")[0], debitAccountId: "", creditAccountId: "", amount: "" });
    fetchEntries();
  };

  const filtered = filterAccount
    ? entries.filter((e) => e.lines?.some((l: any) => l.accountId === filterAccount || l.creditAccountId === filterAccount))
    : entries;

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          General Ledger
          <div className="topbar-sub">Double-entry journal entries</div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">New Journal Entry</button>
      </div>

      <div className="page-content">
        <div style={{ marginBottom: 16 }}>
          <select className="form-input form-select" style={{ maxWidth: 280 }}
            value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)}>
            <option value="">All Accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} – {a.name}</option>)}
          </select>
        </div>

        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Entry #</th>
                <th>Date</th>
                <th>Narration</th>
                <th>Type</th>
                <th>Debit Account</th>
                <th>Credit Account</th>
                <th style={{ textAlign: "right" }}>Debit</th>
                <th style={{ textAlign: "right" }}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-3)" }}>Loading…</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-3)" }}>
                  No journal entries yet.{" "}
                  <button onClick={() => setShowModal(true)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13 }}>
                    Add first entry →
                  </button>
                </td></tr>
              )}
              {filtered.map((entry) =>
                entry.lines?.map((line: any, idx: number) => (
                  <tr key={`${entry.id}-${idx}`}>
                    {idx === 0 && (
                      <>
                        <td rowSpan={entry.lines.length}>
                          <span className="mono" style={{ color: "var(--accent)", fontSize: 12 }}>{entry.entryNumber}</span>
                        </td>
                        <td rowSpan={entry.lines.length} style={{ color: "var(--text-3)", fontSize: 12 }}>{formatDate(entry.entryDate)}</td>
                        <td rowSpan={entry.lines.length} style={{ maxWidth: 200, wordBreak: "break-word", color: "var(--text-2)" }}>{entry.narration}</td>
                        <td rowSpan={entry.lines.length}>
                          <span className="badge badge-draft" style={{ fontSize: 10 }}>{entry.type}</span>
                        </td>
                      </>
                    )}
                    <td style={{ color: line.debit > 0 ? "var(--text-1)" : "var(--text-3)", fontSize: 12 }}>
                      {line.debitAccount?.name || accounts.find((a) => a.id === line.accountId)?.name || "—"}
                    </td>
                    <td style={{ color: line.credit > 0 ? "var(--text-1)" : "var(--text-3)", fontSize: 12 }}>
                      {line.creditAccount?.name || accounts.find((a) => a.id === line.creditAccountId)?.name || "—"}
                    </td>
                    <td className="mono" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: line.debit > 0 ? "var(--accent)" : "var(--text-3)" }}>
                      {line.debit > 0 ? formatINR(line.debit) : "—"}
                    </td>
                    <td className="mono" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: line.credit > 0 ? "var(--positive)" : "var(--text-3)" }}>
                      {line.credit > 0 ? formatINR(line.credit) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">New Journal Entry</span>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Entry Date</label>
                    <input type="date" className="form-input" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (₹) *</label>
                    <input type="number" className="form-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} min={0} step="any" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Narration *</label>
                  <input className="form-input" value={form.narration} onChange={(e) => setForm({ ...form, narration: e.target.value })} placeholder="e.g. Paid rent for May 2025" />
                </div>
                <div className="form-group">
                  <label className="form-label">Debit Account *</label>
                  <select className="form-input form-select" value={form.debitAccountId} onChange={(e) => setForm({ ...form, debitAccountId: e.target.value })}>
                    <option value="">Select account to debit…</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} – {a.name} ({a.type})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Credit Account *</label>
                  <select className="form-input form-select" value={form.creditAccountId} onChange={(e) => setForm({ ...form, creditAccountId: e.target.value })}>
                    <option value="">Select account to credit…</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} – {a.name} ({a.type})</option>)}
                  </select>
                </div>
                <div style={{ padding: "10px 12px", background: "var(--bg-elevated)", borderRadius: "var(--r-md)", fontSize: 12, color: "var(--text-3)", lineHeight: 1.6, border: "1px solid var(--border)" }}>
                  <strong style={{ color: "var(--text-2)" }}>Double-entry rule:</strong> Every debit must have an equal and opposite credit.
                  <br />Example: Paid rent → Debit: Rent Expense | Credit: Bank Account
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSubmit} className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Post Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
