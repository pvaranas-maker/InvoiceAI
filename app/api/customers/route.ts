import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all customers
export async function GET() {
  const customers = await prisma.customer.findMany({
    include: {
      invoices: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const customersWithStats = customers.map((customer) => {
    const invoiceCount = customer.invoices.length;
    const outstanding = customer.invoices.reduce(
      (sum, invoice) => sum + invoice.total,
      0
    );

    return {
      ...customer,
      invoices: invoiceCount,
      estimates: 0,
      outstanding,
    };
  });

  return NextResponse.json(customersWithStats);
}
// CREATE customer
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        company: body.company,
        email: body.email,
        phone: body.phone,
        address: body.address,
        notes: body.notes,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error(error);

        return NextResponse.json(
      { error: "Unable to create customer" },
      { status: 500 }
    );
  }
}

  export async function PUT(request: Request) {

    try {
      const body = await request.json();

      const customer = await prisma.customer.update({
        where: {
          id: body.id,
        },
        data: {
          name: body.name,
          company: body.company,
          email: body.email,
          phone: body.phone,
        },
      });

      return NextResponse.json(customer);
    } catch (error) {
      console.error(error);

      return NextResponse.json(
        { error: "Unable to update customer" },
        { status: 500 }
      );
    }
  }
export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    // Check if customer has invoices
    const invoiceCount = await prisma.invoice.count({
      where: {
        customerId: body.id,
      },
    });

    if (invoiceCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete customer with existing invoices.",
        },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: {
        id: body.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Unable to delete customer",
      },
      { status: 500 }
    );
  }
}