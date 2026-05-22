import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

// Dashboard summary data
export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 3, 1); // April 1 FY start

    // Revenue this month (from paid/sent invoices)
    const revenueResult = await prisma.invoice.aggregate({
      where: {
        companyId: COMPANY_ID,
        status: { in: ["PAID", "SENT", "PARTIAL"] },
        invoiceDate: { gte: startOfMonth },
      },
      _sum: { grandTotal: true },
    });

    // Outstanding receivables
    const outstandingResult = await prisma.invoice.aggregate({
      where: {
        companyId: COMPANY_ID,
        status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
      },
      _sum: { balanceDue: true },
    });

    // Expenses this month
    const expensesResult = await prisma.expense.aggregate({
      where: {
        companyId: COMPANY_ID,
        billDate: { gte: startOfMonth },
      },
      _sum: { grandTotal: true },
    });

    // GST liability (CGST + SGST + IGST from this month's invoices)
    const gstResult = await prisma.invoice.aggregate({
      where: {
        companyId: COMPANY_ID,
        status: { in: ["PAID", "SENT", "PARTIAL"] },
        invoiceDate: { gte: startOfMonth },
      },
      _sum: { totalTax: true },
    });

    // Monthly revenue for last 6 months (for chart)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const [rev, exp] = await Promise.all([
        prisma.invoice.aggregate({
          where: {
            companyId: COMPANY_ID,
            status: { in: ["PAID", "SENT", "PARTIAL"] },
            invoiceDate: { gte: monthStart, lte: monthEnd },
          },
          _sum: { grandTotal: true },
        }),
        prisma.expense.aggregate({
          where: {
            companyId: COMPANY_ID,
            billDate: { gte: monthStart, lte: monthEnd },
          },
          _sum: { grandTotal: true },
        }),
      ]);
      monthlyData.push({
        month: monthStart.toLocaleString("en-IN", { month: "short" }),
        revenue: rev._sum.grandTotal || 0,
        expenses: exp._sum.grandTotal || 0,
      });
    }

    // Recent invoices
    const recentInvoices = await prisma.invoice.findMany({
      where: { companyId: COMPANY_ID },
      include: { contact: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Invoice count by status
    const invoiceStats = await prisma.invoice.groupBy({
      by: ["status"],
      where: { companyId: COMPANY_ID },
      _count: { id: true },
    });

    // Overdue invoices - update status
    await prisma.invoice.updateMany({
      where: {
        companyId: COMPANY_ID,
        status: "SENT",
        dueDate: { lt: now },
      },
      data: { status: "OVERDUE" },
    });

    return NextResponse.json({
      kpis: {
        revenueThisMonth: revenueResult._sum.grandTotal || 0,
        outstanding: outstandingResult._sum.balanceDue || 0,
        expensesThisMonth: expensesResult._sum.grandTotal || 0,
        gstDue: gstResult._sum.totalTax || 0,
      },
      monthlyChart: monthlyData,
      recentInvoices,
      invoiceStats: Object.fromEntries(
        invoiceStats.map((s) => [s.status, s._count.id])
      ),
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
