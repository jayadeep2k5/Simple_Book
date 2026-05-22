"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ── Inline SVG Icons ───────────────────────────────────────────────────── */
const Icon = {
  Dashboard: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  ),
  Invoice: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2h10v12l-2-1.5L9 14l-2-1.5L5 14l-2-1.5V2z" />
      <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" />
    </svg>
  ),
  Expense: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3l2 2" />
      <path d="M5.5 10.5l5-5" />
    </svg>
  ),
  Payment: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="14" height="10" rx="1.5" />
      <path d="M1 7h14" />
      <path d="M4 10.5h2M10 10.5h2" />
    </svg>
  ),
  Accounts: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 13V5l6-3 6 3v8" />
      <path d="M6 13V9h4v4" />
    </svg>
  ),
  Ledger: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="1" width="12" height="14" rx="1" />
      <path d="M5 5h6M5 8h6M5 11h4" />
    </svg>
  ),
  Contacts: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1 14c0-3 2-5 5-5s5 2 5 5" />
      <path d="M11 7.5c1.5 0 3 .8 3 3" />
      <circle cx="11" cy="5" r="1.5" />
    </svg>
  ),
  GST: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1l7 4v6l-7 4-7-4V5z" />
      <path d="M8 1v14M1 5l7 4 7-4" />
    </svg>
  ),
  Reports: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 14V2" />
      <path d="M2 11l4-4 3 3 5-6" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" />
    </svg>
  ),
  Rupee: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3h8M4 6h8M8 6l-4 7" />
      <path d="M4 6c0 2.2 1.8 4 4 4" />
    </svg>
  ),
};

/* ── Nav config ─────────────────────────────────────────────────────────── */
const sections = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: Icon.Dashboard }],
  },
  {
    label: "Transactions",
    items: [
      { href: "/invoices",  label: "Invoices",  icon: Icon.Invoice  },
      { href: "/expenses",  label: "Expenses",  icon: Icon.Expense  },
      { href: "/payments",  label: "Payments",  icon: Icon.Payment  },
    ],
  },
  {
    label: "Accounting",
    items: [
      { href: "/accounts",  label: "Chart of Accounts", icon: Icon.Accounts  },
      { href: "/ledger",    label: "Ledger",            icon: Icon.Ledger    },
      { href: "/contacts",  label: "Contacts",          icon: Icon.Contacts  },
    ],
  },
  {
    label: "Compliance",
    items: [
      { href: "/gst",     label: "GST Returns", icon: Icon.GST     },
      { href: "/reports", label: "Reports",     icon: Icon.Reports },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", label: "Settings", icon: Icon.Settings }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [company, setCompany] = useState<{ name: string; gstin?: string }>({ name: "Loading…" });

  useEffect(() => {
    fetch("/api/company")
      .then((r) => r.json())
      .then((d) => { if (d.name) setCompany(d); })
      .catch(() => {});
  }, []);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <Icon.Rupee />
        </div>
        <div>
          <div className="sidebar-logo-text">BaaS</div>
          <div className="sidebar-logo-sub">Books as a Service</div>
        </div>
      </div>

      {/* Company */}
      <div className="sidebar-company">
        <div className="sidebar-company-name">{company.name}</div>
        {company.gstin && (
          <div className="sidebar-company-gstin">GST {company.gstin}</div>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {sections.map((sec) => (
          <div key={sec.label}>
            <div className="nav-section-title">{sec.label}</div>
            {sec.items.map(({ href, label, icon: NavIcon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link key={href} href={href} className={`nav-item ${active ? "active" : ""}`}>
                  <span className="nav-icon"><NavIcon /></span>
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">GST Compliant · AY 2024‑25</div>
    </aside>
  );
}
