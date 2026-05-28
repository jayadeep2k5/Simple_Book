"use client";

import { useState, useEffect, useMemo } from "react";

// ─── Pipe catalog ──────────────────────────────────────────────────────────
const PIPE_TYPES = [
  // PVC Pipes (20 ft, Pasting only)
  { label: "PVC 110mm (20ft)", type: "PVC", size: "110mm", weightKg: 6.0, length: "20ft" },
  { label: "PVC 90mm (20ft)",  type: "PVC", size: "90mm",  weightKg: 5.0, length: "20ft" },
  { label: "PVC 75mm (20ft)",  type: "PVC", size: "75mm",  weightKg: 3.8, length: "20ft" },
  { label: "PVC 63mm (20ft)",  type: "PVC", size: "63mm",  weightKg: 2.8, length: "20ft" },
  { label: "PVC 50mm (20ft)",  type: "PVC", size: "50mm",  weightKg: 2.0, length: "20ft" },
  { label: "PVC 40mm (20ft)",  type: "PVC", size: "40mm",  weightKg: 1.8, length: "20ft" },
  // SWR White (10 ft, Ring Fit & Pasting)
  { label: "SWR White 110mm (10ft)", type: "SWR White", size: "110mm", weightKg: 2.8, length: "10ft" },
  { label: "SWR White 75mm (10ft)",  type: "SWR White", size: "75mm",  weightKg: 1.8, length: "10ft" },
  { label: "SWR White 63mm (10ft)",  type: "SWR White", size: "63mm",  weightKg: 1.3, length: "10ft" },
  { label: "SWR White 50mm (10ft)",  type: "SWR White", size: "50mm",  weightKg: 1.1, length: "10ft" },
  { label: "SWR White 40mm (10ft)",  type: "SWR White", size: "40mm",  weightKg: 1.0, length: "10ft" },
  // Red Pipes (10 ft, Ring Fit & Pasting)
  { label: "Red 160mm (10ft)", type: "Red", size: "160mm", weightKg: 6.5, length: "10ft" },
  { label: "Red 110mm (10ft)", type: "Red", size: "110mm", weightKg: 3.5, length: "10ft" },
  { label: "Red 75mm (10ft)",  type: "Red", size: "75mm",  weightKg: 2.0, length: "10ft" },
];

const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CHEQUE", "UPI", "OTHER"];

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
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

interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  customer: { id: string; name: string; phone?: string };
  items: Array<{ id: string; pipeType: string; quantity: number; ratePerPipe: number; weightPerPipe: number; amount: number }>;
  payments: Array<{ id: string; amount: number; paidOn: string; method: string; notes?: string }>;
}

interface Contact { id: string; name: string; phone?: string; }

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

