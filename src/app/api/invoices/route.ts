import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const contactId = searchParams.get("contactId");

    const where: any = { companyId: COMPANY_ID };
    if (status) where.status = status;
    if (contactId) where.contactId = contactId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        contact: true,
        items: { include: { taxRate: true } },
        payments: true,
      },
      orderBy: { invoiceDate: "desc" },
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { companyId: COMPANY_ID },
      orderBy: { createdAt: "desc" },
    });
    let nextNum = 1;
    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const invoiceNumber = `INV-${String(nextNum).padStart(4, "0")}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(body.invoiceDate || new Date()),
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        status: body.status || "DRAFT",
        contactId: body.contactId,
        companyId: COMPANY_ID,
        placeOfSupply: body.placeOfSupply,
        isInterState: body.isInterState || false,
        subtotal: body.subtotal || 0,
        totalCgst: body.totalCgst || 0,
        totalSgst: body.totalSgst || 0,
        totalIgst: body.totalIgst || 0,
        totalTax: body.totalTax || 0,
        roundOff: body.roundOff || 0,
        grandTotal: body.grandTotal || 0,
        balanceDue: body.grandTotal || 0,
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

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to create invoice" }, { status: 500 });
  }
}
