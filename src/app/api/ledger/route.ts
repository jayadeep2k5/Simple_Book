import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

export async function GET() {
  try {
    const entries = await prisma.journalEntry.findMany({
      where: { companyId: COMPANY_ID },
      include: {
        lines: {
          include: {
            debitAccount: true,
            creditAccount: true,
          },
        },
      },
      orderBy: { entryDate: "desc" },
      take: 100,
    });
    return NextResponse.json(entries);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Generate entry number
    const last = await prisma.journalEntry.findFirst({
      where: { companyId: COMPANY_ID },
      orderBy: { createdAt: "desc" },
    });
    let nextNum = 1;
    if (last) {
      const match = last.entryNumber.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const entryNumber = `JE-${String(nextNum).padStart(4, "0")}`;

    const entry = await prisma.journalEntry.create({
      data: {
        entryDate: new Date(body.entryDate),
        entryNumber,
        narration: body.narration,
        type: "MANUAL",
        companyId: COMPANY_ID,
        isPosted: true,
        lines: {
          create: [
            {
              accountId: body.debitAccountId,
              debit: body.amount,
              credit: 0,
              narration: body.narration,
            },
            {
              accountId: body.debitAccountId, // placeholder - actual credit below
              creditAccountId: body.creditAccountId,
              debit: 0,
              credit: body.amount,
              narration: body.narration,
            },
          ],
        },
      },
      include: {
        lines: {
          include: { debitAccount: true, creditAccount: true },
        },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
