import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const invoices = await prisma.invoice.findMany({
    include: {
      customer: true,
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(invoices);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: body.invoiceNumber,
        customerName: body.customerName,
        customerId: body.customerId,
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

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to create invoice" },
      { status: 500 }
    );
  }
}