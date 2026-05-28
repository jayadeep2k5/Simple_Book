import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    // Opening balance from accounts
    const accounts = await prisma.account.findMany({
      where: { companyId: COMPANY_ID },
    });
    const openingBalance = accounts.reduce((sum, a) => {
      if (a.type === "ASSET" || a.type === "EXPENSE") return sum + a.openingBalance;
      if (a.type === "LIABILITY" || a.type === "EQUITY" || a.type === "INCOME") return sum - a.openingBalance;
      return sum;
    }, 0);

    // Production this month
    const productionEntries = await prisma.productionLog.findMany({
      where: { companyId: COMPANY_ID, date: { gte: startOfMonth } },
    });
    const productionThisMonth = productionEntries.reduce((s, e) => s + e.kgs, 0);
    const productionAvgPerDay =
      productionEntries.length > 0 ? productionThisMonth / productionEntries.length : 0;

    // Today's production
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const todayProduction = await prisma.productionLog.findFirst({
      where: { companyId: COMPANY_ID, date: { gte: todayStart, lt: todayEnd } },
    });

    // Orders this month
    const ordersThisMonth = await prisma.order.aggregate({
      where: { companyId: COMPANY_ID, orderDate: { gte: startOfMonth } },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    // Total outstanding balance from all orders
    const totalOutstanding = await prisma.order.aggregate({
      where: { companyId: COMPANY_ID, status: { in: ["PENDING", "PARTIAL"] } },
      _sum: { balanceDue: true },
    });

    // Money collected today (order payments today) — two-step to avoid relation filter in aggregate
    const companyOrderIds = await prisma.order.findMany({
      where: { companyId: COMPANY_ID },
      select: { id: true },
    });
    const orderIdList = companyOrderIds.map((o) => o.id);
    const collectedToday = await prisma.orderPayment.aggregate({
      where: {
        orderId: { in: orderIdList },
        paidOn: { gte: todayStart, lt: todayEnd },
      },
      _sum: { amount: true },
    });

    // Tracker expenses this month
    const trackerMTD = await prisma.trackerEntry.aggregate({
      where: { companyId: COMPANY_ID, date: { gte: startOfMonth } },
      _sum: { amount: true },
    });

    // Monthly production for last 6 months
    const monthlyProduction = [];
    for (let i = 5; i >= 0; i--) {
      const ms = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const me = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const entries = await prisma.productionLog.findMany({
        where: { companyId: COMPANY_ID, date: { gte: ms, lte: me } },
      });
      const total = entries.reduce((s, e) => s + e.kgs, 0);
      monthlyProduction.push({
        month: ms.toLocaleString("en-IN", { month: "short" }),
        kgs: total,
      });
    }

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      where: { companyId: COMPANY_ID },
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Top customers by balance due
    const topDebtors = await prisma.order.groupBy({
      by: ["customerId"],
      where: { companyId: COMPANY_ID, status: { in: ["PENDING", "PARTIAL"] } },
      _sum: { balanceDue: true },
      orderBy: { _sum: { balanceDue: "desc" } },
      take: 5,
    });
    const topDebtorContacts = await Promise.all(
      topDebtors.map(async (d) => {
        const contact = await prisma.contact.findUnique({ where: { id: d.customerId } });
        return { name: contact?.name || "Unknown", balance: d._sum.balanceDue || 0 };
      })
    );

    // Revenue this month (invoices)
    const revenueResult = await prisma.invoice.aggregate({
      where: {
        companyId: COMPANY_ID,
        status: { in: ["PAID", "SENT", "PARTIAL"] },
        invoiceDate: { gte: startOfMonth },
      },
      _sum: { grandTotal: true },
    });

    return NextResponse.json({
      openingBalance,
      productionThisMonth,
      productionAvgPerDay,
      todayProductionKgs: todayProduction?.kgs || 0,
      ordersThisMonth: ordersThisMonth._count.id,
      ordersRevenueMTD: ordersThisMonth._sum.totalAmount || 0,
      totalOutstanding: totalOutstanding._sum.balanceDue || 0,
      collectedToday: collectedToday._sum.amount || 0,
      trackerMTD: trackerMTD._sum.amount || 0,
      revenueMTD: revenueResult._sum.grandTotal || 0,
      monthlyProduction,
      recentOrders,
      topDebtors: topDebtorContacts,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
