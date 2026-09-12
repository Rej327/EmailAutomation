"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { EmailComposer } from "@/components/EmailComposer";
import { EmailPreview } from "@/components/EmailPreview";
import { CampaignHistory, CampaignRecord } from "@/components/CampaignHistory";
import { ImageModal } from "@/components/ImageModal";
import { AuthModal } from "@/components/AuthModal";
import { SetupGuideModal } from "@/components/SetupGuideModal";
import { MockUser, DEMO_DEFAULT_USER, isSupabaseConfigured } from "@/lib/supabase";
import { isResendConfigured } from "@/lib/resend";
import { toast } from "sonner";

const INITIAL_CONTENT = `<h3>Hello Everyone,</h3>
<p>Welcome to our new streamlined automated update. We are pleased to share our latest product highlights.</p>
<div style="text-align: center; margin: 24px 0;">
  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80" alt="Platform Banner" style="max-width: 100%; border-radius: 10px; display: block; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
</div>
<p>This email demonstrates automated scheduling, bulk delivery, and visual image embedding.</p>
<p style="margin-top: 20px;">
  <a href="https://example.com" style="background: #6366f1; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Get Started Now</a>
</p>`;

export default function DashboardPage() {
  // State for Email Form
  const [sender, setSender] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_SENDER_EMAIL || "jeffdev2701@gmail.com"
  );
  const [recipientsRaw, setRecipientsRaw] = useState(
    "jeffdev2701@gmail.com, partner@startup.io"
  );
  const [subject, setSubject] = useState(
    "Automated System Update: New Feature Launch & Analytics"
  );
  const [contentHtml, setContentHtml] = useState(INITIAL_CONTENT);
  const [isAutoSend, setIsAutoSend] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Modals
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // User Auth State
  const [user, setUser] = useState<MockUser | null>(DEMO_DEFAULT_USER);

  // Campaign History State
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);

  // Fetch initial campaign logs
  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      if (data.campaigns) {
        setCampaigns(data.campaigns);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Handle email send or schedule action
  const handleSendEmail = async (payload: {
    sender: string;
    recipients: string[];
    subject: string;
    contentHtml: string;
    isAutoSend: boolean;
    scheduledAt?: string;
  }) => {
    setIsSending(true);
    const toastId = toast.loading(
      payload.isAutoSend ? "Arming automation schedule..." : "Dispatching bulk emails..."
    );

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to dispatch email campaign");
      }

      toast.success(
        payload.isAutoSend
          ? "Automation armed! Email scheduled successfully."
          : `Dispatched to ${payload.recipients.length} recipients successfully!`,
        { id: toastId }
      );

      // Prepend newly created campaign to list
      if (data.campaign) {
        setCampaigns((prev) => [data.campaign, ...prev]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delivery failed";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  // Trigger dispatch for an already scheduled campaign
  const handleTriggerScheduled = async (campaignId: string) => {
    const toastId = toast.loading("Triggering scheduled dispatch...");
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, action: "TRIGGER_DISPATCH" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Campaign dispatched immediately!", { id: toastId });

      // Update state locally
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? { ...c, status: "SENT" } : c))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Trigger failed";
      toast.error(msg, { id: toastId });
    }
  };

  // Load a campaign back into composer
  const handleSelectCampaign = (campaign: CampaignRecord) => {
    if (isAutoSend) {
      toast.error("Please disable Auto-Send before loading another campaign");
      return;
    }
    setSender(campaign.sender);
    setRecipientsRaw(campaign.recipients.join(", "));
    setSubject(campaign.subject);
    setContentHtml(campaign.contentHtml);
    toast.success(`Loaded campaign "${campaign.subject}"`);
  };

  // Insert image callback from modal
  const handleInsertImage = (imageHtml: string) => {
    setContentHtml((prev) => prev + imageHtml);
  };

  // Parse recipients for live preview
  const parsedRecipients = recipientsRaw
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);

  const stats = {
    totalSent: campaigns.filter((c) => c.status === "SENT").length,
    scheduledCount: campaigns.filter((c) => c.status === "SCHEDULED").length,
  };

  return (
    <main className="app-container">
      {/* Top Navigation */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          setUser(null);
          toast("Signed out successfully");
        }}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        stats={stats}
        isLiveMode={isResendConfigured && isSupabaseConfigured}
      />

      {/* Main Studio Grid: Left Composer, Right Live Preview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
          gap: "24px",
          alignItems: "stretch",
        }}
      >
        {/* Left Column: Email Composer */}
        <EmailComposer
          onSendEmail={handleSendEmail}
          onOpenImageModal={() => setIsImageModalOpen(true)}
          sender={sender}
          setSender={setSender}
          recipientsRaw={recipientsRaw}
          setRecipientsRaw={setRecipientsRaw}
          subject={subject}
          setSubject={setSubject}
          contentHtml={contentHtml}
          setContentHtml={setContentHtml}
          isAutoSend={isAutoSend}
          setIsAutoSend={setIsAutoSend}
          scheduledAt={scheduledAt}
          setScheduledAt={setScheduledAt}
          isSending={isSending}
        />

        {/* Right Column: Live Email Preview Client */}
        <EmailPreview
          sender={sender}
          recipients={parsedRecipients}
          subject={subject}
          contentHtml={contentHtml}
        />
      </div>

      {/* Bottom Section: Delivery Logs & Campaign History */}
      <CampaignHistory
        campaigns={campaigns}
        onRefresh={fetchCampaigns}
        onTriggerScheduled={handleTriggerScheduled}
        onSelectCampaign={handleSelectCampaign}
      />

      {/* Modals */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onInsertImage={handleInsertImage}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(newUser) => setUser(newUser)}
      />

      <SetupGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </main>
  );
}
