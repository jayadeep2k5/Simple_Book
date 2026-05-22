import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

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
  } catch {
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const contact = await prisma.contact.create({
      data: {
        name: body.name,
        type: body.type || "CUSTOMER",
        gstin: body.gstin,
        pan: body.pan,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        stateCode: body.stateCode,
        pincode: body.pincode,
        companyId: COMPANY_ID,
      },
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
