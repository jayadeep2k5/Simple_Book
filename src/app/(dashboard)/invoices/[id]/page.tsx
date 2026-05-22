"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatINR, formatDate, numberToWords } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PAID:      { label: "Paid",      cls: "badge-paid" },
  DRAFT:     { label: "Draft",     cls: "badge-draft" },
  SENT:      { label: "Sent",      cls: "badge-sent" },
  OVERDUE:   { label: "Overdue",   cls: "badge-overdue" },
  PARTIAL:   { label: "Partial",   cls: "badge-partial" },
  CANCELLED: { label: "Cancelled", cls: "badge-cancelled" },
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  const [paying, setPaying] = useState(false);

  const fetchInvoice = () => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then(setInvoice)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoice();
    fetch("/api/company").then((r) => r.json()).then(setCompany);
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this invoice?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    router.push("/invoices");
  };

  const handlePayment = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) return;
    setPaying(true);
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(payAmount),
        method: payMethod,
        reference: payRef,
        invoiceId: id,
      }),
    });
    setPaying(false);
    setShowPayModal(false);
    fetchInvoice();
  };

  const handlePrint = () => window.print();

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-muted)" }}>
      Loading invoice...
    </div>
  );

  if (!invoice) return (
    <div style={{ padding: 40, color: "var(--rose-400)" }}>
      Invoice not found. <Link href="/invoices" style={{ color: "var(--indigo-400)" }}>Back to invoices</Link>
    </div>
  );

  const cfg = STATUS_CONFIG[invoice.status] || { label: invoice.status, cls: "badge-draft" };

  return (
    <>
      {/* Toolbar (hidden on print) */}
      <div className="topbar no-print">
        <Link href="/invoices" className="btn btn-ghost btn-sm">← Invoices</Link>
        <div style={{ flex: 1, marginLeft: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{invoice.invoiceNumber}</h1>
        </div>
        <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
        {invoice.balanceDue > 0 && (
          <button onClick={() => { setPayAmount(invoice.balanceDue.toFixed(2)); setShowPayModal(true); }} className="btn btn-primary">
            💳 Record Payment
          </button>
        )}
        <button onClick={handlePrint} className="btn btn-secondary">🖨️ Print / PDF</button>
        <button onClick={handleDelete} className="btn btn-danger">🗑 Delete</button>
      </div>

      <div className="page-content">
        {/* Invoice Document */}
        <div className="glass-card invoice-print-area" style={{ padding: "40px 48px", maxWidth: 900, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 36 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>
                TAX INVOICE
              </div>
              <span className={`badge ${cfg.cls}`} style={{ fontSize: 12 }}>{cfg.label}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{company?.name}</div>
              {company?.gstin && <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>GSTIN: {company.gstin}</div>}
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                {[company?.address, company?.city, company?.state, company?.pincode].filter(Boolean).join(", ")}
              </div>
              {company?.phone && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>📞 {company.phone}</div>}
              {company?.email && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>✉ {company.email}</div>}
            </div>
          </div>

          <div className="divider" />

          {/* Invoice Meta & Customer */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Bill To</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{invoice.contact?.name}</div>
              {invoice.contact?.gstin && <div style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-muted)" }}>GSTIN: {invoice.contact.gstin}</div>}
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                {invoice.contact?.address}{invoice.contact?.city ? `, ${invoice.contact.city}` : ""}
                {invoice.contact?.state ? `, ${invoice.contact.state}` : ""}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <table style={{ marginLeft: "auto", fontSize: 13 }}>
                <tbody>
                  {[
                    ["Invoice No.", invoice.invoiceNumber],
                    ["Invoice Date", formatDate(invoice.invoiceDate)],
                    ["Due Date", invoice.dueDate ? formatDate(invoice.dueDate) : "—"],
                    ["Place of Supply", invoice.placeOfSupply || "—"],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ color: "var(--text-muted)", paddingRight: 12, paddingBottom: 4, textAlign: "right" }}>{k}:</td>
                      <td style={{ fontWeight: 600, paddingBottom: 4 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Items Table */}
          <table className="data-table" style={{ marginBottom: 20 }}>
            <thead>
              <tr>
                <th style={{ width: 30 }}>#</th>
                <th>Description</th>
                <th>HSN/SAC</th>
                <th style={{ textAlign: "right" }}>Qty</th>
                <th>Unit</th>
                <th style={{ textAlign: "right" }}>Rate</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                {!invoice.isInterState && <th style={{ textAlign: "right" }}>CGST</th>}
                {!invoice.isInterState && <th style={{ textAlign: "right" }}>SGST</th>}
                {invoice.isInterState && <th style={{ textAlign: "right" }}>IGST</th>}
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item: any, idx: number) => (
                <tr key={item.id}>
                  <td style={{ color: "var(--text-muted)" }}>{idx + 1}</td>
                  <td style={{ fontWeight: 500 }}>
                    {item.description}
                    {item.taxRate && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>({item.taxRate.name})</div>}
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{item.hsnSac || "—"}</td>
                  <td style={{ textAlign: "right" }}>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace" }}>₹{item.rate.toFixed(2)}</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace" }}>₹{item.amount.toFixed(2)}</td>
                  {!invoice.isInterState && <td style={{ textAlign: "right", fontFamily: "monospace" }}>₹{item.cgstAmt.toFixed(2)}</td>}
                  {!invoice.isInterState && <td style={{ textAlign: "right", fontFamily: "monospace" }}>₹{item.sgstAmt.toFixed(2)}</td>}
                  {invoice.isInterState && <td style={{ textAlign: "right", fontFamily: "monospace" }}>₹{item.igstAmt.toFixed(2)}</td>}
                  <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "monospace" }}>₹{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <table style={{ minWidth: 260, fontSize: 13 }}>
              <tbody>
                {[
                  { label: "Subtotal", value: invoice.subtotal },
                  ...(!invoice.isInterState ? [
                    { label: "CGST", value: invoice.totalCgst },
                    { label: "SGST", value: invoice.totalSgst },
                  ] : [
                    { label: "IGST", value: invoice.totalIgst },
                  ]),
                  ...(invoice.roundOff !== 0 ? [{ label: "Round Off", value: invoice.roundOff }] : []),
                ].map(({ label, value }) => (
                  <tr key={label}>
                    <td style={{ color: "var(--text-muted)", paddingBottom: 6, paddingRight: 20, textAlign: "right" }}>{label}</td>
                    <td style={{ textAlign: "right", fontFamily: "monospace", paddingBottom: 6 }}>{formatINR(value)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2}><div className="divider" style={{ margin: "4px 0 8px" }} /></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, textAlign: "right", paddingRight: 20, fontSize: 15 }}>Grand Total</td>
                  <td style={{ textAlign: "right", fontWeight: 800, fontSize: 18, color: "var(--emerald-400)", fontFamily: "monospace" }}>
                    {formatINR(invoice.grandTotal)}
                  </td>
                </tr>
                {invoice.amountPaid > 0 && (
                  <>
                    <tr>
                      <td style={{ color: "var(--text-muted)", textAlign: "right", paddingRight: 20, paddingTop: 8 }}>Amount Paid</td>
                      <td style={{ textAlign: "right", color: "var(--emerald-400)", fontFamily: "monospace", paddingTop: 8 }}>
                        − {formatINR(invoice.amountPaid)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, textAlign: "right", paddingRight: 20, color: invoice.balanceDue > 0 ? "var(--amber-400)" : "var(--emerald-400)" }}>
                        Balance Due
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "monospace", color: invoice.balanceDue > 0 ? "var(--amber-400)" : "var(--emerald-400)" }}>
                        {formatINR(invoice.balanceDue)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Amount in Words */}
          <div style={{
            marginTop: 20, padding: "12px 16px",
            background: "rgba(99,102,241,0.06)", borderRadius: 8,
            fontSize: 12, color: "var(--text-muted)", fontStyle: "italic",
          }}>
            Amount in words: <strong style={{ color: "var(--text-secondary)" }}>{numberToWords(invoice.grandTotal)}</strong>
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
              {invoice.notes && (
                <div>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>Notes</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{invoice.notes}</div>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 6 }}>Terms & Conditions</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{invoice.terms}</div>
                </div>
              )}
            </div>
          )}

          {/* Payment History */}
          {invoice.payments?.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: "var(--text-secondary)" }}>Payment History</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th><th>Method</th><th>Reference</th><th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td>{formatDate(p.paymentDate)}</td>
                      <td>{p.method.replace("_", " ")}</td>
                      <td style={{ color: "var(--text-muted)" }}>{p.reference || "—"}</td>
                      <td style={{ textAlign: "right", color: "var(--emerald-400)", fontWeight: 600 }}>{formatINR(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 36, paddingTop: 20, borderTop: "1px solid var(--border-subtle)", textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>
            This is a computer-generated invoice. No signature required.
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPayModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Record Payment</h2>
              <button onClick={() => setShowPayModal(false)} className="btn btn-ghost btn-icon">✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Amount Received (₹)</label>
                  <input type="number" className="form-input" value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)} min={0} step="any" />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-input form-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                    {["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"].map((m) => (
                      <option key={m} value={m}>{m.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reference / Transaction ID</label>
                  <input className="form-input" placeholder="UPI ref, Cheque no., etc." value={payRef}
                    onChange={(e) => setPayRef(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowPayModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handlePayment} className="btn btn-primary" disabled={paying}>
                {paying ? "Recording..." : "✅ Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
