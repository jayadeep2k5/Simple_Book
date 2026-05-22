# 📒 Book-keep

> A full-featured bookkeeping & invoicing web application built for Indian businesses — with GST compliance, double-entry accounting, and PDF invoice generation.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-local%20DB-003B57?style=flat-square&logo=sqlite)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38BDF8?style=flat-square&logo=tailwindcss)

---

## ✨ Features

| Module | Capabilities |
|---|---|
| 🧾 **Invoicing** | Create, send, and track GST-compliant invoices with CGST/SGST/IGST split |
| 💸 **Expenses** | Record purchase bills, categorise expenses, track payment status |
| 💳 **Payments** | Log payments via Cash, Bank Transfer, UPI, Cheque, or Card |
| 📒 **Ledger** | Full double-entry journal with automatic entries for every transaction |
| 📊 **Dashboard** | Key financial KPIs — revenue, outstanding dues, expense trends |
| 📈 **Reports** | P&L, balance sheet, and tax summary reports |
| 🏦 **Chart of Accounts** | Hierarchical accounts (Assets, Liabilities, Equity, Income, Expenses) |
| 👥 **Contacts** | Manage customers and vendors with GST/PAN details |
| 🇮🇳 **GST Module** | GSTR-ready tax breakdown with HSN/SAC codes and inter-state detection |
| ⚙️ **Settings** | Company profile, GSTIN, PAN, financial year configuration |

---

## 🛠 Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org) (App Router)
- **Language** — TypeScript 5
- **Database** — SQLite via [Prisma ORM](https://www.prisma.io) (better-sqlite3 adapter)
- **Styling** — Tailwind CSS 4
- **Charts** — [Recharts](https://recharts.org)
- **Icons** — [Lucide React](https://lucide.dev)
- **PDF Generation** — [jsPDF](https://github.com/parallax/jsPDF)
- **Date Utilities** — [date-fns](https://date-fns.org)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 18
- npm ≥ 9

### 1. Clone the repository

```bash
git clone https://github.com/jayadeep2k5/Book-keep.git
cd Book-keep
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

```bash
npm run db:setup
```

This will:
- Generate the Prisma client
- Push the schema to SQLite
- Seed the database with sample data (company, accounts, contacts, invoices)

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # All main app pages (sidebar layout)
│   │   ├── dashboard/        # KPI overview
│   │   ├── invoices/         # Invoice list, create, detail view
│   │   ├── expenses/         # Expense / purchase bills
│   │   ├── payments/         # Payment recording
│   │   ├── ledger/           # General ledger / journal entries
│   │   ├── accounts/         # Chart of accounts
│   │   ├── contacts/         # Customers & vendors
│   │   ├── gst/              # GST reports & tax summary
│   │   ├── reports/          # Financial reports
│   │   └── settings/         # Company settings
│   └── api/                  # Next.js API routes (REST)
├── components/
│   └── Sidebar.tsx           # Navigation sidebar
└── lib/
    ├── prisma.ts             # Prisma client singleton
    └── utils.ts              # Shared utilities
prisma/
├── schema.prisma             # Database schema
└── seed.ts                   # Seed script with sample data
```

---

## 🗄 Database Scripts

| Command | Description |
|---|---|
| `npm run db:setup` | Generate client + push schema + seed data |
| `npm run db:seed` | Re-run seed data only |
| `npm run db:reset` | Force-reset DB and re-seed (⚠️ deletes all data) |

---

## 🇮🇳 GST Compliance

Book-keep is built with Indian GST requirements in mind:

- **CGST + SGST** for intra-state transactions
- **IGST** for inter-state transactions (auto-detected by place of supply)
- **HSN / SAC codes** on invoice line items
- **GSTIN & PAN** fields for company and contacts
- Tax rates configurable (0%, 5%, 12%, 18%, 28%)
- GSTR-ready tax breakdown view

---

## 📋 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run db:setup   # Initialize database
npm run db:reset   # Reset database (⚠️ destructive)
npm run db:seed    # Seed sample data
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">Built with ❤️ for Indian SMEs</p>
