import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const result = await resend.emails.send({
            from: "InvoiceAI <onboarding@resend.dev>",
            to: body.to,
            subject: body.subject,
            html: body.html,
            attachments: body.pdfBase64
                ? [
                    {
                        filename: body.filename || "invoice.pdf",
                        content: body.pdfBase64,
                    },
                ]
                : undefined,
        });

        console.log("Resend result:", result);

        if (result.error) {
            return NextResponse.json(result.error, { status: 400 });
        }

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Unable to send email" },
            { status: 500 }
        );
    }
}