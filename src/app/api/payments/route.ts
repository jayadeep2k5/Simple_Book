import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      where: { companyId: COMPANY_ID },
      include: { invoice: { include: { contact: true } } },
      orderBy: { paymentDate: "desc" },
    });
    return NextResponse.json(payments);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payment = await prisma.payment.create({
      data: {
        paymentDate: new Date(body.paymentDate || new Date()),
        amount: body.amount,
        method: body.method || "CASH",
        reference: body.reference,
        invoiceId: body.invoiceId || null,
        companyId: COMPANY_ID,
        notes: body.notes,
      },
    });

    // Update invoice if linked
    if (body.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: body.invoiceId },
        include: { payments: true },
      });
      if (invoice) {
        const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
        const newAmountPaid = totalPaid + body.amount;
        const newBalance = invoice.grandTotal - newAmountPaid;
        await prisma.invoice.update({
          where: { id: body.invoiceId },
          data: {
            amountPaid: newAmountPaid,
            balanceDue: Math.max(0, newBalance),
            status: newBalance <= 0 ? "PAID" : newAmountPaid > 0 ? "PARTIAL" : "SENT",
          },
        });
      }
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
