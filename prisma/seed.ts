import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as any);

const COMPANY_ID = "default-company";

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Company ──────────────────────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { id: COMPANY_ID },
    update: {},
    create: {
      id: COMPANY_ID,
      name: "Sharma Traders Pvt Ltd",
      gstin: "27AABCS1429B1Z1",
      pan: "AABCS1429B",
      address: "123, MG Road, Pune",
      city: "Pune",
      state: "Maharashtra",
      stateCode: "27",
      pincode: "411001",
      phone: "+91-9876543210",
      email: "info@sharmatraders.in",
      fyStartMonth: 4,
      fyStartYear: 2024,
    },
  });
  console.log("✅ Company created:", company.name);

  // ─── Tax Rates ────────────────────────────────────────────────────────────
  const taxRates = [
    { id: "tax-exempt", name: "GST Exempt (0%)", rate: 0, cgst: 0, sgst: 0, igst: 0 },
    { id: "tax-5", name: "GST 5%", rate: 5, cgst: 2.5, sgst: 2.5, igst: 5 },
    { id: "tax-12", name: "GST 12%", rate: 12, cgst: 6, sgst: 6, igst: 12 },
    { id: "tax-18", name: "GST 18%", rate: 18, cgst: 9, sgst: 9, igst: 18, isDefault: true },
    { id: "tax-28", name: "GST 28%", rate: 28, cgst: 14, sgst: 14, igst: 28 },
  ];

  for (const tr of taxRates) {
    await prisma.taxRate.upsert({
      where: { id: tr.id },
      update: {},
      create: { ...tr, isDefault: (tr as any).isDefault ?? false },
    });
  }
  console.log("✅ Tax rates seeded");

  // ─── Chart of Accounts ────────────────────────────────────────────────────
  // We'll create parent accounts first, then children
  const accounts = [
    // ASSET group
    { id: "acc-assets", code: "1000", name: "Assets", type: "ASSET" as const, parentId: null },
    { id: "acc-current-assets", code: "1100", name: "Current Assets", type: "ASSET" as const, parentId: "acc-assets" },
    { id: "acc-cash", code: "1101", name: "Cash in Hand", type: "ASSET" as const, parentId: "acc-current-assets" },
    { id: "acc-bank", code: "1102", name: "Bank Account", type: "ASSET" as const, parentId: "acc-current-assets" },
    { id: "acc-ar", code: "1103", name: "Accounts Receivable", type: "ASSET" as const, parentId: "acc-current-assets" },
    { id: "acc-gst-input", code: "1104", name: "GST Input Credit", type: "ASSET" as const, parentId: "acc-current-assets" },
    { id: "acc-tds-recv", code: "1105", name: "TDS Receivable", type: "ASSET" as const, parentId: "acc-current-assets" },
    { id: "acc-prepaid", code: "1106", name: "Prepaid Expenses", type: "ASSET" as const, parentId: "acc-current-assets" },
    { id: "acc-inventory", code: "1107", name: "Inventory / Stock", type: "ASSET" as const, parentId: "acc-current-assets" },
    { id: "acc-fixed-assets", code: "1200", name: "Fixed Assets", type: "ASSET" as const, parentId: "acc-assets" },
    { id: "acc-plant", code: "1201", name: "Plant & Machinery", type: "ASSET" as const, parentId: "acc-fixed-assets" },
    { id: "acc-computer", code: "1202", name: "Computers & Electronics", type: "ASSET" as const, parentId: "acc-fixed-assets" },
    { id: "acc-furniture", code: "1203", name: "Furniture & Fixtures", type: "ASSET" as const, parentId: "acc-fixed-assets" },
    { id: "acc-vehicle", code: "1204", name: "Vehicle", type: "ASSET" as const, parentId: "acc-fixed-assets" },
    { id: "acc-acc-dep", code: "1205", name: "Accumulated Depreciation", type: "ASSET" as const, parentId: "acc-fixed-assets" },

    // LIABILITY group
    { id: "acc-liabilities", code: "2000", name: "Liabilities", type: "LIABILITY" as const, parentId: null },
    { id: "acc-current-liab", code: "2100", name: "Current Liabilities", type: "LIABILITY" as const, parentId: "acc-liabilities" },
    { id: "acc-ap", code: "2101", name: "Accounts Payable", type: "LIABILITY" as const, parentId: "acc-current-liab" },
    { id: "acc-gst-cgst", code: "2102", name: "GST Payable - CGST", type: "LIABILITY" as const, parentId: "acc-current-liab" },
    { id: "acc-gst-sgst", code: "2103", name: "GST Payable - SGST", type: "LIABILITY" as const, parentId: "acc-current-liab" },
    { id: "acc-gst-igst", code: "2104", name: "GST Payable - IGST", type: "LIABILITY" as const, parentId: "acc-current-liab" },
    { id: "acc-tds-payable", code: "2105", name: "TDS Payable", type: "LIABILITY" as const, parentId: "acc-current-liab" },
    { id: "acc-salary-payable", code: "2106", name: "Salary Payable", type: "LIABILITY" as const, parentId: "acc-current-liab" },
    { id: "acc-long-liab", code: "2200", name: "Long-Term Liabilities", type: "LIABILITY" as const, parentId: "acc-liabilities" },
    { id: "acc-bank-loan", code: "2201", name: "Bank Loan", type: "LIABILITY" as const, parentId: "acc-long-liab" },

    // EQUITY group
    { id: "acc-equity", code: "3000", name: "Equity", type: "EQUITY" as const, parentId: null },
    { id: "acc-capital", code: "3001", name: "Owner's Capital", type: "EQUITY" as const, parentId: "acc-equity" },
    { id: "acc-retained", code: "3002", name: "Retained Earnings", type: "EQUITY" as const, parentId: "acc-equity" },
    { id: "acc-drawings", code: "3003", name: "Owner's Drawings", type: "EQUITY" as const, parentId: "acc-equity" },

    // INCOME group
    { id: "acc-income", code: "4000", name: "Income", type: "INCOME" as const, parentId: null },
    { id: "acc-sales", code: "4001", name: "Sales Revenue", type: "INCOME" as const, parentId: "acc-income" },
    { id: "acc-service-income", code: "4002", name: "Service Income", type: "INCOME" as const, parentId: "acc-income" },
    { id: "acc-other-income", code: "4003", name: "Other Income", type: "INCOME" as const, parentId: "acc-income" },
    { id: "acc-interest-income", code: "4004", name: "Interest Income", type: "INCOME" as const, parentId: "acc-income" },

    // EXPENSE group
    { id: "acc-expense", code: "5000", name: "Expenses", type: "EXPENSE" as const, parentId: null },
    { id: "acc-cogs", code: "5001", name: "Cost of Goods Sold", type: "EXPENSE" as const, parentId: "acc-expense" },
    { id: "acc-salary-exp", code: "5002", name: "Salaries & Wages", type: "EXPENSE" as const, parentId: "acc-expense" },
    { id: "acc-rent", code: "5003", name: "Rent", type: "EXPENSE" as const, parentId: "acc-expense" },
    { id: "acc-electricity", code: "5004", name: "Electricity & Utilities", type: "EXPENSE" as const, parentId: "acc-expense" },
    { id: "acc-phone", code: "5005", name: "Telephone & Internet", type: "EXPENSE" as const, parentId: "acc-expense" },
    { id: "acc-travel", code: "5006", name: "Travel & Conveyance", type: "EXPENSE" as const, parentId: "acc-expense" },
    { id: "acc-office", code: "5007", name: "Office Expenses", type: "EXPENSE" as const, parentId: "acc-expense" },
    { id: "acc-advert", code: "5008", name: "Advertisement & Marketing", type: "EXPENSE" as const, parentId: "acc-expense" },
    { id: "acc-bank-charges", code: "5009", name: "Bank Charges", type: "EXPENSE" as const, parentId: "acc-expense" },
    { id: "acc-depreciation", code: "5010", name: "Depreciation", type: "EXPENSE" as const, parentId: "acc-expense" },
    { id: "acc-misc-exp", code: "5011", name: "Miscellaneous Expenses", type: "EXPENSE" as const, parentId: "acc-expense" },
    { id: "acc-purchase", code: "5012", name: "Purchases", type: "EXPENSE" as const, parentId: "acc-expense" },
  ];

  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { companyId_code: { companyId: COMPANY_ID, code: acc.code } },
      update: {},
      create: {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        parentId: acc.parentId,
        companyId: COMPANY_ID,
      },
    });
  }
  console.log(`✅ Chart of Accounts seeded (${accounts.length} accounts)`);

  // ─── Sample Contacts ───────────────────────────────────────────────────────
  await prisma.contact.upsert({
    where: { id: "contact-1" },
    update: {},
    create: {
      id: "contact-1",
      name: "Rajesh Electronics",
      type: "CUSTOMER",
      gstin: "27AACCR5055K1Z4",
      phone: "9876500001",
      city: "Mumbai",
      state: "Maharashtra",
      stateCode: "27",
      companyId: COMPANY_ID,
    },
  });
  await prisma.contact.upsert({
    where: { id: "contact-2" },
    update: {},
    create: {
      id: "contact-2",
      name: "Priya Garments",
      type: "CUSTOMER",
      gstin: "06AABCP1234F1Z5",
      phone: "9876500002",
      city: "Gurugram",
      state: "Haryana",
      stateCode: "06",
      companyId: COMPANY_ID,
    },
  });
  await prisma.contact.upsert({
    where: { id: "vendor-1" },
    update: {},
    create: {
      id: "vendor-1",
      name: "Sri Krishna Suppliers",
      type: "VENDOR",
      phone: "9876500003",
      city: "Pune",
      state: "Maharashtra",
      stateCode: "27",
      companyId: COMPANY_ID,
    },
  });
  console.log("✅ Sample contacts seeded");

  // ─── App Settings ─────────────────────────────────────────────────────────
  await prisma.settings.upsert({
    where: { key: "initialized" },
    update: {},
    create: { key: "initialized", value: "true" },
  });
  await prisma.settings.upsert({
    where: { key: "companyId" },
    update: {},
    create: { key: "companyId", value: COMPANY_ID },
  });

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
