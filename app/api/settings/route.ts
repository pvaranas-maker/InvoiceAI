import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.companySettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyName: "InvoiceAI",
      taxRate: 8.6,
    },
  });

  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const settings = await prisma.companySettings.upsert({
      where: { id: 1 },
      update: {
        companyName: body.companyName,
        address: body.address,
        phone: body.phone,
        email: body.email,
        website: body.website,
        taxRate: Number(body.taxRate),
      },
      create: {
        id: 1,
        companyName: body.companyName || "InvoiceAI",
        address: body.address || "",
        phone: body.phone || "",
        email: body.email || "",
        website: body.website || "",
        taxRate: Number(body.taxRate) || 8.6,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to save settings" },
      { status: 500 }
    );
  }
}