import { NextRequest, NextResponse } from "next/server";
import { sendBulkEmails, isResendConfigured } from "@/lib/resend";
import { prisma, isPrismaConfigured } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sender, recipients, subject, contentHtml, isAutoSend, scheduledAt } = body;

    if (!sender || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "Sender and at least one recipient are required." },
        { status: 400 }
      );
    }

    if (!subject || !contentHtml) {
      return NextResponse.json(
        { error: "Subject and email content are required." },
        { status: 400 }
      );
    }

    // If AutoSend is ON and a future schedule date is provided:
    const isFutureScheduled =
      isAutoSend && scheduledAt && new Date(scheduledAt).getTime() > Date.now();

    if (isFutureScheduled) {
      // Save as SCHEDULED campaign
      let campaignRecord = null;
      if (isPrismaConfigured) {
        try {
          campaignRecord = await prisma.campaign.create({
            data: {
              sender,
              recipients: recipients.join(", "),
              subject,
              contentHtml,
              isAutoSend: true,
              scheduledAt: new Date(scheduledAt),
              status: "SCHEDULED",
            },
          });
        } catch (dbErr) {
          console.warn("Prisma save failed, using fallback:", dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        status: "SCHEDULED",
        message: `Campaign scheduled successfully for ${new Date(scheduledAt).toLocaleString()}!`,
        campaign: campaignRecord || {
          id: `sched_${Date.now()}`,
          sender,
          recipients,
          subject,
          contentHtml,
          isAutoSend: true,
          scheduledAt,
          status: "SCHEDULED",
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Immediate dispatch
    const result = await sendBulkEmails({
      from: sender,
      to: recipients,
      subject,
      html: contentHtml,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || result.message, success: false },
        { status: 500 }
      );
    }

    // Save to Database if Prisma is connected
    let savedCampaign = null;
    if (isPrismaConfigured) {
      try {
        savedCampaign = await prisma.campaign.create({
          data: {
            sender,
            recipients: recipients.join(", "),
            subject,
            contentHtml,
            isAutoSend: Boolean(isAutoSend),
            status: "SENT",
            logs: {
              create: recipients.map((email: string) => ({
                sender,
                recipient: email,
                subject,
                status: "SENT",
                resendId: result.mockId || undefined,
              })),
            },
          },
        });
      } catch (dbErr) {
        console.warn("Prisma campaign log error:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      status: "SENT",
      message: result.message,
      deliveryCount: result.deliveryCount,
      isMock: result.isMock,
      campaign: savedCampaign || {
        id: `camp_${Date.now()}`,
        sender,
        recipients,
        subject,
        contentHtml,
        isAutoSend: Boolean(isAutoSend),
        status: "SENT",
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMsg, success: false }, { status: 500 });
  }
}
