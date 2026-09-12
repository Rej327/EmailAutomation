import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (isSupabaseConfigured) {
    try {
      const { data: campaigns, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      if (campaigns && campaigns.length > 0) {
        const formatted = campaigns.map((c) => ({
          id: c.id,
          sender: c.sender,
          recipients:
            typeof c.recipients === "string"
              ? c.recipients.split(",").map((r: string) => r.trim())
              : Array.isArray(c.recipients)
              ? c.recipients
              : [],
          subject: c.subject,
          contentHtml: c.content_html,
          isAutoSend: Boolean(c.is_auto_send),
          scheduledAt: c.scheduled_at ? new Date(c.scheduled_at).toISOString() : undefined,
          status: c.status as "SENT" | "SCHEDULED" | "SENDING" | "FAILED",
          createdAt: c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString(),
        }));

        return NextResponse.json({ success: true, campaigns: formatted });
      }
    } catch (err) {
      console.warn("Supabase fetch failed, using fallback:", err);
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
