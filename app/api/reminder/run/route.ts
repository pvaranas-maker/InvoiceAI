import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
    try {
        const now = new Date();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                status: {
                    not: "Paid",
                },
                dueDate: {
                    lt: now,
                },
                OR: [
                    { lastReminderSent: null },
                    { lastReminderSent: { lt: startOfToday } },
                ],
            },
            include: {
                customer: true,
            },
        });

        const sent = [];

        for (const invoice of overdueInvoices) {
            const to = "pvaranas@gmail.com";
            const result = await resend.emails.send({
                from: "InvoiceAI <onboarding@resend.dev>",
                to,
                subject: `Payment Reminder - Invoice #${invoice.invoiceNumber}`,
                html: `

            

                
          <h2>Payment Reminder</h2>
          <p>Hello ${invoice.customer?.name || invoice.customerName},</p>
          <p>This is a friendly reminder that Invoice #${invoice.invoiceNumber} is overdue.</p>
          <ul>
            <li><strong>Amount Due:</strong> $${invoice.total.toFixed(2)}</li>
            <li><strong>Due Date:</strong> ${invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString()
                        : "N/A"
                    }</li>
          </ul>
          <p>Please submit payment at your earliest convenience.</p>
          <p>If you've already paid, please disregard this message.</p>
          <p>Thank you,<br/>InvoiceAI</p>
        `,
            });

            console.log("Email sent!");


            if (!result.error) {
                console.log("Email sent!");
                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: {
                        lastReminderSent: now,
                        reminderCount: {
                            increment: 1,
                        },
                    },
                });

                sent.push(invoice.id);
            }

            if (result.error) {
                console.error("Resend Error:", result.error);

            }
        }

        return NextResponse.json({
            success: true,
            checked: overdueInvoices.length,
            sent: sent.length,
            sentInvoiceIds: sent,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { success: false, error: "Unable to run reminders" },
            { status: 500 }
        );
    }
}