// ─── New Order Modal ───────────────────────────────────────────────────────
function NewOrderModal({ contacts, onClose, onSaved }: {
  contacts: Contact[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    customerId: "",
    orderDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [items, setItems] = useState([
    { id: "1", pipeType: PIPE_TYPES[0].label, quantity: 1, ratePerPipe: 0, weightPerPipe: PIPE_TYPES[0].weightKg },
  ]);
  const [saving, setSaving] = useState(false);

  const totalAmount = items.reduce((s, i) => s + i.quantity * i.ratePerPipe, 0);

  const updateItem = (id: string, field: string, value: any) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === "pipeType") {
        const pipe = PIPE_TYPES.find((p) => p.label === value);
        if (pipe) updated.weightPerPipe = pipe.weightKg;
      }
      return updated;
    }));
  };

  const handleSubmit = async () => {
    if (!form.customerId) return;
    setSaving(true);
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items }),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-box-xl">
        <div className="modal-header">
          <span className="modal-title">New Order</span>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><CloseIcon /></button>
        </div>
        <div className="modal-body">
          {/* Header fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Customer *</label>
              <select className="form-input form-select" value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                <option value="">Select customer…</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Order Date</label>
              <input type="date" className="form-input" value={form.orderDate}
                onChange={(e) => setForm({ ...form, orderDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" placeholder="Optional" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          {/* Pipe items */}
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-2)", marginBottom: 8 }}>
            Pipe Items
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Pipe Type", "Qty (pipes)", "Rate / Pipe (₹)", "Weight/Pipe (kg)", "Amount"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "4px 6px", fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
                <th style={{ width: 32 }} />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: "3px 4px", minWidth: 220 }}>
                    <select className="form-input form-select" style={{ fontSize: 13 }} value={item.pipeType}
                      onChange={(e) => updateItem(item.id, "pipeType", e.target.value)}>
                      {PIPE_TYPES.map((p) => <option key={p.label} value={p.label}>{p.label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "3px 4px", width: 80 }}>
                    <input type="number" className="form-input" style={{ fontSize: 13 }} value={item.quantity} min={1}
                      onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)} />
                  </td>
                  <td style={{ padding: "3px 4px", width: 120 }}>
                    <input type="number" className="form-input" style={{ fontSize: 13 }} value={item.ratePerPipe} min={0}
                      onChange={(e) => updateItem(item.id, "ratePerPipe", parseFloat(e.target.value) || 0)} />
                  </td>
                  <td style={{ padding: "3px 4px", width: 120 }}>
                    <input type="number" className="form-input" style={{ fontSize: 13, color: "var(--text-3)" }}
                      value={item.weightPerPipe} readOnly />
                  </td>
                  <td style={{ padding: "3px 8px", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--text-1)", minWidth: 100 }}>
                    {formatINR(item.quantity * item.ratePerPipe)}
                  </td>
                  <td style={{ padding: "3px 4px" }}>
                    {items.length > 1 && (
                      <button onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                        className="btn btn-ghost btn-icon btn-sm" style={{ color: "var(--negative)" }}>
                        <CloseIcon />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <button
              onClick={() => setItems((prev) => [...prev, {
                id: String(Date.now()), pipeType: PIPE_TYPES[0].label, quantity: 1,
                ratePerPipe: 0, weightPerPipe: PIPE_TYPES[0].weightKg,
              }])}
              className="btn btn-secondary btn-sm"
            >
              <PlusIcon /> Add Pipe
            </button>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
              Total: {formatINR(totalAmount)}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={saving || !form.customerId}>
            {saving ? "Saving…" : "Create Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Record Payment Modal ──────────────────────────────────────────────────
function PaymentModal({ order, onClose, onSaved }: {
  order: Order;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    amount: order.balanceDue.toFixed(2),
    method: "CASH",
    notes: "",
    paidOn: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await fetch(`/api/orders/${order.id}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <span className="modal-title">Record Payment — {order.orderNumber}</span>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><CloseIcon /></button>
        </div>
        <div className="modal-body">
          <div style={{ background: "var(--bg-elevated)", borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--text-2)" }}>Order Total</span>
              <span style={{ fontWeight: 600 }}>{formatINR(order.totalAmount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 4 }}>
              <span style={{ color: "var(--text-2)" }}>Already Paid</span>
              <span style={{ color: "var(--positive)", fontWeight: 600 }}>{formatINR(order.amountPaid)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-1)", fontWeight: 600 }}>Balance Due</span>
              <span style={{ color: "var(--negative)", fontWeight: 700 }}>{formatINR(order.balanceDue)}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Amount Received (₹) *</label>
              <input type="number" className="form-input" value={form.amount} step="0.01" min="0"
                max={order.balanceDue} style={{ fontSize: 18, fontWeight: 600 }}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-input form-select" value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.paidOn}
                onChange={(e) => setForm({ ...form, paidOn: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" placeholder="Reference / remarks"
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={saving || !form.amount}>
            {saving ? "Saving…" : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order Detail Panel ────────────────────────────────────────────────────
function OrderDetailPanel({ order, onPayment, onClose }: {
  order: Order;
  onPayment: () => void;
  onClose: () => void;
}) {
  const s = STATUS_STYLE[order.status] || { label: order.status, cls: "badge-draft" };
  const totalPipes = order.items.reduce((s, i) => s + i.quantity, 0);
  const totalWeight = order.items.reduce((s, i) => s + i.quantity * i.weightPerPipe, 0);

  return (
    <div style={{
      background: "var(--bg-surface)",
      borderLeft: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>{order.orderNumber}</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{formatDate(order.orderDate)} · {order.customer.name}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className={`badge ${s.cls}`}>{s.label}</span>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><CloseIcon /></button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Amount summary */}
        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, borderBottom: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{formatINR(order.totalAmount)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Paid</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--positive)", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{formatINR(order.amountPaid)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Balance</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: order.balanceDue > 0 ? "var(--negative)" : "var(--positive)", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
              {formatINR(order.balanceDue)}
            </div>
          </div>
        </div>

        {/* Pipe items */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Pipe Items — {totalPipes} pipes · {totalWeight.toFixed(1)} kg
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Pipe", "Qty", "Rate", "Amount"].map((h) => (
                  <th key={h} style={{ fontSize: 11, color: "var(--text-3)", textAlign: "left", padding: "3px 6px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 6px", fontSize: 13 }}>{item.pipeType}</td>
                  <td style={{ padding: "8px 6px", fontSize: 13, fontWeight: 600 }}>{item.quantity}</td>
                  <td style={{ padding: "8px 6px", fontSize: 13, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>₹{item.ratePerPipe.toFixed(0)}</td>
                  <td style={{ padding: "8px 6px", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatINR(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment history */}
        <div style={{ padding: "14px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Payment History ({order.payments.length})
          </div>
          {order.payments.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>No payments recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {order.payments.map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-elevated)", borderRadius: 8, padding: "8px 12px" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--positive)", fontVariantNumeric: "tabular-nums" }}>{formatINR(p.amount)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{p.method.replace("_", " ")} · {formatDate(p.paidOn)}</div>
                    {p.notes && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{p.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      {order.status !== "PAID" && order.status !== "CANCELLED" && (
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
          <button onClick={onPayment} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            Record Payment
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const fetchOrders = () => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    fetch("/api/contacts?type=CUSTOMER").then((r) => r.json()).then(setContacts);
  }, []);

  // Refresh selected order after update
  const refreshSelected = (id: string) => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((updated) => {
        setSelectedOrder(updated);
        setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      });
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch = !search ||
        o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
        o.orderNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  // Global stats
  const totalOutstanding = orders.reduce((s, o) => (o.status !== "PAID" && o.status !== "CANCELLED" ? s + o.balanceDue : s), 0);
  const totalRevenue = orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.totalAmount, 0);
  const paidOrders = orders.filter((o) => o.status === "PAID").length;

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Customer Orders
          <div className="topbar-sub">{orders.length} orders · {formatINR(totalRevenue)} total revenue</div>
        </div>
        <button onClick={() => setShowNewOrder(true)} className="btn btn-primary">
          <PlusIcon /> New Order
        </button>
      </div>

      {/* Stats */}
      <div style={{ padding: "16px 32px 0", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Orders</div>
          <div className="kpi-value">{orders.length}</div>
          <div className="kpi-trend">{paidOrders} fully paid</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Revenue</div>
          <div className="kpi-value">{formatINR(totalRevenue)}</div>
          <div className="kpi-trend">All orders combined</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Collected</div>
          <div className="kpi-value" style={{ color: "var(--positive)" }}>
            {formatINR(orders.reduce((s, o) => s + o.amountPaid, 0))}
          </div>
          <div className="kpi-trend">Payments received</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Outstanding Balance</div>
          <div className="kpi-value" style={{ color: totalOutstanding > 0 ? "var(--negative)" : "var(--positive)" }}>
            {formatINR(totalOutstanding)}
          </div>
          <div className="kpi-trend">To be collected</div>
        </div>
      </div>

      {/* Main split pane */}
      <div style={{
        margin: "16px 32px",
        display: "grid",
        gridTemplateColumns: selectedOrder ? "1fr 380px" : "1fr",
        gap: 0,
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        minHeight: 500,
      }}>
        {/* Left: order list */}
        <div style={{ display: "flex", flexDirection: "column", borderRight: selectedOrder ? "1px solid var(--border)" : "none" }}>
          {/* Filters */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10 }}>
            <input
              className="form-input"
              placeholder="Search orders / customers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <select className="form-input form-select" style={{ width: 130 }} value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Status</option>
              {Object.entries(STATUS_STYLE).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Orders table */}
          {loading ? (
            <div className="empty-state"><p>Loading…</p></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: 15, color: "var(--text-2)" }}>No orders found.</p>
              {!search && <button onClick={() => setShowNewOrder(true)} className="btn btn-primary" style={{ marginTop: 8 }}>
                Create First Order
              </button>}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Pipes</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th style={{ textAlign: "right" }}>Paid</th>
                  <th style={{ textAlign: "right" }}>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const s = STATUS_STYLE[order.status] || { label: order.status, cls: "badge-draft" };
                  const totalPipes = order.items.reduce((s, i) => s + i.quantity, 0);
                  const isSelected = selectedOrder?.id === order.id;
                  return (
                    <tr key={order.id}
                      onClick={() => setSelectedOrder(isSelected ? null : order)}
                      style={{ cursor: "pointer", background: isSelected ? "var(--accent-muted)" : undefined }}>
                      <td style={{ color: "var(--accent)", fontWeight: 600, fontSize: 13 }}>{order.orderNumber}</td>
                      <td style={{ fontWeight: 500 }}>{order.customer.name}</td>
                      <td style={{ color: "var(--text-3)", fontSize: 12 }}>{formatDate(order.orderDate)}</td>
                      <td style={{ color: "var(--text-2)", fontSize: 12 }}>
                        {totalPipes} pipe{totalPipes !== 1 ? "s" : ""}
                        <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                          {order.items.map((i) => i.pipeType.split(" ").slice(0, 2).join(" ")).join(", ")}
                        </div>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatINR(order.totalAmount)}</td>
                      <td style={{ textAlign: "right", color: "var(--positive)", fontVariantNumeric: "tabular-nums" }}>{formatINR(order.amountPaid)}</td>
                      <td style={{ textAlign: "right", color: order.balanceDue > 0 ? "var(--negative)" : "var(--text-3)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
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

        {/* Right: order detail */}
        {selectedOrder && (
          <OrderDetailPanel
            order={selectedOrder}
            onPayment={() => setShowPayment(true)}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </div>

      {/* Modals */}
      {showNewOrder && (
        <NewOrderModal
          contacts={contacts}
          onClose={() => setShowNewOrder(false)}
          onSaved={() => { setShowNewOrder(false); fetchOrders(); }}
        />
      )}
      {showPayment && selectedOrder && (
        <PaymentModal
          order={selectedOrder}
          onClose={() => setShowPayment(false)}
          onSaved={() => {
            setShowPayment(false);
            refreshSelected(selectedOrder.id);
            fetchOrders();
          }}
        />
      )}
    </>
  );
}
