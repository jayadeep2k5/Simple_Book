"use client";

import { useState, useEffect, useMemo } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface TrackerEntry {
  id: string;
  name: string;
  date: string;
  amount: number;
  notes?: string;
  categoryId?: string;
  category?: Category;
}

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const DEFAULT_COLORS = [
  "#7C3AED", "#10B981", "#F59E0B", "#EF4444",
  "#3B82F6", "#EC4899", "#14B8A6", "#F97316",
];

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 1l12 12M13 1L1 13" />
  </svg>
);
const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 1v10M1 6h10" />
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M2 4h12M6 4V2h4v2M5 4l1 10h4l1-10" />
  </svg>
);

export default function TrackerPage() {
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntry, setShowEntry] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [entryForm, setEntryForm] = useState({
    name: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
    notes: "",
  });
  const [catForm, setCatForm] = useState({ name: "", color: DEFAULT_COLORS[0] });

  const fetchAll = () => {
    Promise.all([
      fetch("/api/tracker").then((r) => r.json()),
      fetch("/api/tracker/categories").then((r) => r.json()),
    ]).then(([e, c]) => {
      setEntries(e);
      setCategories(c);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAddEntry = async () => {
    if (!entryForm.name || !entryForm.amount) return;
    setSaving(true);
    await fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entryForm),
    });
    setSaving(false);
    setShowEntry(false);
    setEntryForm({ name: "", amount: "", date: new Date().toISOString().split("T")[0], categoryId: "", notes: "" });
    fetchAll();
  };

  const handleAddCategory = async () => {
    if (!catForm.name) return;
    setSaving(true);
    await fetch("/api/tracker/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(catForm),
    });
    setSaving(false);
    setShowCategory(false);
    setCatForm({ name: "", color: DEFAULT_COLORS[0] });
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense entry?")) return;
    await fetch("/api/tracker", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchAll();
  };

  // Filter
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const eDate = new Date(e.date);
      const key = `${eDate.getFullYear()}-${String(eDate.getMonth() + 1).padStart(2, "0")}`;
      const matchMonth = monthFilter === "ALL" || key === monthFilter;
      const matchCat = catFilter === "ALL" || e.categoryId === catFilter || (!e.categoryId && catFilter === "NONE");
      const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
      return matchMonth && matchCat && matchSearch;
    });
  }, [entries, monthFilter, catFilter, search]);

  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);

  // Category breakdown for current filter
  const catBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; color: string; total: number }>();
    filtered.forEach((e) => {
      const key = e.categoryId || "__none__";
      const name = e.category?.name || "Uncategorized";
      const color = e.category?.color || "#52525B";
      if (!map.has(key)) map.set(key, { name, color, total: 0 });
      map.get(key)!.total += e.amount;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  // Available month options
  const months = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      const d = new Date(e.date);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  function monthLabel(key: string) {
    const [y, m] = key.split("-");
    return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
  }

  // This month MTD total (always)
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const mtdTotal = entries
    .filter((e) => {
      const d = new Date(e.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === currentMonthKey;
    })
    .reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Expense Tracker
          <div className="topbar-sub">{entries.length} entries · {formatINR(mtdTotal)} this month</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowCategory(true)} className="btn btn-secondary">
            Manage Categories
          </button>
          <button onClick={() => setShowEntry(true)} className="btn btn-primary">
            <PlusIcon /> Add Expense
          </button>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 16 }}>

          {/* Left: expense list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Filters */}
            <div style={{ display: "flex", gap: 10 }}>
              <input className="form-input" placeholder="Search expenses…" value={search}
                onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
              <select className="form-input form-select" style={{ width: 160 }} value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}>
                <option value="ALL">All Time</option>
                {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
              </select>
              <select className="form-input form-select" style={{ width: 160 }} value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}>
                <option value="ALL">All Categories</option>
                <option value="NONE">Uncategorized</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="card">
              {/* Totals bar */}
              <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>{filtered.length} entries</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--negative)", fontVariantNumeric: "tabular-nums" }}>
                  {formatINR(filteredTotal)}
                </span>
              </div>

              {loading ? (
                <div className="empty-state"><p>Loading…</p></div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <p style={{ fontSize: 15, color: "var(--text-2)" }}>No expenses found.</p>
                  <button onClick={() => setShowEntry(true)} className="btn btn-primary" style={{ marginTop: 8 }}>
                    <PlusIcon /> Add First Expense
                  </button>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Notes</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry) => (
                      <tr key={entry.id}>
                        <td style={{ fontWeight: 500 }}>{entry.name}</td>
                        <td>
                          {entry.category ? (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "2px 8px",
                              borderRadius: 99,
                              fontSize: 11,
                              fontWeight: 500,
                              background: entry.category.color + "22",
                              color: entry.category.color,
                              border: `1px solid ${entry.category.color}44`,
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: entry.category.color, display: "inline-block" }} />
                              {entry.category.name}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-3)", fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ color: "var(--text-3)", fontSize: 12 }}>{formatDate(entry.date)}</td>
                        <td style={{ color: "var(--text-3)", fontSize: 12 }}>{entry.notes || "—"}</td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "var(--negative)", fontVariantNumeric: "tabular-nums" }}>
                          {formatINR(entry.amount)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button onClick={() => handleDelete(entry.id)} className="btn btn-ghost btn-icon btn-sm"
                            style={{ color: "var(--negative)", opacity: 0.6 }} title="Delete">
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right: breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* MTD card */}
            <div className="kpi-card">
              <div className="kpi-label">This Month Total</div>
              <div className="kpi-value" style={{ color: "var(--negative)" }}>{formatINR(mtdTotal)}</div>
              <div className="kpi-trend">Month-to-date</div>
            </div>

            {/* Category breakdown */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">By Category</span>
                {monthFilter !== "ALL" && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{monthLabel(monthFilter)}</span>}
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {catBreakdown.length === 0 ? (
                  <p style={{ fontSize: 13, color: "var(--text-3)", padding: "16px 20px" }}>No data</p>
                ) : catBreakdown.map((cat) => {
                  const pct = filteredTotal > 0 ? (cat.total / filteredTotal) * 100 : 0;
                  return (
                    <div key={cat.name} style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, display: "inline-block", flexShrink: 0 }} />
                          {cat.name}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--negative)", fontVariantNumeric: "tabular-nums" }}>
                          {formatINR(cat.total)}
                        </span>
                      </div>
                      <div style={{ height: 4, background: "var(--bg-hover)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: cat.color, borderRadius: 2, transition: "width 0.4s" }} />
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3, textAlign: "right" }}>{pct.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Manage categories inline */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Categories</span>
                <button onClick={() => setShowCategory(true)} className="btn btn-ghost btn-sm">+ New</button>
              </div>
              <div className="card-body" style={{ padding: "8px 0" }}>
                {categories.length === 0 ? (
                  <p style={{ fontSize: 13, color: "var(--text-3)", padding: "8px 16px" }}>No categories yet.</p>
                ) : categories.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 16px" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: 13 }}>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showEntry && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowEntry(false)}>
          <div className="modal-box" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="modal-title">Add Expense</span>
              <button onClick={() => setShowEntry(false)} className="btn btn-ghost btn-icon"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <input className="form-input" placeholder="e.g. Diesel for generator"
                    value={entryForm.name} onChange={(e) => setEntryForm({ ...entryForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className="form-input" placeholder="0.00"
                    value={entryForm.amount} step="0.01" min="0"
                    style={{ fontSize: 18, fontWeight: 600 }}
                    onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input form-select" value={entryForm.categoryId}
                    onChange={(e) => setEntryForm({ ...entryForm, categoryId: e.target.value })}>
                    <option value="">No category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {categories.length === 0 && (
                    <button onClick={() => { setShowEntry(false); setShowCategory(true); }}
                      style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, marginTop: 4 }}>
                      + Create a category first
                    </button>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={entryForm.date}
                    onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-input" placeholder="Optional details"
                    value={entryForm.notes} onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEntry(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleAddEntry} className="btn btn-primary"
                disabled={saving || !entryForm.name || !entryForm.amount}>
                {saving ? "Saving…" : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategory && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCategory(false)}>
          <div className="modal-box" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <span className="modal-title">New Expense Category</span>
              <button onClick={() => setShowCategory(false)} className="btn btn-ghost btn-icon"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input className="form-input" placeholder="e.g. Diesel, Labour, Maintenance"
                    value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {DEFAULT_COLORS.map((c) => (
                      <button key={c} onClick={() => setCatForm({ ...catForm, color: c })}
                        style={{
                          width: 28, height: 28, borderRadius: "50%", background: c,
                          border: catForm.color === c ? "3px solid white" : "3px solid transparent",
                          outline: catForm.color === c ? `2px solid ${c}` : "none",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCategory(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleAddCategory} className="btn btn-primary"
                disabled={saving || !catForm.name}>
                {saving ? "Saving…" : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
