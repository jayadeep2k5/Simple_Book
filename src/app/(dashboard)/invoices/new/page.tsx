"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calculateGST, formatINR, INDIAN_STATES } from "@/lib/utils";

interface Contact { id: string; name: string; gstin?: string; state?: string; stateCode?: string; }
interface TaxRate { id: string; name: string; rate: number; cgst: number; sgst: number; igst: number; }
interface LineItem {
  id: string; description: string; hsnSac: string; quantity: number;
  unit: string; rate: number; amount: number; taxRateId: string;
  cgstAmt: number; sgstAmt: number; igstAmt: number; taxAmount: number; total: number;
}

function emptyLine(id: string): LineItem {
  return { id, description: "", hsnSac: "", quantity: 1, unit: "Nos", rate: 0, amount: 0, taxRateId: "", cgstAmt: 0, sgstAmt: 0, igstAmt: 0, taxAmount: 0, total: 0 };
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    contactId: "", invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "", placeOfSupply: "", isInterState: false,
    notes: "", terms: "Payment due within 30 days.",
  });
  const [items, setItems] = useState<LineItem[]>([emptyLine("1")]);

  useEffect(() => {
    Promise.all([
      fetch("/api/contacts?type=CUSTOMER").then((r) => r.json()),
      fetch("/api/tax-rates").then((r) => r.json()),
      fetch("/api/company").then((r) => r.json()),
    ]).then(([c, t, co]) => {
      setContacts(Array.isArray(c) ? c : []);
      setTaxRates(Array.isArray(t) ? t : []);
      setCompany(co);
      if (co?.stateCode) {
        setForm((f) => ({ ...f, placeOfSupply: co.stateCode }));
      }
    });
  }, []);

  // Auto-detect inter-state when contact changes
  const handleContactChange = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    const isInterState = contact?.stateCode && company?.stateCode
      ? contact.stateCode !== company.stateCode : false;
    setForm((f) => ({
      ...f, contactId,
      placeOfSupply: contact?.stateCode || f.placeOfSupply,
      isInterState: !!isInterState,
    }));
    // Recalculate all lines with new inter-state flag
    setItems((items) => items.map((item) => recalcLine(item, !!isInterState)));
  };

  const recalcLine = (item: LineItem, interState: boolean, overrides?: Partial<LineItem>): LineItem => {
    const merged = { ...item, ...overrides };
    const taxRate = taxRates.find((t) => t.id === merged.taxRateId);
    const amount = merged.quantity * merged.rate;
    const gst = taxRate
      ? calculateGST(amount, taxRate.rate, taxRate.cgst, taxRate.sgst, taxRate.igst, interState)
      : { cgst: 0, sgst: 0, igst: 0, total: 0 };
    return {
      ...merged,
      amount,
      cgstAmt: gst.cgst,
      sgstAmt: gst.sgst,
      igstAmt: gst.igst,
      taxAmount: gst.total,
      total: amount + gst.total,
    };
  };

  const updateLine = (id: string, field: string, value: any) => {
    setItems((items) =>
      items.map((item) =>
        item.id === id ? recalcLine(item, form.isInterState, { [field]: value }) : item
      )
    );
  };

  const addLine = () => {
    setItems((items) => [...items, emptyLine(String(Date.now()))]);
  };

  const removeLine = (id: string) => {
    setItems((items) => items.filter((i) => i.id !== id));
  };

  // Totals
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const totalCgst = items.reduce((s, i) => s + i.cgstAmt, 0);
  const totalSgst = items.reduce((s, i) => s + i.sgstAmt, 0);
  const totalIgst = items.reduce((s, i) => s + i.igstAmt, 0);
  const totalTax = items.reduce((s, i) => s + i.taxAmount, 0);
  const rawTotal = subtotal + totalTax;
  const roundOff = Math.round(rawTotal) - rawTotal;
  const grandTotal = rawTotal + roundOff;

  const handleSubmit = async (status: "DRAFT" | "SENT") => {
    if (!form.contactId) { setError("Please select a customer."); return; }
    if (items.every((i) => !i.description)) { setError("Add at least one item."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, status, items, subtotal, totalCgst, totalSgst, totalIgst,
          totalTax, roundOff, grandTotal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/invoices/${data.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <Link href="/invoices" className="btn btn-ghost btn-sm">← Invoices</Link>
        <div style={{ flex: 1, marginLeft: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>New Invoice</h1>
        </div>
        <button onClick={() => handleSubmit("DRAFT")} className="btn btn-secondary" disabled={saving}>
          Save Draft
        </button>
        <button onClick={() => handleSubmit("SENT")} className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save & Send"}
        </button>
      </div>

      <div className="page-content">
        {error && (
          <div style={{
            background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)",
            borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "var(--rose-400)",
          }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Customer & Dates */}
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Invoice Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Customer *</label>
                  <select
                    className="form-input form-select"
                    value={form.contactId}
                    onChange={(e) => handleContactChange(e.target.value)}
                  >
                    <option value="">Select customer...</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.gstin ? ` · ${c.gstin}` : ""}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: 12 }}>
                    <Link href="/contacts/new" style={{ color: "var(--indigo-400)" }}>＋ Add new customer</Link>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Invoice Date</label>
                  <input type="date" className="form-input" value={form.invoiceDate}
                    onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Place of Supply</label>
                  <select className="form-input form-select" value={form.placeOfSupply}
                    onChange={(e) => {
                      const stateCode = e.target.value;
                      const interState = company?.stateCode && stateCode !== company.stateCode;
                      setForm({ ...form, placeOfSupply: stateCode, isInterState: !!interState });
                      setItems((items) => items.map((item) => recalcLine(item, !!interState)));
                    }}>
                    <option value="">Select state...</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.code}>{s.code} – {s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Treatment</label>
                  <div style={{
                    background: form.isInterState ? "rgba(99,102,241,0.12)" : "rgba(16,185,129,0.12)",
                    border: `1px solid ${form.isInterState ? "rgba(99,102,241,0.3)" : "rgba(16,185,129,0.3)"}`,
                    borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: 500,
                    color: form.isInterState ? "var(--indigo-400)" : "var(--emerald-400)",
                  }}>
                    {form.isInterState ? "🔀 Inter-State (IGST applies)" : "✅ Intra-State (CGST + SGST)"}
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Line Items</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    <tr>
                      {["Description", "HSN/SAC", "Qty", "Unit", "Rate (₹)", "Tax Rate", "Amount", ""].map((h) => (
                        <th key={h} style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", textAlign: "left", padding: "6px 8px", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: "4px 6px", minWidth: 180 }}>
                          <input className="form-input" style={{ fontSize: 13 }} placeholder="Item / service description"
                            value={item.description} onChange={(e) => updateLine(item.id, "description", e.target.value)} />
                        </td>
                        <td style={{ padding: "4px 6px", width: 90 }}>
                          <input className="form-input" style={{ fontSize: 13 }} placeholder="HSN"
                            value={item.hsnSac} onChange={(e) => updateLine(item.id, "hsnSac", e.target.value)} />
                        </td>
                        <td style={{ padding: "4px 6px", width: 70 }}>
                          <input type="number" className="form-input" style={{ fontSize: 13, textAlign: "right" }}
                            value={item.quantity} min={0} step="any"
                            onChange={(e) => updateLine(item.id, "quantity", parseFloat(e.target.value) || 0)} />
                        </td>
                        <td style={{ padding: "4px 6px", width: 70 }}>
                          <input className="form-input" style={{ fontSize: 13 }}
                            value={item.unit} onChange={(e) => updateLine(item.id, "unit", e.target.value)} />
                        </td>
                        <td style={{ padding: "4px 6px", width: 110 }}>
                          <input type="number" className="form-input" style={{ fontSize: 13, textAlign: "right" }}
                            value={item.rate} min={0} step="any"
                            onChange={(e) => updateLine(item.id, "rate", parseFloat(e.target.value) || 0)} />
                        </td>
                        <td style={{ padding: "4px 6px", width: 140 }}>
                          <select className="form-input form-select" style={{ fontSize: 13 }}
                            value={item.taxRateId}
                            onChange={(e) => updateLine(item.id, "taxRateId", e.target.value)}>
                            <option value="">No tax</option>
                            {taxRates.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "4px 8px", width: 100, textAlign: "right", fontWeight: 600, fontFamily: "monospace", fontSize: 13 }}>
                          ₹{item.total.toFixed(2)}
                        </td>
                        <td style={{ padding: "4px 4px", width: 30 }}>
                          {items.length > 1 && (
                            <button onClick={() => removeLine(item.id)} className="btn btn-ghost btn-icon"
                              style={{ fontSize: 14, color: "var(--text-muted)" }}>✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={addLine} className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>
                ＋ Add Line Item
              </button>

              {/* Tax breakdown hint */}
              {totalTax > 0 && (
                <div style={{
                  marginTop: 12, padding: "10px 12px",
                  background: "rgba(99,102,241,0.06)", borderRadius: 8,
                  fontSize: 12, color: "var(--text-muted)",
                  display: "flex", gap: 20, flexWrap: "wrap",
                }}>
                  {!form.isInterState ? (
                    <>
                      <span>CGST: <strong style={{ color: "var(--text-primary)" }}>{formatINR(totalCgst)}</strong></span>
                      <span>SGST: <strong style={{ color: "var(--text-primary)" }}>{formatINR(totalSgst)}</strong></span>
                    </>
                  ) : (
                    <span>IGST: <strong style={{ color: "var(--text-primary)" }}>{formatINR(totalIgst)}</strong></span>
                  )}
                  <span>Total Tax: <strong style={{ color: "var(--indigo-400)" }}>{formatINR(totalTax)}</strong></span>
                </div>
              )}
            </div>

            {/* Notes & Terms */}
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-input form-textarea" placeholder="Thank you for your business!"
                    value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Terms & Conditions</label>
                  <textarea className="form-input form-textarea"
                    value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column — Summary */}
          <div className="glass-card" style={{ padding: 24, position: "sticky", top: 80 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Invoice Summary</div>

            {[
              { label: "Subtotal", value: subtotal },
              ...(form.isInterState
                ? [{ label: "IGST", value: totalIgst }]
                : [
                    { label: "CGST", value: totalCgst },
                    { label: "SGST", value: totalSgst },
                  ]),
              ...(roundOff !== 0 ? [{ label: "Round Off", value: roundOff }] : []),
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: "var(--text-secondary)" }}>
                <span>{label}</span>
                <span style={{ fontFamily: "monospace" }}>{formatINR(value)}</span>
              </div>
            ))}

            <div className="divider" />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Grand Total</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: "var(--emerald-400)", fontFamily: "monospace" }}>
                {formatINR(grandTotal)}
              </span>
            </div>

            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => handleSubmit("SENT")} className="btn btn-primary" disabled={saving} style={{ width: "100%" }}>
                {saving ? "Saving..." : "💾 Save Invoice"}
              </button>
              <button onClick={() => handleSubmit("DRAFT")} className="btn btn-secondary" disabled={saving} style={{ width: "100%" }}>
                Save as Draft
              </button>
            </div>

            <div style={{ marginTop: 16, fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
              💡 CGST/SGST applies for intra-state. IGST for inter-state transactions.
              Place of supply determines which tax applies.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
