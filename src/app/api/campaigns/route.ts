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

  // Fallback: No campaigns yet (dummy logs removed)
  return NextResponse.json({ success: true, campaigns: [] });
}

