"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { EmailComposer } from "@/components/EmailComposer";
import { EmailPreview } from "@/components/EmailPreview";
import { CampaignHistory, CampaignRecord } from "@/components/CampaignHistory";
import { ImageModal } from "@/components/ImageModal";
import { AuthModal } from "@/components/AuthModal";
import { MockUser, isSupabaseConfigured } from "@/lib/supabase";
import { WelcomePasswordModal } from "@/components/WelcomePasswordModal";
import { isResendConfigured } from "@/lib/resend";
import { toast } from "sonner";

const INITIAL_CONTENT = `<h3>Dear Converge Customer Support,</h3>

<p>
I am writing to formally report and request immediate resolution regarding
the prolonged interruption of my Converge internet service.
</p>

<div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
  <p style="margin: 0 0 8px 0; font-weight: 600; color: #991b1b;">
    Service Interruption Details
  </p>

  <p style="margin: 4px 0; color: #7f1d1d;">
    <strong>Ticket Number:</strong> {{TICKET_NUMBER}}
  </p>

  <p style="margin: 4px 0; color: #7f1d1d;">
    <strong>Issue:</strong> LOS signal continuously blinking red
  </p>

  <p style="margin: 4px 0; color: #7f1d1d;">
    <strong>Outage Started:</strong> September 8, 2026
  </p>

  <p style="margin: 4px 0; color: #7f1d1d;">
    <strong>Current Duration:</strong> {{OUTAGE_DURATION}}
  </p>

  <p style="margin: 4px 0; color: #7f1d1d;">
    <strong>Current Status:</strong> No Internet Connection
  </p>
</div>

<p>
The LOS indicator on the modem has been blinking red since
<strong>September 8, 2026</strong>, and the internet connection has remained
unavailable. This has significantly affected normal online activities and
work-related requirements.
</p>

<p>
Despite paying for the subscribed internet service, the service has not been
available for approximately <strong>{{OUTAGE_DURATION}}</strong>.
I believe it is unreasonable for a customer to continue being charged for
a service that has not been continuously provided.
</p>

<p>
I respectfully request that Converge:
</p>

<ul>
  <li>Investigate the cause of the LOS issue immediately.</li>
  <li>Restore the internet connection as soon as possible.</li>
  <li>Provide a clear explanation regarding the cause of the prolonged outage.</li>
  <li>Provide an estimated time of restoration.</li>
  <li>Review the affected billing period and provide an appropriate service credit or adjustment for the period without service.</li>
  <li>Provide an updated status on Ticket Number: <strong>{{TICKET_NUMBER}}</strong>.</li>
</ul>

<p>
I would appreciate a clear update regarding the status of this issue and the
expected resolution time. Since the service interruption remains unresolved,
I will continue to provide updates regarding the duration of the outage.
</p>

<p>
Please treat this matter as a formal service complaint and provide a response
at your earliest convenience.
</p>

<p style="margin-top: 32px;">
Thank you.
</p>

<p style="margin-top: 16px;">
Sincerely,<br />
<strong>{{CUSTOMER_NAME}}</strong><br />
Account Number / Modem SN: {{ACCOUNT_NUMBER}}<br />
Service Address: {{SERVICE_ADDRESS}}<br />
Contact Number: {{CONTACT_NUMBER}}
</p>`;

export default function DashboardPage() {
  // State for Email Form
  const [sender, setSender] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_SENDER_EMAIL || "jeffdev2701@gmail.com"
  );
  const [recipientsRaw, setRecipientsRaw] = useState(
    "help_alpha@s2sinternet.com, consumer@ntc.gov.ph"
  );
  const [subject, setSubject] = useState(
    "Formal Complaint: Prolonged Internet Service Interruption - LOS Blinking Red Since September 8, 2026 (Ticket: CS-12950)"
  );
  const [contentHtml, setContentHtml] = useState(INITIAL_CONTENT);
  const [isAutoSend, setIsAutoSend] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Modals
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // User Auth State - Dummy account removed
  const [user, setUser] = useState<MockUser | null>(null);

  // Welcome Password Access Gate (Default: Password@123)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isCheckingLock, setIsCheckingLock] = useState<boolean>(true);

  // Check saved unlock status on mount
  useEffect(() => {
    try {
      const savedUnlocked = sessionStorage.getItem("complaint_email_unlocked");
      if (savedUnlocked === "true") {
        setIsUnlocked(true);
      }
    } catch {
      // ignore
    } finally {
      setIsCheckingLock(false);
    }
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
    try {
      sessionStorage.setItem("complaint_email_unlocked", "true");
    } catch {
      // ignore
    }
  };

  const handleLockWorkspace = () => {
    setIsUnlocked(false);
    try {
      sessionStorage.removeItem("complaint_email_unlocked");
    } catch {
      // ignore
    }
    toast("Workspace locked. Enter welcome password to resume.");
  };

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
        onLock={handleLockWorkspace}
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

      {/* Mandatory Welcome Password Access Gate (Default: Password@123) */}
      <WelcomePasswordModal
        isOpen={!isCheckingLock && !isUnlocked}
        onUnlock={handleUnlock}
      />
    </main>
  );
}
