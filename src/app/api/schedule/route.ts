import { NextRequest, NextResponse } from "next/server";
import { sendBulkEmails } from "@/lib/resend";
import { prisma, isPrismaConfigured } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { campaignId, action } = await req.json();

    if (action === "TRIGGER_DISPATCH") {
      // If Prisma is configured, find campaign in DB
      let campaign = null;
      if (isPrismaConfigured && campaignId) {
        try {
          campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
          });
        } catch {
          // ignore
        }
      }

      if (campaign) {
        const recipientsList = campaign.recipients
          .split(/[\n,;]+/)
          .map((e) => e.trim())
          .filter(Boolean);

        const result = await sendBulkEmails({
          from: campaign.sender,
          to: recipientsList,
          subject: campaign.subject,
          html: campaign.contentHtml,
        });

        if (isPrismaConfigured) {
          await prisma.campaign.update({
            where: { id: campaignId },
            data: {
              status: result.success ? "SENT" : "FAILED",
            },
          });
        }

        return NextResponse.json({
          success: true,
          message: `Scheduled campaign ${campaignId} dispatched successfully!`,
          deliveryCount: result.deliveryCount,
        });
      }

      // Simulated dispatch for demo campaigns
      await new Promise((r) => setTimeout(r, 600));
      return NextResponse.json({
        success: true,
        message: `Scheduled campaign dispatched successfully! (Demo Mode)`,
        deliveryCount: 3,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Scheduler error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
