# 📒 Simple Book

> A full-featured bookkeeping, invoicing & business management web application built for Indian businesses — with GST compliance, double-entry accounting, production tracking, and PDF invoice generation.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" />
  <img src="https://img.shields.io/badge/SQLite-Local%20DB-003B57?style=for-the-badge&logo=sqlite" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-38BDF8?style=for-the-badge&logo=tailwindcss" />
</p>

---

## ✨ Features

### 🧾 Invoicing & Sales
- Create GST-compliant invoices with automatic CGST / SGST / IGST split
- Track invoice status — Draft, Sent, Paid, Overdue
- Generate and download professional PDF invoices
- HSN / SAC codes on line items

### 📦 Orders Management
- Create and manage customer sales orders
- Link orders to invoices and track fulfillment
- Record partial or full payments against orders
- View order history and status in one place

### 🏭 Production Tracking
- Log production batches with raw material consumption
- Track finished goods output and production costs
- Monitor production status from in-progress to completed

### ⏱️ Expense & Time Tracker
- Track billable and non-billable time entries
- Categorize expenses with custom categories
- Monitor spending patterns over time

### 💸 Expenses
- Record purchase bills and vendor invoices
- Categorize expenses (rent, utilities, materials, etc.)
- Track payment status — Pending, Partial, Paid

### 💳 Payments
- Log incoming and outgoing payments
- Supports Cash, Bank Transfer, UPI, Cheque, Card
- Link payments to invoices, orders, or expenses

### 📒 Ledger & Accounting
- Full double-entry journal with automatic entries for every transaction
- View debit/credit entries with running balances
- Filter by account, date range, or transaction type

### 🏦 Chart of Accounts
- Hierarchical account structure — Assets, Liabilities, Equity, Income, Expenses
- Add and manage custom accounts
- View account balances at a glance

### 📊 Dashboard
- Real-time financial KPIs — revenue, outstanding dues, expense totals
- Visual charts for income vs. expense trends
- Recent transactions and activity feed

### 📈 Reports
- Profit & Loss statement
- Balance Sheet
- GST tax summary (GSTR-ready)
- Filterable by financial year or custom date range

### 👥 Contacts
- Manage customers and vendors in one place
- Store GSTIN, PAN, email, phone, and address
- Filter contacts by type (Customer / Vendor)

### 🇮🇳 GST Module
- GSTR-ready tax breakdown view
- Auto-detects intra-state vs inter-state from place of supply
- Configurable tax rates — 0%, 5%, 12%, 18%, 28%
- State code support for all Indian states

### ⚙️ Company Settings
- Configure company profile, GSTIN, PAN, address
- Set financial year start month
- Manage tax rates and system preferences

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router + Turbopack) |
| **Language** | TypeScript 5 |
| **Database** | SQLite via [Prisma ORM](https://www.prisma.io) (better-sqlite3) |
| **Styling** | Tailwind CSS 4 |
| **Charts** | [Recharts](https://recharts.org) |
| **Icons** | [Lucide React](https://lucide.dev) |
| **PDF Generation** | [jsPDF](https://github.com/parallax/jsPDF) |
| **Date Utilities** | [date-fns](https://date-fns.org) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 18
- npm ≥ 9

### 1. Clone the repository

```bash
git clone https://github.com/jayadeep2k5/Simple_Book.git
cd Simple_Book
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

```bash
npm run db:setup
```

This single command will:
- ✅ Generate the Prisma client
- ✅ Push the schema to SQLite
- ✅ Seed sample data (company, accounts, contacts, invoices)

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser — you'll be redirected to the dashboard automatically.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/              # All main app pages (sidebar layout)
│   │   ├── dashboard/            # KPI overview & charts
│   │   ├── invoices/             # Invoice list, create, detail view
│   │   ├── orders/               # Sales orders management
│   │   ├── expenses/             # Expense / purchase bills
│   │   ├── payments/             # Payment recording
│   │   ├── production/           # Production batch tracking
│   │   ├── tracker/              # Expense & time tracker
│   │   ├── ledger/               # General ledger / journal entries
│   │   ├── accounts/             # Chart of accounts
│   │   ├── contacts/             # Customers & vendors
│   │   ├── gst/                  # GST reports & tax summary
│   │   ├── reports/              # Financial reports (P&L, Balance Sheet)
│   │   └── settings/             # Company & system settings
│   └── api/                      # Next.js REST API routes
├── components/
│   └── Sidebar.tsx               # Navigation sidebar
└── lib/
    ├── prisma.ts                  # Prisma client singleton
    └── utils.ts                   # Shared utilities
prisma/
├── schema.prisma                  # Database schema
├── seed.ts                        # Seed script with sample data
└── dev.db                         # SQLite database file
```

---

## 🗄️ Database Scripts

| Command | Description |
|---|---|
| `npm run db:setup` | Generate client + push schema + seed data |
| `npm run db:seed` | Re-run seed data only |
| `npm run db:reset` | Force-reset DB and re-seed ⚠️ *deletes all data* |

---

## 🇮🇳 GST Compliance

Simple Book is built with Indian GST requirements in mind:

- **CGST + SGST** — automatically applied for intra-state transactions
- **IGST** — automatically applied for inter-state transactions (detected via place of supply)
- **HSN / SAC codes** on every invoice line item
- **GSTIN & PAN** fields for company and all contacts
- Tax rates fully configurable — 0%, 5%, 12%, 18%, 28%
- GSTR-ready tax breakdown report

---

## 📋 Available Scripts

```bash
npm run dev        # Start development server (http://localhost:3000)
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run db:setup   # Initialize database with schema + seed data
npm run db:reset   # Reset database ⚠️ destructive
npm run db:seed    # Re-seed sample data only
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch — `git checkout -b feature/your-feature`
3. Commit your changes — `git commit -m 'Add some feature'`
4. Push to your branch — `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">Built with ❤️ for Indian SMEs</p>
