"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR, formatDate } from "@/lib/utils";

interface DashboardData {
  kpis: {
    revenueThisMonth: number;
    outstanding: number;
    expensesThisMonth: number;
    gstDue: number;
  };
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    grandTotal: number;
    status: string;
    contact: { name: string };
  }>;
  invoiceStats: Record<string, number>;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  PAID:      { label: "Paid",      cls: "badge-paid"      },
  DRAFT:     { label: "Draft",     cls: "badge-draft"     },
  SENT:      { label: "Sent",      cls: "badge-sent"      },
  OVERDUE:   { label: "Overdue",   cls: "badge-overdue"   },
  PARTIAL:   { label: "Partial",   cls: "badge-partial"   },
  CANCELLED: { label: "Cancelled", cls: "badge-cancelled" },
};

const KPIS = [
  { key: "revenueThisMonth",  label: "Revenue (MTD)",        sub: "Invoices sent & paid"     },
  { key: "outstanding",       label: "Outstanding",           sub: "Balance due from customers" },
  { key: "expensesThisMonth", label: "Expenses (MTD)",        sub: "Bills & purchase invoices" },
  { key: "gstDue",            label: "GST Collected (MTD)",   sub: "Tax on invoices"           },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Dashboard
          <div className="topbar-sub">{now}</div>
        </div>
        <Link href="/invoices/new" className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 1v12M1 7h12" />
          </svg>
          New Invoice
        </Link>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="empty-state" style={{ paddingTop: 96 }}>
            <p>Loading…</p>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="kpi-grid">
              {KPIS.map(({ key, label, sub }) => (
                <div key={key} className="kpi-card">
                  <div className="kpi-label">{label}</div>
                  <div className="kpi-value">
                    {formatINR(data?.kpis[key as keyof typeof data.kpis] || 0)}
                  </div>
                  <div className="kpi-trend">{sub}</div>
                </div>
              ))}
            </div>

            {/* Two-column: recent invoices + invoice summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>

              {/* Recent Invoices */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Recent Invoices</span>
                  <Link href="/invoices" className="btn btn-ghost btn-sm">View all</Link>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!data?.recentInvoices?.length && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--text-3)" }}>
                          No invoices yet.{" "}
                          <Link href="/invoices/new" style={{ color: "var(--accent)" }}>
                            Create your first →
                          </Link>
                        </td>
                      </tr>
                    )}
                    {data?.recentInvoices?.map((inv) => {
                      const s = STATUS[inv.status] || { label: inv.status, cls: "badge-draft" };
                      return (
                        <tr key={inv.id}>
                          <td>
                            <Link href={`/invoices/${inv.id}`} style={{ color: "var(--accent)", fontWeight: 500, fontSize: 13 }}>
                              {inv.invoiceNumber}
                            </Link>
                          </td>
                          <td style={{ color: "var(--text-2)" }}>{inv.contact.name}</td>
                          <td style={{ color: "var(--text-3)", fontSize: 12 }}>{formatDate(inv.invoiceDate)}</td>
                          <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                            {formatINR(inv.grandTotal)}
                          </td>
                          <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Invoice summary */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Invoice Summary</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {Object.entries(STATUS).map(([status, { label, cls }]) => {
                    const count = data?.invoiceStats?.[status] || 0;
                    return (
                      <div key={status} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 20px",
                        borderBottom: "1px solid var(--border)",
                      }}>
                        <span className={`badge ${cls}`}>{label}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                  <div style={{ padding: "12px 20px" }}>
                    <Link href="/invoices" className="btn btn-secondary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                      All Invoices
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </>
  );
}
