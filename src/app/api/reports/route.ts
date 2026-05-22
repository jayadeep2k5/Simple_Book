import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "pl"; // pl | bs | tb | gstr1 | gstr3b
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const now = new Date();
    const from = fromDate ? new Date(fromDate) : new Date(now.getFullYear(), 3, 1);
    const to = toDate ? new Date(toDate) : now;

    if (type === "pl") {
      // Profit & Loss
      const income = await prisma.invoice.aggregate({
        where: {
          companyId: COMPANY_ID,
          status: { in: ["PAID", "SENT", "PARTIAL"] },
          invoiceDate: { gte: from, lte: to },
        },
        _sum: { subtotal: true, totalTax: true, grandTotal: true },
      });
      const expenses = await prisma.expense.aggregate({
        where: {
          companyId: COMPANY_ID,
          billDate: { gte: from, lte: to },
        },
        _sum: { grandTotal: true },
      });
      const totalIncome = income._sum.grandTotal || 0;
      const totalExpenses = expenses._sum.grandTotal || 0;
      return NextResponse.json({
        type: "pl",
        period: { from: from.toISOString(), to: to.toISOString() },
        income: {
          salesRevenue: income._sum.subtotal || 0,
          gstCollected: income._sum.totalTax || 0,
          total: totalIncome,
        },
        expenses: {
          total: totalExpenses,
        },
        netProfit: totalIncome - totalExpenses,
        grossProfit: (income._sum.subtotal || 0) - totalExpenses,
      });
    }

    if (type === "gstr1") {
      // GSTR-1 data
      const invoices = await prisma.invoice.findMany({
        where: {
          companyId: COMPANY_ID,
          status: { in: ["PAID", "SENT", "PARTIAL"] },
          invoiceDate: { gte: from, lte: to },
        },
        include: { contact: true, items: { include: { taxRate: true } } },
      });

      const b2b = invoices.filter((inv) => inv.contact.gstin);
      const b2c = invoices.filter((inv) => !inv.contact.gstin);

      return NextResponse.json({
        type: "gstr1",
        period: { from: from.toISOString(), to: to.toISOString() },
        b2b: b2b.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          customerGstin: inv.contact.gstin,
          customerName: inv.contact.name,
          placeOfSupply: inv.placeOfSupply,
          isInterState: inv.isInterState,
          taxableValue: inv.subtotal,
          cgst: inv.totalCgst,
          sgst: inv.totalSgst,
          igst: inv.totalIgst,
          total: inv.grandTotal,
        })),
        b2c: b2c.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          customerName: inv.contact.name,
          taxableValue: inv.subtotal,
          cgst: inv.totalCgst,
          sgst: inv.totalSgst,
          igst: inv.totalIgst,
          total: inv.grandTotal,
        })),
        summary: {
          totalB2B: b2b.length,
          totalB2C: b2c.length,
          totalTaxableValue: invoices.reduce((s, i) => s + i.subtotal, 0),
          totalCgst: invoices.reduce((s, i) => s + i.totalCgst, 0),
          totalSgst: invoices.reduce((s, i) => s + i.totalSgst, 0),
          totalIgst: invoices.reduce((s, i) => s + i.totalIgst, 0),
          totalTax: invoices.reduce((s, i) => s + i.totalTax, 0),
        },
      });
    }

    if (type === "gstr3b") {
      const invoices = await prisma.invoice.findMany({
        where: {
          companyId: COMPANY_ID,
          status: { in: ["PAID", "SENT", "PARTIAL"] },
          invoiceDate: { gte: from, lte: to },
        },
      });
      const expenses = await prisma.expense.findMany({
        where: {
          companyId: COMPANY_ID,
          billDate: { gte: from, lte: to },
        },
        include: { items: { include: { taxRate: true } } },
      });

      const outwardTaxableValue = invoices.reduce((s, i) => s + i.subtotal, 0);
      const outwardCgst = invoices.reduce((s, i) => s + i.totalCgst, 0);
      const outwardSgst = invoices.reduce((s, i) => s + i.totalSgst, 0);
      const outwardIgst = invoices.reduce((s, i) => s + i.totalIgst, 0);
      const inwardTax = expenses.reduce(
        (s, e) => s + e.items.reduce((ss, item) => ss + item.taxAmount, 0), 0
      );
      const netGst = (outwardCgst + outwardSgst + outwardIgst) - inwardTax;

      return NextResponse.json({
        type: "gstr3b",
        period: { from: from.toISOString(), to: to.toISOString() },
        outwardSupplies: {
          taxableValue: outwardTaxableValue,
          cgst: outwardCgst,
          sgst: outwardSgst,
          igst: outwardIgst,
          totalTax: outwardCgst + outwardSgst + outwardIgst,
        },
        inwardSupplies: {
          itcClaimed: inwardTax,
        },
        netGstPayable: Math.max(0, netGst),
        netGstRefund: netGst < 0 ? Math.abs(netGst) : 0,
      });
    }

    if (type === "tb") {
      // Trial Balance - sum from journal lines
      const accounts = await prisma.account.findMany({
        where: { companyId: COMPANY_ID },
        include: {
          debitLines: {
            where: {
              journalEntry: {
                entryDate: { gte: from, lte: to },
                isPosted: true,
              },
            },
          },
          creditLines: {
            where: {
              journalEntry: {
                entryDate: { gte: from, lte: to },
                isPosted: true,
              },
            },
          },
        },
        orderBy: { code: "asc" },
      });

      const rows = accounts.map((acc) => {
        const totalDebit = acc.debitLines.reduce((s, l) => s + l.debit, 0);
        const totalCredit = acc.creditLines.reduce((s, l) => s + l.credit, 0);
        return {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          openingBalance: acc.openingBalance,
          debit: totalDebit,
          credit: totalCredit,
          closingBalance: acc.openingBalance + totalDebit - totalCredit,
        };
      }).filter((r) => r.debit > 0 || r.credit > 0 || r.openingBalance !== 0);

      return NextResponse.json({
        type: "tb",
        period: { from: from.toISOString(), to: to.toISOString() },
        rows,
        totalDebit: rows.reduce((s, r) => s + r.debit, 0),
        totalCredit: rows.reduce((s, r) => s + r.credit, 0),
      });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
