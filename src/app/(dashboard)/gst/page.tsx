"use client";

import { useState, useEffect } from "react";
import { formatINR, formatDate, getGSTReturnPeriods } from "@/lib/utils";

export default function GSTPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("gstr1");
  const [period, setPeriod] = useState("");
  const periods = getGSTReturnPeriods();

  useEffect(() => { if (periods.length > 0) setPeriod(periods[0].value); }, []);

  const fetchReport = async () => {
    if (!period) return;
    setLoading(true);
    const [year, month] = period.split("-");
    const from = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const to = `${year}-${month}-${lastDay}`;
    const res = await fetch(`/api/reports?type=${reportType}&from=${from}&to=${to}`);
    setData(await res.json());
    setLoading(false);
  };

  const exportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${reportType}-${period}.json`;
    a.click();
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          GST Returns
          <div className="topbar-sub">Prepare and export GSTR-1 & GSTR-3B</div>
        </div>
        {data && (
          <button onClick={exportJSON} className="btn btn-secondary">Export JSON</button>
        )}
      </div>

      <div className="page-content">
        {/* Period calendar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          {periods.slice(0, 3).map((p) => (
            <div key={p.value} className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 500, fontSize: 13, color: "var(--text-1)" }}>{p.label}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>GSTR-1 due: {p.dueDate}</div>
              <div style={{ marginTop: 8 }}>
                <span className="badge badge-draft">Pending</span>
              </div>
            </div>
          ))}
        </div>

        {/* Report generator */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Generate GST Report</span>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 24 }}>
              <div className="form-group">
                <label className="form-label">Return Type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ value: "gstr1", label: "GSTR-1" }, { value: "gstr3b", label: "GSTR-3B" }].map((rt) => (
                    <button key={rt.value} onClick={() => setReportType(rt.value)}
                      className={`btn btn-sm ${reportType === rt.value ? "btn-primary" : "btn-secondary"}`}>
                      {rt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Period</label>
                <select className="form-input form-select" value={period} onChange={(e) => setPeriod(e.target.value)} style={{ minWidth: 180 }}>
                  {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <button onClick={fetchReport} className="btn btn-primary" disabled={loading}>
                {loading ? "Generating…" : "Generate Report"}
              </button>
            </div>

            {/* GSTR-1 results */}
            {data && data.type === "gstr1" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
                  {[
                    { label: "Total Invoices", value: (data.summary.totalB2B + data.summary.totalB2C).toString() },
                    { label: "Taxable Value", value: formatINR(data.summary.totalTaxableValue) },
                    { label: "Total GST", value: formatINR(data.summary.totalTax) },
                    { label: "B2B Invoices", value: String(data.summary.totalB2B) },
                  ].map(({ label, value }) => (
                    <div key={label} className="kpi-card">
                      <div className="kpi-label">{label}</div>
                      <div className="kpi-value" style={{ fontSize: 20 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {data.b2b.length > 0 && (
                  <>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: "var(--text-2)" }}>B2B Invoices (Registered)</div>
                    <table className="data-table" style={{ marginBottom: 24 }}>
                      <thead>
                        <tr>
                          <th>Invoice #</th><th>Date</th><th>GSTIN</th><th>Customer</th>
                          <th>POS</th><th style={{ textAlign: "right" }}>Taxable</th>
                          <th style={{ textAlign: "right" }}>CGST</th><th style={{ textAlign: "right" }}>SGST</th>
                          <th style={{ textAlign: "right" }}>IGST</th><th style={{ textAlign: "right" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.b2b.map((inv: any) => (
                          <tr key={inv.invoiceNumber}>
                            <td><span className="mono" style={{ color: "var(--accent)", fontSize: 12 }}>{inv.invoiceNumber}</span></td>
                            <td style={{ color: "var(--text-3)", fontSize: 12 }}>{formatDate(inv.invoiceDate)}</td>
                            <td className="mono" style={{ fontSize: 11 }}>{inv.customerGstin}</td>
                            <td style={{ color: "var(--text-2)" }}>{inv.customerName}</td>
                            <td style={{ color: "var(--text-3)" }}>{inv.placeOfSupply || "—"}</td>
                            <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatINR(inv.taxableValue)}</td>
                            <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatINR(inv.cgst)}</td>
                            <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatINR(inv.sgst)}</td>
                            <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatINR(inv.igst)}</td>
                            <td style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatINR(inv.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {data.b2c.length > 0 && (
                  <>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: "var(--text-2)" }}>B2C Invoices (Unregistered)</div>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Invoice #</th><th>Date</th><th>Customer</th>
                          <th style={{ textAlign: "right" }}>Taxable</th><th style={{ textAlign: "right" }}>GST</th><th style={{ textAlign: "right" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.b2c.map((inv: any) => (
                          <tr key={inv.invoiceNumber}>
                            <td><span className="mono" style={{ color: "var(--accent)", fontSize: 12 }}>{inv.invoiceNumber}</span></td>
                            <td style={{ color: "var(--text-3)", fontSize: 12 }}>{formatDate(inv.invoiceDate)}</td>
                            <td style={{ color: "var(--text-2)" }}>{inv.customerName}</td>
                            <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatINR(inv.taxableValue)}</td>
                            <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatINR(inv.cgst + inv.sgst + inv.igst)}</td>
                            <td style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatINR(inv.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {data.b2b.length === 0 && data.b2c.length === 0 && (
                  <div style={{ textAlign: "center", padding: 32, color: "var(--text-3)" }}>No invoices in this period.</div>
                )}
              </>
            )}

            {/* GSTR-3B results */}
            {data && data.type === "gstr3b" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: "var(--text-2)" }}>3.1 Outward Supplies (Sales)</div>
                  <table className="data-table">
                    <tbody>
                      {[
                        ["Taxable Value", data.outwardSupplies.taxableValue],
                        ["CGST", data.outwardSupplies.cgst],
                        ["SGST", data.outwardSupplies.sgst],
                        ["IGST", data.outwardSupplies.igst],
                        ["Total Output Tax", data.outwardSupplies.totalTax],
                      ].map(([k, v]) => (
                        <tr key={String(k)}>
                          <td style={{ color: "var(--text-2)" }}>{k}</td>
                          <td style={{ textAlign: "right", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatINR(Number(v))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: "var(--text-2)" }}>4. ITC & Net Tax Payable</div>
                  <table className="data-table">
                    <tbody>
                      {[
                        ["ITC Claimed (Input Tax)", data.inwardSupplies.itcClaimed],
                        ["Net GST Payable", data.netGstPayable],
                        ["GST Refund (if any)", data.netGstRefund],
                      ].map(([k, v]) => (
                        <tr key={String(k)}>
                          <td style={{ color: "var(--text-2)" }}>{k}</td>
                          <td style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums",
                            color: k === "Net GST Payable" ? "var(--negative)" : "var(--text-1)" }}>
                            {formatINR(Number(v))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--bg-elevated)", borderRadius: "var(--r-md)", fontSize: 12, color: "var(--text-3)", border: "1px solid var(--border)" }}>
                    Reference only. File actual returns on the GST portal.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
