import { NextRequest, NextResponse } from "next/server";
import { sendBulkEmails, isResendConfigured } from "@/lib/resend";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from("campaigns")
            .insert({
              sender,
              recipients: recipients.join(", "),
              subject,
              content_html: contentHtml,
              is_auto_send: true,
              scheduled_at: new Date(scheduledAt).toISOString(),
              status: "SCHEDULED",
            })
            .select()
            .single();

          if (!error && data) {
            campaignRecord = {
              id: data.id,
              sender: data.sender,
              recipients,
              subject: data.subject,
              contentHtml: data.content_html,
              isAutoSend: Boolean(data.is_auto_send),
              scheduledAt: data.scheduled_at,
              status: data.status,
              createdAt: data.created_at,
            };
          }
        } catch (dbErr) {
          console.warn("Supabase save failed, using fallback:", dbErr);
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

    // Save to Database if Supabase is connected
    let savedCampaign = null;
    if (isSupabaseConfigured) {
      try {
        const { data: campaignRow, error: campErr } = await supabase
          .from("campaigns")
          .insert({
            sender,
            recipients: recipients.join(", "),
            subject,
            content_html: contentHtml,
            is_auto_send: Boolean(isAutoSend),
            status: "SENT",
          })
          .select()
          .single();

        if (!campErr && campaignRow) {
          savedCampaign = {
            id: campaignRow.id,
            sender: campaignRow.sender,
            recipients,
            subject: campaignRow.subject,
            contentHtml: campaignRow.content_html,
            isAutoSend: Boolean(campaignRow.is_auto_send),
            status: campaignRow.status,
            sentAt: new Date().toISOString(),
            createdAt: campaignRow.created_at,
          };

          // Also insert individual logs into email_logs
          const logsToInsert = recipients.map((email: string) => ({
            campaign_id: campaignRow.id,
            sender,
            recipient: email,
            subject,
            status: "SENT",
            resend_id: result.mockId || null,
          }));

          await supabase.from("email_logs").insert(logsToInsert);
        }
      } catch (dbErr) {
        console.warn("Supabase campaign log error:", dbErr);
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
