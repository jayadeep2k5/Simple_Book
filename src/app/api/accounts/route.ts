import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const where: any = { companyId: COMPANY_ID, isActive: true };
    if (type) where.type = type;

    const accounts = await prisma.account.findMany({
      where,
      include: { children: true },
      orderBy: { code: "asc" },
    });
    return NextResponse.json(accounts);
  } catch {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const account = await prisma.account.create({
      data: {
        code: body.code,
        name: body.name,
        type: body.type,
        subType: body.subType,
        parentId: body.parentId || null,
        description: body.description,
        openingBalance: body.openingBalance || 0,
        companyId: COMPANY_ID,
      },
    });
    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
