import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { companyId: COMPANY_ID },
      include: {
        customer: true,
        items: true,
        payments: { orderBy: { paidOn: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, orderDate, items, notes } = body;

    if (!customerId || !items?.length) {
      return NextResponse.json({ error: "customerId and items are required" }, { status: 400 });
    }

    // Generate order number
    const count = await prisma.order.count({ where: { companyId: COMPANY_ID } });
    const orderNumber = `ORD-${String(count + 1).padStart(4, "0")}`;

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.ratePerPipe,
      0
    );

    const order = await prisma.order.create({
      data: {
        orderNumber,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        customerId,
        companyId: COMPANY_ID,
        notes: notes || null,
        totalAmount,
        amountPaid: 0,
        balanceDue: totalAmount,
        items: {
          create: items.map((item: any) => ({
            pipeType: item.pipeType,
            quantity: parseInt(item.quantity),
            ratePerPipe: parseFloat(item.ratePerPipe),
            weightPerPipe: parseFloat(item.weightPerPipe || 0),
            amount: parseInt(item.quantity) * parseFloat(item.ratePerPipe),
          })),
        },
      },
      include: { customer: true, items: true, payments: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
