"use client";

import { useState, useEffect } from "react";
import { formatINR } from "@/lib/utils";

const REPORT_TYPES = [
  { value: "pl", label: "Profit & Loss" },
  { value: "tb", label: "Trial Balance" },
];

const TYPE_BADGE: Record<string, string> = {
  ASSET: "badge-asset", LIABILITY: "badge-liability",
  EQUITY: "badge-equity", INCOME: "badge-income", EXPENSE: "badge-expense",
};

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("pl");
  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear()}-04-01`);
  const [to, setTo] = useState(now.toISOString().split("T")[0]);

  const fetchReport = async () => {
    setLoading(true);
    const res = await fetch(`/api/reports?type=${reportType}&from=${from}&to=${to}`);
    setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, [reportType]);

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Reports
          <div className="topbar-sub">Financial statements & analysis</div>
        </div>
        <button onClick={() => window.print()} className="btn btn-secondary">Print</button>
      </div>

      <div className="page-content">
        {/* Controls */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className="form-group">
                <label className="form-label">Report Type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {REPORT_TYPES.map((rt) => (
                    <button key={rt.value} onClick={() => setReportType(rt.value)}
                      className={`btn btn-sm ${reportType === rt.value ? "btn-primary" : "btn-secondary"}`}>
                      {rt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">From</label>
                <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">To</label>
                <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <button onClick={fetchReport} className="btn btn-primary" disabled={loading}>
                {loading ? "Running…" : "Run Report"}
              </button>
            </div>
          </div>
        </div>

        {loading && <div style={{ textAlign: "center", padding: 48, color: "var(--text-3)" }}>Generating…</div>}

        {/* P&L */}
        {!loading && data?.type === "pl" && (
          <div className="card" style={{ maxWidth: 720 }}>
            <div className="card-header">
              <div>
                <div className="card-title">Profit & Loss Statement</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                  {fmtDate(data.period.from)} – {fmtDate(data.period.to)}
                </div>
              </div>
            </div>
            <div className="card-body">
              {/* Income section */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--positive)", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                  Income
                </div>
                {[
                  { label: "Sales Revenue (Net of GST)", value: data.income.salesRevenue },
                  { label: "GST Collected", value: data.income.gstCollected },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                    <span style={{ color: "var(--text-2)" }}>{label}</span>
                    <span className="mono" style={{ fontWeight: 500 }}>{formatINR(value)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 6px", fontWeight: 600, borderTop: "1px solid var(--border)", marginTop: 4 }}>
                  <span>Total Income</span>
                  <span className="mono" style={{ color: "var(--positive)", fontSize: 15 }}>{formatINR(data.income.total)}</span>
                </div>
              </div>

              {/* Expenses section */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--negative)", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                  Expenses
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                  <span style={{ color: "var(--text-2)" }}>Total Expenses</span>
                  <span className="mono" style={{ fontWeight: 500 }}>{formatINR(data.expenses.total)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 6px", fontWeight: 600, borderTop: "1px solid var(--border)", marginTop: 4 }}>
                  <span>Total Expenses</span>
                  <span className="mono" style={{ color: "var(--negative)", fontSize: 15 }}>{formatINR(data.expenses.total)}</span>
                </div>
              </div>

              {/* Net profit */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "16px", borderRadius: "var(--r-md)",
                background: data.netProfit >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${data.netProfit >= 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
              }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Net {data.netProfit >= 0 ? "Profit" : "Loss"}</span>
                <span className="mono" style={{ fontWeight: 700, fontSize: 22, color: data.netProfit >= 0 ? "var(--positive)" : "var(--negative)" }}>
                  {formatINR(Math.abs(data.netProfit))}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Trial Balance */}
        {!loading && data?.type === "tb" && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Trial Balance</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                  {fmtDate(data.period.from)} – {fmtDate(data.period.to)}
                </div>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th style={{ textAlign: "right" }}>Opening</th>
                  <th style={{ textAlign: "right" }}>Debit</th>
                  <th style={{ textAlign: "right" }}>Credit</th>
                  <th style={{ textAlign: "right" }}>Closing</th>
                </tr>
              </thead>
              <tbody>
                {data.rows?.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-3)" }}>No journal entries in this period.</td></tr>
                )}
                {data.rows?.map((row: any) => (
                  <tr key={row.code}>
                    <td><span className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>{row.code}</span></td>
                    <td style={{ fontWeight: 500 }}>{row.name}</td>
                    <td><span className={`badge ${TYPE_BADGE[row.type] || "badge-draft"}`} style={{ fontSize: 10 }}>{row.type[0] + row.type.slice(1).toLowerCase()}</span></td>
                    <td className="mono" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatINR(row.openingBalance)}</td>
                    <td className="mono" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: row.debit > 0 ? "var(--accent)" : "var(--text-3)" }}>{formatINR(row.debit)}</td>
                    <td className="mono" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: row.credit > 0 ? "var(--positive)" : "var(--text-3)" }}>{formatINR(row.credit)}</td>
                    <td className="mono" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: row.closingBalance >= 0 ? "var(--text-1)" : "var(--negative)" }}>
                      {formatINR(Math.abs(row.closingBalance))} {row.closingBalance < 0 ? "Cr" : "Dr"}
                    </td>
                  </tr>
                ))}
              </tbody>
              {data.rows?.length > 0 && (
                <tfoot>
                  <tr style={{ fontWeight: 700, background: "var(--bg-elevated)" }}>
                    <td colSpan={4} style={{ textAlign: "right", padding: "12px 16px", borderTop: "1px solid var(--border)", color: "var(--text-2)", fontSize: 12 }}>Totals</td>
                    <td className="mono" style={{ textAlign: "right", borderTop: "1px solid var(--border)", color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{formatINR(data.totalDebit)}</td>
                    <td className="mono" style={{ textAlign: "right", borderTop: "1px solid var(--border)", color: "var(--positive)", fontVariantNumeric: "tabular-nums" }}>{formatINR(data.totalCredit)}</td>
                    <td style={{ borderTop: "1px solid var(--border)" }}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </>
  );
}
