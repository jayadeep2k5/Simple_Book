import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const taxRates = await prisma.taxRate.findMany({
      where: { isActive: true },
      orderBy: { rate: "asc" },
    });
    return NextResponse.json(taxRates);
  } catch {
    return NextResponse.json({ error: "Failed to fetch tax rates" }, { status: 500 });
  }
}
