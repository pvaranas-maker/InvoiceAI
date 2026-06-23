import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const estimate = await prisma.estimate.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      customer: true,
      items: true,
    },
  });

  if (!estimate) {
    return NextResponse.json(
      { error: "Estimate not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(estimate);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  await prisma.estimateItem.deleteMany({
    where: {
      estimateId: Number(id),
    },
  });

  const estimate = await prisma.estimate.update({
    where: {
      id: Number(id),
    },
    data: {
      customerName: body.customerName,
      customerId: body.customerId,
      subtotal: body.subtotal,
      tax: body.tax,
      total: body.total,
      status: body.status ?? "Draft",
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.estimate.delete({
    where: {
      id: Number(id),
    },
  });

  return NextResponse.json({ success: true });
}