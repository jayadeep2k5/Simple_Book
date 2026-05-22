import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      where: { companyId: COMPANY_ID },
      include: { contact: true, items: { include: { taxRate: true } } },
      orderBy: { billDate: "desc" },
    });
    return NextResponse.json(expenses);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const expense = await prisma.expense.create({
      data: {
        billNumber: body.billNumber,
        billDate: new Date(body.billDate || new Date()),
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        status: body.status || "PENDING",
        contactId: body.contactId || null,
        companyId: COMPANY_ID,
        subtotal: body.subtotal || 0,
        totalTax: body.totalTax || 0,
        grandTotal: body.grandTotal || 0,
        notes: body.notes,
        category: body.category,
        items: {
          create: body.items?.map((item: any) => ({
            description: item.description,
            quantity: item.quantity || 1,
            rate: item.rate || 0,
            amount: item.amount || 0,
            taxRateId: item.taxRateId || null,
            taxAmount: item.taxAmount || 0,
            total: item.total || 0,
          })) || [],
        },
      },
      include: { contact: true, items: true },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
