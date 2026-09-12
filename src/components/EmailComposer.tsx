"use client";

import React, { useState } from "react";
import {
  Send,
  Lock,
  Unlock,
  Image as ImageIcon,
  Clock,
  Calendar,
  Sparkles,
  Users,
  AlertCircle,
  CheckCircle2,
  FileText,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface EmailComposerProps {
  onSendEmail: (payload: {
    sender: string;
    recipients: string[];
    subject: string;
    contentHtml: string;
    isAutoSend: boolean;
    scheduledAt?: string;
  }) => Promise<void>;
  onOpenImageModal: () => void;
  sender: string;
  setSender: (val: string) => void;
  recipientsRaw: string;
  setRecipientsRaw: (val: string) => void;
  subject: string;
  setSubject: (val: string) => void;
  contentHtml: string;
  setContentHtml: (val: string) => void;
  isAutoSend: boolean;
  setIsAutoSend: (val: boolean) => void;
  scheduledAt: string;
  setScheduledAt: (val: string) => void;
  isSending: boolean;
}

const TEMPLATES = [
  {
    name: "Product Announcement",
    subject: "🚀 Introducing our next-generation platform update",
    content: `<h3>Dear Valued Customer,</h3>
<p>We are thrilled to announce major enhancements designed to streamline your daily workflow.</p>
<div style="text-align: center; margin: 24px 0;">
  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80" alt="Platform Banner" style="max-width: 100%; border-radius: 10px; display: block; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
</div>
<p>Here is what is new in this release:</p>
<ul>
  <li><strong>Instant Automation:</strong> Real-time bulk scheduling and delivery.</li>
  <li><strong>Enhanced Security:</strong> Dedicated field protection and verification.</li>
  <li><strong>Responsive Rendering:</strong> Guaranteed layout consistency across mobile and desktop.</li>
</ul>
<p style="margin-top: 24px;">
  <a href="https://example.com" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Explore the New Features</a>
</p>
<p style="margin-top: 32px; color: #64748b;">Best regards,<br>The Engineering Team</p>`,
  },
  {
    name: "Welcome Onboarding",
    subject: "Welcome aboard! Here is your quick start guide",
    content: `<h2>Welcome to our Community! 👋</h2>
<p>We are excited to have you with us. Your account is now active and ready to go.</p>
<div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; margin: 20px 0; border-radius: 4px;">
  <p style="margin: 0; font-weight: 600; color: #1e293b;">Quick Tip:</p>
  <p style="margin: 4px 0 0 0; color: #475569;">You can configure custom senders, embed CDN images, and schedule delivery anytime.</p>
</div>
<p>If you have any questions, simply reply to this email or visit our help center.</p>`,
  },
  {
    name: "VIP Reminder",
    subject: "⏰ Friendly Reminder: Upcoming Scheduled Event",
    content: `<h3>Important Reminder</h3>
<p>This is a timely notification regarding your upcoming scheduled session.</p>
<p>Please make sure your preferences are up to date. No further action is required if your details are confirmed.</p>
<p>Thank you for partnering with us!</p>`,
  },
];

export const EmailComposer: React.FC<EmailComposerProps> = ({
  onSendEmail,
  onOpenImageModal,
  sender,
  setSender,
  recipientsRaw,
  setRecipientsRaw,
  subject,
  setSubject,
  contentHtml,
  setContentHtml,
  isAutoSend,
  setIsAutoSend,
  scheduledAt,
  setScheduledAt,
  isSending,
}) => {
  // Parse recipients list
  const recipientList = recipientsRaw
    .split(/[\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  const validRecipients = recipientList.filter((e) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  );
  const invalidCount = recipientList.length - validRecipients.length;

  const handleToggleAutoSend = (checked: boolean) => {
    setIsAutoSend(checked);
    if (checked) {
      toast.info("Auto-Send enabled: Form fields are now locked for safety", {
        icon: <Lock size={16} color="#f59e0b" />,
        duration: 3500,
      });
      // Default scheduled time if not set: 10 minutes from now
      if (!scheduledAt) {
        const defaultDate = new Date(Date.now() + 10 * 60 * 1000);
        setScheduledAt(defaultDate.toISOString().slice(0, 16));
      }
    } else {
      toast("Auto-Send disabled: Form fields are now unlocked and editable", {
        icon: <Unlock size={16} color="#10b981" />,
      });
    }
  };

  const handleApplyTemplate = (template: (typeof TEMPLATES)[0]) => {
    if (isAutoSend) {
      toast.error("Please toggle Auto-Send OFF to modify fields");
      return;
    }
    setSubject(template.subject);
    setContentHtml(template.content);
    toast.success(`Applied "${template.name}" template`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sender.trim()) {
      toast.error("Sender email is required");
      return;
    }

    if (validRecipients.length === 0) {
      toast.error("Please enter at least one valid recipient email address");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please enter an email subject");
      return;
    }

    if (!contentHtml.trim()) {
      toast.error("Email content cannot be empty");
      return;
    }

    if (isAutoSend && scheduledAt) {
      const scheduledTime = new Date(scheduledAt).getTime();
      if (isNaN(scheduledTime)) {
        toast.error("Please specify a valid schedule date and time");
        return;
      }
    }

    await onSendEmail({
      sender,
      recipients: validRecipients,
      subject,
      contentHtml,
      isAutoSend,
      scheduledAt: isAutoSend && scheduledAt ? scheduledAt : undefined,
    });

    // Trigger celebration confetti on success!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="glass-card" style={{ padding: "28px" }}>
      {/* Form Header & Auto-Send Toggle Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "20px",
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Email Campaign Composer</h2>
            {isAutoSend ? (
              <span className="field-lock-badge">
                <Lock size={12} />
                Fields Locked
              </span>
            ) : (
              <span className="badge badge-info" style={{ fontSize: "0.6875rem" }}>
                <Unlock size={11} />
                Editable
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px" }}>
            Configure receivers, rich content, and dispatch automated or manual schedules
          </p>
        </div>

        {/* Auto Send Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: isAutoSend ? "rgba(16, 185, 129, 0.08)" : "rgba(255, 255, 255, 0.03)",
            border: isAutoSend ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--border-subtle)",
            padding: "8px 16px",
            borderRadius: "var(--radius-lg)",
            transition: "all var(--transition-normal)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: isAutoSend ? "var(--status-success)" : "var(--text-primary)",
                }}
              >
                Auto Send
              </span>
              {isAutoSend && (
                <span className="badge badge-success" style={{ fontSize: "0.65rem", padding: "1px 6px" }}>
                  ARMED
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.71875rem", color: "var(--text-muted)" }}>
              {isAutoSend ? "Automation active • Fields locked" : "Manual dispatch mode"}
            </p>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={isAutoSend}
              onChange={(e) => handleToggleAutoSend(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
      </div>

      {/* Lock Notice Alert when Auto-Send is active */}
      {isAutoSend && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            padding: "10px 16px",
            borderRadius: "var(--radius-md)",
            marginBottom: "20px",
            fontSize: "0.8125rem",
            color: "#fde68a",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Lock size={16} color="var(--status-warning)" />
            <span>
              <strong>Lock Active:</strong> Email fields are locked to safeguard scheduled automation. Turn off Auto Send to edit.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: "0.75rem", padding: "4px 10px", borderColor: "rgba(245, 158, 11, 0.4)" }}
            onClick={() => handleToggleAutoSend(false)}
          >
            <Unlock size={12} />
            Unlock Fields
          </button>
        </div>
      )}

      {/* Quick Template Presets (when not locked) */}
      {!isAutoSend && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.78125rem", color: "var(--text-muted)", fontWeight: 600 }}>
              <Sparkles size={12} style={{ display: "inline", marginRight: "4px" }} />
              Quick Templates:
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                onClick={() => handleApplyTemplate(tmpl)}
              >
                <FileText size={12} color="var(--accent-primary)" />
                {tmpl.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Row 1: Sender Email (Default: jeffdev2701@gmail.com) */}
        <div className="form-group">
          <label className="form-label">
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {isAutoSend && <Lock size={12} color="var(--status-warning)" />}
              <span>Sender Email</span>
            </span>
            <span className="label-tag">Default: jeffdev2701@gmail.com</span>
          </label>
          <input
            type="email"
            className={`form-control ${isAutoSend ? "is-locked" : ""}`}
            placeholder="jeffdev2701@gmail.com"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            disabled={isAutoSend}
            required
          />
        </div>

        {/* Row 2: Bulk Receivers */}
        <div className="form-group">
          <label className="form-label">
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {isAutoSend && <Lock size={12} color="var(--status-warning)" />}
              <span>Bulk Receivers</span>
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {validRecipients.length > 0 && (
                <span className="badge badge-success" style={{ fontSize: "0.6875rem" }}>
                  <CheckCircle2 size={11} />
                  {validRecipients.length} valid recipient{validRecipients.length > 1 ? "s" : ""}
                </span>
              )}
              {invalidCount > 0 && (
                <span className="badge badge-danger" style={{ fontSize: "0.6875rem" }}>
                  <AlertCircle size={11} />
                  {invalidCount} invalid
                </span>
              )}
              <span className="label-tag">Comma or newline separated</span>
            </div>
          </label>
          <textarea
            className={`form-control ${isAutoSend ? "is-locked" : ""}`}
            placeholder="user1@example.com, client2@domain.com&#10;subscriber3@mail.com"
            value={recipientsRaw}
            onChange={(e) => setRecipientsRaw(e.target.value)}
            disabled={isAutoSend}
            rows={3}
            style={{ resize: "vertical" }}
            required
          />
          {/* Quick preset recipient helpers */}
          {!isAutoSend && (
            <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: "0.71875rem", padding: "3px 8px" }}
                onClick={() =>
                  setRecipientsRaw(
                    "demo.lead1@startup.io, partner2@venture.com, subscriber3@cloudtech.org"
                  )
                }
              >
                <Users size={11} />
                Sample Bulk List (3)
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: "0.71875rem", padding: "3px 8px" }}
                onClick={() => setRecipientsRaw("")}
              >
                <RotateCcw size={11} />
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Row 3: Subject */}
        <div className="form-group">
          <label className="form-label">
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {isAutoSend && <Lock size={12} color="var(--status-warning)" />}
              <span>Email Subject</span>
            </span>
            <span className="label-tag">Direct inbox title</span>
          </label>
          <input
            type="text"
            className={`form-control ${isAutoSend ? "is-locked" : ""}`}
            placeholder="e.g. Important Update: Product Launch & Automation Announcement"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isAutoSend}
            required
          />
        </div>

        {/* Row 4: Rich Email Content & Image Embed Trigger */}
        <div className="form-group">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <label className="form-label" style={{ marginBottom: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {isAutoSend && <Lock size={12} color="var(--status-warning)" />}
                <span>Email Content (HTML / Text)</span>
              </span>
            </label>

            {/* Import Image Trigger Button */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                fontSize: "0.75rem",
                padding: "4px 10px",
                borderColor: "rgba(99, 102, 241, 0.4)",
              }}
              onClick={onOpenImageModal}
              disabled={isAutoSend}
            >
              <ImageIcon size={13} color="var(--accent-primary)" />
              <span>Import & Embed Image</span>
            </button>
          </div>

          <textarea
            className={`form-control ${isAutoSend ? "is-locked" : ""}`}
            placeholder="<h3>Hello Team,</h3><p>Your message content here...</p>"
            value={contentHtml}
            onChange={(e) => setContentHtml(e.target.value)}
            disabled={isAutoSend}
            rows={8}
            style={{ resize: "vertical", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}
            required
          />
        </div>

        {/* Schedule Date & Time (Enabled when Auto-Send is ON) */}
        {isAutoSend && (
          <div
            style={{
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                }}
              >
                <Clock size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: "0.875rem", fontWeight: 700 }}>Automation Scheduler</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Timely dispatch timestamp
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={16} color="var(--text-secondary)" />
              <input
                type="datetime-local"
                className="form-control"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                style={{ width: "auto", padding: "8px 12px", fontSize: "0.8125rem" }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
          {isAutoSend ? (
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
                padding: "12px 24px",
              }}
              disabled={isSending}
            >
              <Clock size={16} />
              <span>{isSending ? "Scheduling..." : "Arm & Schedule Automation"}</span>
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: "12px 28px" }}
              disabled={isSending}
            >
              <Send size={16} />
              <span>{isSending ? "Dispatching..." : `Send Now (${validRecipients.length} Recipient${validRecipients.length === 1 ? "" : "s"})`}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
