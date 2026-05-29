import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

/** Ensure the default company row exists so FK constraints never fail */
async function ensureCompany() {
  await prisma.company.upsert({
    where: { id: COMPANY_ID },
    update: {},
    create: {
      id: COMPANY_ID,
      name: "My Company",
      fyStartMonth: 4,
      fyStartYear: new Date().getFullYear(),
    },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const where: any = { companyId: COMPANY_ID };
    if (type) where.type = type;
    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(contacts);
  } catch (error: any) {
    console.error("GET /api/contacts error:", error?.message);
    return NextResponse.json([], { status: 200 }); // return empty array so client doesn't crash
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    await ensureCompany();
    const contact = await prisma.contact.create({
      data: {
        name: body.name.trim(),
        type: body.type || "CUSTOMER",
        gstin: body.gstin || null,
        pan: body.pan || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        stateCode: body.stateCode || null,
        pincode: body.pincode || null,
        companyId: COMPANY_ID,
      },
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/contacts error:", error?.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
