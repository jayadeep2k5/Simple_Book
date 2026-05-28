import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findFirst({
      where: { id, companyId: COMPANY_ID },
      include: {
        contact: true,
        items: { include: { taxRate: true } },
        payments: true,
      },
    });
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Delete existing items and recreate
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        invoiceDate: new Date(body.invoiceDate),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: body.status,
        contactId: body.contactId,
        placeOfSupply: body.placeOfSupply,
        isInterState: body.isInterState,
        subtotal: body.subtotal,
        totalCgst: body.totalCgst,
        totalSgst: body.totalSgst,
        totalIgst: body.totalIgst,
        totalTax: body.totalTax,
        roundOff: body.roundOff,
        grandTotal: body.grandTotal,
        balanceDue: body.grandTotal - (body.amountPaid || 0),
        notes: body.notes,
        terms: body.terms,
        items: {
          create: body.items?.map((item: any) => ({
            description: item.description,
            hsnSac: item.hsnSac,
            quantity: item.quantity || 1,
            unit: item.unit || "Nos",
            rate: item.rate || 0,
            amount: item.amount || 0,
            taxRateId: item.taxRateId || null,
            cgstAmt: item.cgstAmt || 0,
            sgstAmt: item.sgstAmt || 0,
            igstAmt: item.igstAmt || 0,
            taxAmount: item.taxAmount || 0,
            total: item.total || 0,
          })) || [],
        },
      },
      include: { contact: true, items: { include: { taxRate: true } } },
    });

    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
