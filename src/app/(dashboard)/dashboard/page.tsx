"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Pending",   cls: "badge-pending"   },
  PARTIAL:   { label: "Partial",   cls: "badge-partial"   },
  PAID:      { label: "Paid",      cls: "badge-paid"      },
  CANCELLED: { label: "Cancelled", cls: "badge-cancelled" },
};

// Simple SVG bar chart — no library
function MiniBarChart({ data }: { data: { month: string; kgs: number }[] }) {
  const max = Math.max(...data.map((d) => d.kgs), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, padding: "0 4px" }}>
      {data.map((d, i) => {
        const h = (d.kgs / max) * 80;
        const isCurrent = i === data.length - 1;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
            <div style={{ fontSize: 10, color: "var(--text-3)", fontVariantNumeric: "tabular-nums", opacity: d.kgs > 0 ? 1 : 0 }}>
              {d.kgs > 0 ? (d.kgs >= 1000 ? `${(d.kgs / 1000).toFixed(1)}t` : `${d.kgs.toFixed(0)}`) : ""}
            </div>
            <div style={{
              width: "100%",
              height: Math.max(h, d.kgs > 0 ? 4 : 0),
              background: isCurrent ? "var(--accent)" : "var(--bg-hover)",
              border: isCurrent ? "1px solid var(--accent)" : "1px solid var(--border)",
              borderRadius: "4px 4px 0 0",
              transition: "height 0.4s",
              minHeight: d.kgs > 0 ? 4 : 1,
            }} />
            <div style={{ fontSize: 10, color: isCurrent ? "var(--accent)" : "var(--text-3)", fontWeight: isCurrent ? 600 : 400 }}>
              {d.month}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface DashData {
  openingBalance: number;
  productionThisMonth: number;
  productionAvgPerDay: number;
  todayProductionKgs: number;
  ordersThisMonth: number;
  ordersRevenueMTD: number;
  totalOutstanding: number;
  collectedToday: number;
  trackerMTD: number;
  revenueMTD: number;
  monthlyProduction: Array<{ month: string; kgs: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    orderDate: string;
    status: string;
    totalAmount: number;
    amountPaid: number;
    balanceDue: number;
    customer: { name: string };
    items: Array<{ pipeType: string; quantity: number }>;
  }>;
  topDebtors: Array<{ name: string; balance: number }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Dashboard
          <div className="topbar-sub">{dateStr}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/production" className="btn btn-secondary">+ Production</Link>
          <Link href="/orders" className="btn btn-primary">+ New Order</Link>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="empty-state" style={{ paddingTop: 96 }}>
            <div style={{ width: 32, height: 32, border: "3px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <p>Loading dashboard…</p>
          </div>
        ) : (
          <>
            {/* Greeting */}
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
                {greeting} 👋
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>
                Here's your factory overview for today
              </p>
            </div>

            {/* Today's quick snapshot */}
            <div style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(124,58,237,0.05) 100%)",
              border: "1px solid rgba(124,58,237,0.3)",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              gap: 40,
              alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Today's Production</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)", fontVariantNumeric: "tabular-nums", lineHeight: 1.2, marginTop: 2 }}>
                  {(data?.todayProductionKgs || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })} kg
                </div>
                {data?.todayProductionKgs === 0 && (
                  <Link href="/production" style={{ fontSize: 12, color: "var(--accent)", opacity: 0.7 }}>Record today's production →</Link>
                )}
              </div>
              <div style={{ width: 1, height: 48, background: "var(--border)" }} />
              <div>
                <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Collected Today</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--positive)", fontVariantNumeric: "tabular-nums", lineHeight: 1.2, marginTop: 2 }}>
                  {formatINR(data?.collectedToday || 0)}
                </div>
                {data?.collectedToday === 0 && (
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>No payments yet today</span>
                )}
              </div>
              <div style={{ width: 1, height: 48, background: "var(--border)" }} />
              <div>
                <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Outstanding Balance</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: (data?.totalOutstanding || 0) > 0 ? "var(--negative)" : "var(--positive)", fontVariantNumeric: "tabular-nums", lineHeight: 1.2, marginTop: 2 }}>
                  {formatINR(data?.totalOutstanding || 0)}
                </div>
                <Link href="/orders" style={{ fontSize: 12, color: "var(--accent)", opacity: 0.7 }}>View all orders →</Link>
              </div>
            </div>

            {/* KPI grid */}
            <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                {
                  label: "Opening Balance",
                  value: formatINR(data?.openingBalance || 0),
                  sub: "Account balances",
                  color: undefined,
                },
                {
                  label: "Production (MTD)",
                  value: `${(data?.productionThisMonth || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })} kg`,
                  sub: `Avg ${(data?.productionAvgPerDay || 0).toFixed(1)} kg/day`,
                  color: "var(--accent)",
                },
                {
                  label: "Orders (MTD)",
                  value: String(data?.ordersThisMonth || 0),
                  sub: formatINR(data?.ordersRevenueMTD || 0) + " value",
                  color: undefined,
                },
                {
                  label: "Revenue (MTD)",
                  value: formatINR(data?.revenueMTD || 0),
                  sub: "Invoices sent & paid",
                  color: "var(--positive)",
                },
                {
                  label: "Tracker Expenses",
                  value: formatINR(data?.trackerMTD || 0),
                  sub: "Named expenses MTD",
                  color: "var(--negative)",
                },
                {
                  label: "Balance Due",
                  value: formatINR(data?.totalOutstanding || 0),
                  sub: "Pending & partial orders",
                  color: (data?.totalOutstanding || 0) > 0 ? "var(--negative)" : "var(--positive)",
                },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="kpi-card">
                  <div className="kpi-label">{label}</div>
                  <div className="kpi-value" style={{ fontSize: 18, color: color || "var(--text-1)" }}>{value}</div>
                  <div className="kpi-trend">{sub}</div>
                </div>
              ))}
            </div>

            {/* Main content grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>

              {/* Left column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Recent Orders */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Recent Orders</span>
                    <Link href="/orders" className="btn btn-ghost btn-sm">View all →</Link>
                  </div>
                  {!data?.recentOrders?.length ? (
                    <div className="empty-state" style={{ padding: "24px 16px" }}>
                      <p>No orders yet.</p>
                      <Link href="/orders" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>Create First Order</Link>
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Customer</th>
                          <th>Pipes</th>
                          <th>Date</th>
                          <th style={{ textAlign: "right" }}>Total</th>
                          <th style={{ textAlign: "right" }}>Balance</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.recentOrders?.map((order) => {
                          const s = STATUS_STYLE[order.status] || { label: order.status, cls: "badge-draft" };
                          const totalPipes = order.items.reduce((s, i) => s + i.quantity, 0);
                          return (
                            <tr key={order.id}>
                              <td>
                                <Link href="/orders" style={{ color: "var(--accent)", fontWeight: 600, fontSize: 13 }}>
                                  {order.orderNumber}
                                </Link>
                              </td>
                              <td style={{ fontWeight: 500 }}>{order.customer.name}</td>
                              <td style={{ color: "var(--text-2)", fontSize: 12 }}>{totalPipes} pipes</td>
                              <td style={{ color: "var(--text-3)", fontSize: 12 }}>{formatDate(order.orderDate)}</td>
                              <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{formatINR(order.totalAmount)}</td>
                              <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: order.balanceDue > 0 ? "var(--negative)" : "var(--positive)", fontWeight: 600 }}>
                                {formatINR(order.balanceDue)}
                              </td>
                              <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Production Chart */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Monthly Production (kg)</span>
                    <Link href="/production" className="btn btn-ghost btn-sm">Full view →</Link>
                  </div>
                  <div className="card-body">
                    {data?.monthlyProduction && <MiniBarChart data={data.monthlyProduction} />}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Top debtors */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Customers Owing</span>
                  </div>
                  <div className="card-body" style={{ padding: 0 }}>
                    {!data?.topDebtors?.length || data.topDebtors.every((d) => d.balance === 0) ? (
                      <p style={{ fontSize: 13, color: "var(--positive)", padding: "16px 20px" }}>✓ All accounts settled!</p>
                    ) : (
                      data?.topDebtors?.filter((d) => d.balance > 0).map((debtor, i) => (
                        <div key={i} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 16px",
                          borderBottom: "1px solid var(--border)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: "var(--accent-muted)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--accent)",
                              flexShrink: 0,
                            }}>
                              {debtor.name[0].toUpperCase()}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{debtor.name}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--negative)", fontVariantNumeric: "tabular-nums" }}>
                            {formatINR(debtor.balance)}
                          </span>
                        </div>
                      ))
                    )}
                    <div style={{ padding: "10px 16px" }}>
                      <Link href="/orders" className="btn btn-secondary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                        All Orders
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Quick links */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Quick Actions</span>
                  </div>
                  <div className="card-body" style={{ padding: "8px 0" }}>
                    {[
                      { href: "/production", label: "Record Production", icon: "🏭" },
                      { href: "/orders", label: "New Order", icon: "📦" },
                      { href: "/tracker", label: "Add Expense", icon: "💸" },
                      { href: "/contacts", label: "Add Customer", icon: "👤" },
                      { href: "/invoices/new", label: "New Invoice", icon: "🧾" },
                    ].map((item) => (
                      <Link key={item.href} href={item.href} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 16px",
                        color: "var(--text-2)",
                        fontSize: 13,
                        transition: "background 0.1s, color 0.1s",
                      }}
                      className="nav-item"
                      >
                        <span>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
