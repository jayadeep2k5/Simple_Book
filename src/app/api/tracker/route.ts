import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

export async function GET() {
  try {
    const entries = await prisma.trackerEntry.findMany({
      where: { companyId: COMPANY_ID },
      include: { category: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(entries);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, amount, date, categoryId, notes } = body;

    if (!name || !amount) {
      return NextResponse.json({ error: "name and amount are required" }, { status: 400 });
    }

    const entry = await prisma.trackerEntry.create({
      data: {
        name,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        categoryId: categoryId || null,
        notes: notes || null,
        companyId: COMPANY_ID,
      },
      include: { category: true },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.trackerEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
