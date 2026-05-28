"use client";

import { useState, useEffect, useMemo } from "react";

interface ProductionEntry {
  id: string;
  date: string;
  kgs: number;
  notes?: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function groupByMonth(entries: ProductionEntry[]) {
  const map = new Map<string, ProductionEntry[]>();
  entries.forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  });
  // Sort months descending
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 1l12 12M13 1L1 13" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M7 1v12M1 7h12" />
  </svg>
);

export default function ProductionPage() {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    kgs: "",
    notes: "",
  });

  const fetchEntries = () => {
    fetch("/api/production")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data);
        // Auto-expand current month
        const now = new Date();
        const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        setExpandedMonths(new Set([currentKey]));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleSubmit = async () => {
    if (!form.date || !form.kgs) return;
    setSaving(true);
    await fetch("/api/production", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: form.date, kgs: parseFloat(form.kgs), notes: form.notes }),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ date: new Date().toISOString().split("T")[0], kgs: "", notes: "" });
    fetchEntries();
  };

  const grouped = useMemo(() => groupByMonth(entries), [entries]);

  // Global stats
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthEntries = entries.filter((e) => {
    const d = new Date(e.date);
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  });
  const monthTotal = currentMonthEntries.reduce((s, e) => s + e.kgs, 0);
  const monthAvg = currentMonthEntries.length > 0 ? monthTotal / currentMonthEntries.length : 0;
  const monthBest = currentMonthEntries.length > 0 ? Math.max(...currentMonthEntries.map((e) => e.kgs)) : 0;
  const allTimeTotal = entries.reduce((s, e) => s + e.kgs, 0);

  const toggleMonth = (key: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Production Log
          <div className="topbar-sub">Daily output tracking</div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <PlusIcon /> Record Production
        </button>
      </div>

      <div className="page-content">
        {/* Stats row */}
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="kpi-card">
            <div className="kpi-label">This Month Total</div>
            <div className="kpi-value" style={{ color: "var(--accent)" }}>
              {monthTotal.toLocaleString("en-IN", { maximumFractionDigits: 1 })} kg
            </div>
            <div className="kpi-trend">{currentMonthEntries.length} days recorded</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Daily Average</div>
            <div className="kpi-value">{monthAvg.toLocaleString("en-IN", { maximumFractionDigits: 1 })} kg</div>
            <div className="kpi-trend">This month</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Best Day (Month)</div>
            <div className="kpi-value" style={{ color: "var(--positive)" }}>
              {monthBest.toLocaleString("en-IN", { maximumFractionDigits: 1 })} kg
            </div>
            <div className="kpi-trend">Highest single day</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">All Time Total</div>
            <div className="kpi-value">{allTimeTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })} kg</div>
            <div className="kpi-trend">Since records began</div>
          </div>
        </div>

        {/* Monthly grouped tables */}
        {loading ? (
          <div className="empty-state"><p>Loading…</p></div>
        ) : grouped.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: 16, color: "var(--text-2)" }}>No production records yet.</p>
            <p>Click "Record Production" to add your first entry.</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ marginTop: 12 }}>
              <PlusIcon /> Record Production
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {grouped.map(([key, monthEntries]) => {
              const total = monthEntries.reduce((s, e) => s + e.kgs, 0);
              const avg = total / monthEntries.length;
              const best = Math.max(...monthEntries.map((e) => e.kgs));
              const isExpanded = expandedMonths.has(key);
              const isCurrentMonth = key === currentMonthKey;

              return (
                <div key={key} className="card">
                  {/* Month header — clickable */}
                  <button
                    onClick={() => toggleMonth(key)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 20px",
                      background: "none",
                      border: "none",
                      borderBottom: isExpanded ? "1px solid var(--border)" : "none",
                      cursor: "pointer",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>
                        {monthLabel(key)}
                      </span>
                      {isCurrentMonth && (
                        <span className="badge badge-sent" style={{ fontSize: 10 }}>Current</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: "var(--text-3)" }}>Total</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
                          {total.toLocaleString("en-IN", { maximumFractionDigits: 1 })} kg
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: "var(--text-3)" }}>Avg/Day</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>
                          {avg.toLocaleString("en-IN", { maximumFractionDigits: 1 })} kg
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: "var(--text-3)" }}>Best</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--positive)", fontVariantNumeric: "tabular-nums" }}>
                          {best.toLocaleString("en-IN", { maximumFractionDigits: 1 })} kg
                        </div>
                      </div>
                      <div style={{ color: "var(--text-3)", fontSize: 16, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                        ▾
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th style={{ textAlign: "right" }}>Production (kg)</th>
                          <th>Notes</th>
                          <th style={{ textAlign: "right" }}>% of Month</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthEntries
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((entry) => {
                            const pct = total > 0 ? (entry.kgs / total) * 100 : 0;
                            const isBest = entry.kgs === best;
                            return (
                              <tr key={entry.id}>
                                <td style={{ color: "var(--text-2)" }}>{formatDate(entry.date)}</td>
                                <td style={{ textAlign: "right" }}>
                                  <span style={{
                                    fontWeight: 700,
                                    fontVariantNumeric: "tabular-nums",
                                    color: isBest ? "var(--positive)" : "var(--text-1)",
                                    fontSize: 14,
                                  }}>
                                    {entry.kgs.toLocaleString("en-IN", { maximumFractionDigits: 2 })} kg
                                  </span>
                                  {isBest && <span className="badge badge-paid" style={{ marginLeft: 6, fontSize: 10 }}>Best</span>}
                                </td>
                                <td style={{ color: "var(--text-3)", fontSize: 12 }}>{entry.notes || "—"}</td>
                                <td style={{ textAlign: "right" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                                    <div style={{
                                      width: 60,
                                      height: 6,
                                      background: "var(--bg-hover)",
                                      borderRadius: 3,
                                      overflow: "hidden",
                                    }}>
                                      <div style={{
                                        width: `${pct}%`,
                                        height: "100%",
                                        background: "var(--accent)",
                                        borderRadius: 3,
                                      }} />
                                    </div>
                                    <span style={{ fontSize: 12, color: "var(--text-3)", width: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                                      {pct.toFixed(1)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                      {/* Summary footer */}
                      <tfoot>
                        <tr style={{ background: "var(--bg-elevated)" }}>
                          <td style={{ fontWeight: 600, color: "var(--text-2)", padding: "10px 16px" }}>
                            {monthEntries.length} days
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "var(--accent)", fontVariantNumeric: "tabular-nums", padding: "10px 16px" }}>
                            {total.toLocaleString("en-IN", { maximumFractionDigits: 2 })} kg total
                          </td>
                          <td style={{ color: "var(--text-3)", fontSize: 12, padding: "10px 16px" }}>
                            Avg: {avg.toLocaleString("en-IN", { maximumFractionDigits: 2 })} kg/day
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Production Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="modal-title">Record Production</span>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon">
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Production (kg)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 850.5"
                    value={form.kgs}
                    step="0.1"
                    min="0"
                    onChange={(e) => setForm({ ...form, kgs: e.target.value })}
                    style={{ fontSize: 18, fontWeight: 600 }}
                  />
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                    Enter total kg produced today. If same date exists, it will be updated.
                  </span>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes (optional)</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Machine downtime 2hrs"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={saving || !form.kgs || !form.date}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
