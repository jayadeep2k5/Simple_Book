import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { amount, method, notes, paidOn } = body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const paymentAmt = parseFloat(amount);

    await prisma.orderPayment.create({
      data: {
        orderId: id,
        amount: paymentAmt,
        method: method || "CASH",
        notes: notes || null,
        paidOn: paidOn ? new Date(paidOn) : new Date(),
      },
    });

    const newAmountPaid = order.amountPaid + paymentAmt;
    const newBalanceDue = Math.max(0, order.totalAmount - newAmountPaid);
    const newStatus =
      newBalanceDue <= 0
        ? "PAID"
        : newAmountPaid > 0
        ? "PARTIAL"
        : "PENDING";

    const updated = await prisma.order.update({
      where: { id },
      data: {
        amountPaid: newAmountPaid,
        balanceDue: newBalanceDue,
        status: newStatus as any,
      },
      include: { customer: true, items: true, payments: { orderBy: { paidOn: "desc" } } },
    });

    return NextResponse.json(updated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
