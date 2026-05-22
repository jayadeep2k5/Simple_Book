import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COMPANY_ID = "default-company";

export async function GET() {
  try {
    const company = await prisma.company.findUnique({
      where: { id: COMPANY_ID },
    });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const company = await prisma.company.upsert({
      where: { id: COMPANY_ID },
      update: {
        name: body.name,
        gstin: body.gstin,
        pan: body.pan,
        address: body.address,
        city: body.city,
        state: body.state,
        stateCode: body.stateCode,
        pincode: body.pincode,
        phone: body.phone,
        email: body.email,
        website: body.website,
        fyStartMonth: body.fyStartMonth ? parseInt(body.fyStartMonth) : undefined,
      },
      create: {
        id: COMPANY_ID,
        name: body.name || "My Company",
        gstin: body.gstin,
        fyStartMonth: 4,
        fyStartYear: 2024,
      },
    });
    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}
