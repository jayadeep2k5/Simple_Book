"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR, formatDate } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PAID:      { label: "Paid",      cls: "badge-paid" },
  DRAFT:     { label: "Draft",     cls: "badge-draft" },
  SENT:      { label: "Sent",      cls: "badge-sent" },
  OVERDUE:   { label: "Overdue",   cls: "badge-overdue" },
  PARTIAL:   { label: "Partial",   cls: "badge-partial" },
  CANCELLED: { label: "Cancelled", cls: "badge-cancelled" },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => r.json())
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, []);

  const filtered = invoices.filter((inv) => {
    const matchStatus = filter === "ALL" || inv.status === filter;
    const matchSearch =
      !search ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.contact?.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalOutstanding = invoices
    .filter((i) => ["SENT", "PARTIAL", "OVERDUE"].includes(i.status))
    .reduce((s, i) => s + i.balanceDue, 0);

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Invoices
          <div className="topbar-sub">
            {invoices.length} total · {formatINR(totalOutstanding)} outstanding
          </div>
        </div>
        <Link href="/invoices/new" className="btn btn-primary">New Invoice</Link>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search by invoice # or customer..."
            className="form-input"
            style={{ maxWidth: 280 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            {["ALL", "DRAFT", "SENT", "PAID", "PARTIAL", "OVERDUE"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-secondary"}`}
              >
                {s === "ALL" ? "All" : STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Due Date</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th style={{ textAlign: "right" }}>Balance Due</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-3)" }}>Loading...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-3)" }}>
                    {invoices.length === 0
                      ? <><span>No invoices yet. </span><Link href="/invoices/new" style={{ color: "var(--accent)" }}>Create your first →</Link></>
                      : "No matching invoices."
                    }
                  </td>
                </tr>
              )}
              {filtered.map((inv) => {
                const cfg = STATUS_CONFIG[inv.status] || { label: inv.status, cls: "badge-draft" };
                const isOverdue = inv.status === "OVERDUE";
                return (
                  <tr key={inv.id}>
                    <td>
                      <span style={{ fontFamily: "monospace", color: "var(--accent)", fontWeight: 600 }}>
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{inv.contact?.name}</td>
                    <td style={{ color: "var(--text-3)" }}>{formatDate(inv.invoiceDate)}</td>
                    <td style={{ color: isOverdue ? "var(--negative)" : "var(--text-3)" }}>
                      {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {formatINR(inv.grandTotal)}
                    </td>
                    <td style={{ textAlign: "right", color: inv.balanceDue > 0 ? "var(--warning)" : "var(--positive)", fontWeight: 600 }}>
                      {formatINR(inv.balanceDue)}
                    </td>
                    <td><span className={`badge ${cfg.cls}`}>{cfg.label}</span></td>
                    <td>
                      <Link href={`/invoices/${inv.id}`} className="btn btn-ghost btn-sm">View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
