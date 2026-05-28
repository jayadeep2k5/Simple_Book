import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

export async function GET() {
  try {
    const entries = await prisma.productionLog.findMany({
      where: { companyId: COMPANY_ID },
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
    const { date, kgs, notes } = body;

    if (!date || !kgs) {
      return NextResponse.json({ error: "date and kgs are required" }, { status: 400 });
    }

    // Normalize date to midnight UTC
    const dateObj = new Date(date);
    dateObj.setUTCHours(0, 0, 0, 0);

    // Upsert so we can edit same-day entry
    const entry = await prisma.productionLog.upsert({
      where: { companyId_date: { companyId: COMPANY_ID, date: dateObj } },
      update: { kgs: parseFloat(kgs), notes: notes || null },
      create: {
        date: dateObj,
        kgs: parseFloat(kgs),
        notes: notes || null,
        companyId: COMPANY_ID,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
