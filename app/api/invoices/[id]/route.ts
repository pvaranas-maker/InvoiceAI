import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      items: true,
      customer: true,
    },
  });

  return NextResponse.json(invoice);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  await prisma.invoiceItem.deleteMany({
    where: {
      invoiceId: Number(id),
    },
  });

  const invoice = await prisma.invoice.update({
    where: {
      id: Number(id),
    },
    
    data: {

      customerName: body.customerName,
      customer: body.customerId
        ? { connect: { id: body.customerId } }
        : { disconnect: true },
      subtotal: body.subtotal,
      tax: body.tax,
      total: body.total,
      status: body.status ?? "Draft",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,

      items: {
        create: body.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
    include: {
      items: true,
      customer: true,
    },
  });

  return NextResponse.json(invoice);
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.invoiceItem.deleteMany({
    where: {
      invoiceId: Number(id),
    },
  });

  await prisma.invoice.delete({
    where: {
      id: Number(id),
    },
  });

  return NextResponse.json({ success: true });
}
