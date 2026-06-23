import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const estimates = await prisma.estimate.findMany({
    include: {
      customer: true,
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(estimates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const estimate = await prisma.estimate.create({
    data: {
      estimateNumber: body.estimateNumber,
      customerName: body.customerName,
      customerId: body.customerId,
      subtotal: body.subtotal,
      tax: body.tax,
      total: body.total,
      status: body.status ?? "Draft",
      validUntil: body.validUntil
        ? new Date(body.validUntil)
        : null,

      items: {
        create: body.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
    include: {
      customer: true,
      items: true,
    },
  });

  return NextResponse.json(estimate);
}