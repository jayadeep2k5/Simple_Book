import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

// GET all tracker categories
export async function GET() {
  try {
    const cats = await prisma.trackerCategory.findMany({
      where: { companyId: COMPANY_ID },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(cats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create a new category
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, color } = body;

    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const cat = await prisma.trackerCategory.upsert({
      where: { companyId_name: { companyId: COMPANY_ID, name } },
      update: { color: color || "#7C3AED" },
      create: { name, color: color || "#7C3AED", companyId: COMPANY_ID },
    });
    return NextResponse.json(cat, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
