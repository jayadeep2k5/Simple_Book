"use client";

import { useState, useEffect } from "react";

const TYPES = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"] as const;

const TYPE_BADGE: Record<string, string> = {
  ASSET: "badge-asset", LIABILITY: "badge-liability",
  EQUITY: "badge-equity", INCOME: "badge-income", EXPENSE: "badge-expense",
};

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 1l12 12M13 1L1 13" />
  </svg>
);

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", type: "ASSET", subType: "", parentId: "", openingBalance: "0", description: "" });

  const fetchAccounts = () => {
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts).finally(() => setLoading(false));
  };
  useEffect(() => { fetchAccounts(); }, []);

  const handleSubmit = async () => {
    setSaving(true);
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, openingBalance: parseFloat(form.openingBalance) || 0, parentId: form.parentId || null }),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ code: "", name: "", type: "ASSET", subType: "", parentId: "", openingBalance: "0", description: "" });
    fetchAccounts();
  };

  const filtered = accounts.filter((a) => filter === "ALL" || a.type === filter);
  const grouped: Record<string, any[]> = {};
  filtered.forEach((a) => { if (!grouped[a.type]) grouped[a.type] = []; grouped[a.type].push(a); });
  const parentAccounts = accounts.filter((a) => !a.parentId);

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Chart of Accounts
          <div className="topbar-sub">{accounts.length} accounts</div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">Add Account</button>
      </div>

      <div className="page-content">
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {["ALL", ...TYPES].map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`btn btn-sm ${filter === t ? "btn-primary" : "btn-secondary"}`}>
              {t === "ALL" ? "All" : t[0] + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-3)" }}>Loading…</div>
        )}

        {Object.entries(grouped).map(([type, accs]) => (
          <div key={type} className="card" style={{ marginBottom: 12 }}>
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`badge ${TYPE_BADGE[type]}`}>{type[0] + type.slice(1).toLowerCase()}</span>
                <span style={{ color: "var(--text-3)", fontSize: 12 }}>{accs.length} accounts</span>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Account Name</th>
                  <th>Sub-Type</th>
                  <th style={{ textAlign: "right" }}>Opening Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {accs.map((acc) => (
                  <tr key={acc.id}>
                    <td><span className="mono" style={{ color: "var(--accent)", fontSize: 12 }}>{acc.code}</span></td>
                    <td style={{ fontWeight: acc.parentId ? 400 : 500, paddingLeft: acc.parentId ? 32 : 16 }}>
                      {acc.parentId && <span style={{ color: "var(--text-3)", marginRight: 6 }}>└</span>}
                      {acc.name}
                    </td>
                    <td style={{ color: "var(--text-3)", fontSize: 12 }}>{acc.subType || "—"}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500, color: acc.openingBalance >= 0 ? "var(--positive)" : "var(--negative)" }}>
                      ₹{acc.openingBalance.toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${acc.isActive ? "badge-paid" : "badge-cancelled"}`}>
                        {acc.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Add Account</span>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Account Code *</label>
                  <input className="form-input mono" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. 1108" />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Name *</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Petty Cash" />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {TYPES.map((t) => <option key={t} value={t}>{t[0] + t.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Account</label>
                  <select className="form-input form-select" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                    <option value="">None (top-level)</option>
                    {parentAccounts.filter((a) => a.type === form.type).map((a) => (
                      <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Opening Balance (₹)</label>
                  <input type="number" className="form-input" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })} step="any" />
                </div>
                <div className="form-group">
                  <label className="form-label">Sub-Type / Group</label>
                  <input className="form-input" value={form.subType} onChange={(e) => setForm({ ...form, subType: e.target.value })} placeholder="e.g. Current Assets" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSubmit} className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Account"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
