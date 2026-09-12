import { NextResponse } from "next/server";
import { prisma, isPrismaConfigured } from "@/lib/prisma";

export async function GET() {
  if (isPrismaConfigured) {
    try {
      const campaigns = await prisma.campaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      const formatted = campaigns.map((c) => ({
        id: c.id,
        sender: c.sender,
        recipients: c.recipients.split(",").map((r) => r.trim()),
        subject: c.subject,
        contentHtml: c.contentHtml,
        isAutoSend: c.isAutoSend,
        scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : undefined,
        status: c.status as "SENT" | "SCHEDULED" | "SENDING" | "FAILED",
        createdAt: c.createdAt.toISOString(),
      }));

      return NextResponse.json({ success: true, campaigns: formatted });
    } catch (err) {
      console.warn("Prisma fetch failed, using fallback:", err);
    }
  }

  // Fallback demo mock history
  const initialMockCampaigns = [
    {
      id: "camp_demo_1",
      sender: "jeffdev2701@gmail.com",
      recipients: ["user.alpha@tech.io", "marketing.lead@global.org"],
      subject: "🚀 Product Launch: Streamlined Automation v2.0",
      contentHtml: "<p>Welcome to our streamlined delivery system!</p>",
      isAutoSend: true,
      scheduledAt: new Date(Date.now() + 1800000).toISOString(),
      status: "SCHEDULED",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      isMock: true,
    },
    {
      id: "camp_demo_2",
      sender: "jeffdev2701@gmail.com",
      recipients: ["enterprise.team@acme.corp"],
      subject: "Weekly Activity & System Performance Digest",
      contentHtml: "<p>All systems operational with 99.9% uptime.</p>",
      isAutoSend: false,
      status: "SENT",
      sentAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      isMock: true,
    },
  ];

  return NextResponse.json({ success: true, campaigns: initialMockCampaigns });
}
