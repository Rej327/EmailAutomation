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
  Timer,
  ChevronDown,
  ChevronUp,
  Zap,
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

export const DYNAMIC_CUSTOMER_DATA = {
  accountName: "Jefferson Resurreccion",
  accountNumber: "63877 7001 868",
  ticketNumber: "CS-12950",
  addressText: "105 Gumamela Extension, Mangahan Pasig City",
  addressMapsUrl:
    "https://www.google.com/maps/search/105+Gumamela+Extension,+Mangahan+Pasig+City?entry=gmail&source=g",
  contactNumber: "09502433069",
  convergeEmail: "help_alpha@s2sinternet.com",
  ntcEmail: "consumer@ntc.gov.ph",
  outageStartDate: "2026-09-08T00:00:00",
};

/**
 * Calculates human-readable outage duration dynamically since September 8, 2026
 */
export const getOutageDurationText = (
  startDateStr: string = DYNAMIC_CUSTOMER_DATA.outageStartDate
): string => {
  const startDate = new Date(startDateStr);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - startDate.getTime());
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days === 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  if (hours === 0) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  return `${days} day${days === 1 ? "" : "s"} and ${hours} hour${hours === 1 ? "" : "s"}`;
};

/**
 * Resolves all dynamic placeholders (e.g. {{OUTAGE_DURATION}}, {{CUSTOMER_NAME}}, etc.)
 * For NTC escalation emails, excludes contact number for privacy.
 */
export const resolveTemplateVariables = (
  rawText: string,
  options?: { isNtcTemplate?: boolean }
): string => {
  if (!rawText) return "";
  const isNtc = options?.isNtcTemplate ?? false;
  const duration = getOutageDurationText();
  const nowFormatted = new Date().toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const addressLinkHtml = `<a href="${DYNAMIC_CUSTOMER_DATA.addressMapsUrl}" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline;">${DYNAMIC_CUSTOMER_DATA.addressText}</a>`;

  let text = rawText
    .replace(/\{\{OUTAGE_DURATION\}\}/g, duration)
    .replace(/\{\{ACCOUNT_NUMBER\}\}/g, DYNAMIC_CUSTOMER_DATA.accountNumber)
    .replace(/\{\{SERVICE_ADDRESS\}\}/g, addressLinkHtml)
    .replace(/\{\{CURRENT_DATE_TIME\}\}/g, nowFormatted)
    .replace(/\{\{TICKET_NUMBER\}\}/g, DYNAMIC_CUSTOMER_DATA.ticketNumber);

  if (isNtc) {
    // Privacy safeguard: Exclude name and contact number from NTC escalation email
    text = text
      .replace(/<strong>Jefferson Resurreccion<\/strong><br\s*\/?>/gi, "")
      .replace(/<strong>\{\{CUSTOMER_NAME\}\}<\/strong><br\s*\/?>/gi, "")
      .replace(/\{\{CUSTOMER_NAME\}\}/g, "")
      .replace(/<br\s*\/?>\s*Contact Number:\s*\{\{CONTACT_NUMBER\}\}/gi, "")
      .replace(/Contact Number:\s*\{\{CONTACT_NUMBER\}\}/gi, "")
      .replace(/<br\s*\/?>\s*Contact Number:\s*09502433069/gi, "")
      .replace(/Contact Number:\s*09502433069/gi, "")
      .replace(/\{\{CONTACT_NUMBER\}\}/g, "");
  } else {
    text = text
      .replace(/\{\{CUSTOMER_NAME\}\}/g, DYNAMIC_CUSTOMER_DATA.accountName)
      .replace(/\{\{CONTACT_NUMBER\}\}/g, DYNAMIC_CUSTOMER_DATA.contactNumber);
  }

  return text;
};

/**
 * Calculates interval, cadence, and per-recipient allocation for the 7:00 AM - 5:00 PM auto-schedule.
 * (e.g. 90 emails across 10 hours = 6m 40s per email; 45 emails per recipient if 2 recipients)
 */
export const calculateAutoSchedule = (
  totalEmails: number = 90,
  startHour: number = 7,
  endHour: number = 17,
  recipientCount: number = 2
) => {
  const totalHours = Math.max(1, endHour - startHour);
  const totalMinutes = totalHours * 60;
  const totalSeconds = totalMinutes * 60;

  const emailsPerHour = totalEmails / totalHours;
  const intervalSeconds = Math.round(totalSeconds / totalEmails); // 36000 / 90 = 400 seconds
  const intervalMinutesPart = Math.floor(intervalSeconds / 60); // 6 mins
  const intervalSecondsPart = intervalSeconds % 60; // 40 secs

  const emailsPerRecipient =
    recipientCount > 0 ? Math.floor(totalEmails / recipientCount) : totalEmails;

  // Calculate next eligible dispatch time:
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(startHour, 0, 0, 0);

  const todayEnd = new Date(now);
  todayEnd.setHours(endHour, 0, 0, 0);

  let nextDispatchDate: Date;
  if (now.getTime() < todayStart.getTime()) {
    // Before 7 AM today -> starts at 7:00 AM today
    nextDispatchDate = todayStart;
  } else if (now.getTime() >= todayEnd.getTime()) {
    // After 5 PM today -> starts at 7:00 AM tomorrow
    nextDispatchDate = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  } else {
    // During active window (7 AM - 5 PM) -> next interval slot
    const nextSlot = new Date(now.getTime() + intervalSeconds * 1000);
    nextDispatchDate =
      nextSlot.getTime() > todayEnd.getTime()
        ? new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
        : nextSlot;
  }

  // Format local ISO datetime-local string (YYYY-MM-DDTHH:mm)
  const localIso = new Date(
    nextDispatchDate.getTime() - nextDispatchDate.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16);

  return {
    totalEmails,
    startHour,
    endHour,
    totalHours,
    totalMinutes,
    emailsPerHour,
    intervalSeconds,
    intervalMinutesPart,
    intervalSecondsPart,
    intervalText: `${intervalMinutesPart}m ${intervalSecondsPart > 0 ? `${intervalSecondsPart}s` : ""}`.trim(),
    emailsPerRecipient,
    nextDispatchDate,
    nextDispatchIso: localIso,
  };
};

/**
 * Generates the full 90-email timeline preview showing alternating recipient slots
 */
export const generateTimelinePreview = (
  recipients: string[],
  totalSlots: number = 90,
  startHour: number = 7,
  endHour: number = 17
) => {
  const list =
    recipients.length > 0
      ? recipients
      : ["help_alpha@s2sinternet.com", "consumer@ntc.gov.ph"];
  const items = [];
  const startMinutes = startHour * 60; // 420
  const totalWindowMinutes = (endHour - startHour) * 60; // 600
  const intervalMinutes = totalWindowMinutes / totalSlots; // 6.6666...

  for (let i = 0; i < totalSlots; i++) {
    const slotMinutes = startMinutes + i * intervalMinutes;
    const hrs = Math.floor(slotMinutes / 60);
    const mins = Math.floor(slotMinutes % 60);
    const secs = Math.round((slotMinutes % 1) * 60);
    const ampm = hrs >= 12 ? "PM" : "AM";
    const displayHrs = hrs > 12 ? hrs - 12 : hrs === 0 ? 12 : hrs;
    const timeStr = `${String(displayHrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} ${ampm}`;
    const targetRecipient = list[i % list.length];
    items.push({
      slot: i + 1,
      time: timeStr,
      recipient: targetRecipient,
    });
  }
  return items;
};

const TEMPLATES = [
  {
    name: "Internet Service Complaint - Converge",
    defaultRecipients: "help_alpha@s2sinternet.com",
    subject:
      "Formal Complaint: Prolonged Internet Service Interruption - LOS Blinking Red Since September 8, 2026 (Ticket: CS-12950)",
    content: `<h3>Dear Converge Customer Support,</h3>

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

<p style="color: #64748b;">
Regards,<br>
<strong>Jefferson Resurreccion</strong><br>
Account Number o Modem SN: 63877 7001 868<br>
Ticket Number: {{TICKET_NUMBER}}<br>
Address: <a href="https://www.google.com/maps/search/105+Gumamela+Extension,+Mangahan+Pasig+City?entry=gmail&source=g" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline;">105 Gumamela Extension, Mangahan Pasig City</a><br>
Contact Number: 09502433069
</p>`,
  },

  {
    name: "Internet Complaint - Converge + NTC",
    defaultRecipients: "help_alpha@s2sinternet.com, consumer@ntc.gov.ph",
    subject:
      "Formal Complaint and NTC Escalation: Prolonged Converge Internet Service Interruption Since September 8, 2026 (Ticket: CS-12950)",
    content: `<h3>Dear Converge Customer Support and National Telecommunications Commission (NTC),</h3>

<p>
I am submitting this formal complaint regarding the prolonged interruption
of my Converge internet service and the lack of a timely resolution.
</p>

<div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
  <p style="margin: 0 0 8px 0; font-weight: 600; color: #991b1b;">
    Complaint Summary
  </p>

  <p style="margin: 4px 0; color: #7f1d1d;">
    <strong>Internet Provider:</strong> Converge ICT Solutions Inc.
  </p>

  <p style="margin: 4px 0; color: #7f1d1d;">
    <strong>Converge Ticket Number:</strong> {{TICKET_NUMBER}}
  </p>

  <p style="margin: 4px 0; color: #7f1d1d;">
    <strong>Issue:</strong> LOS signal continuously blinking red
  </p>

  <p style="margin: 4px 0; color: #7f1d1d;">
    <strong>Service Interruption Started:</strong> September 8, 2026
  </p>

  <p style="margin: 4px 0; color: #7f1d1d;">
    <strong>Current Duration Without Service:</strong> {{OUTAGE_DURATION}}
  </p>

  <p style="margin: 4px 0; color: #7f1d1d;">
    <strong>Current Status:</strong> No Internet Connection
  </p>
</div>

<p>
The LOS indicator on my Converge modem has been continuously blinking red
since <strong>September 8, 2026</strong>. As of this complaint, the internet
connection remains unavailable.
</p>

<p>
I am a paying customer who has continuously paid for the subscribed service.
However, the service has been unavailable for approximately
<strong>{{OUTAGE_DURATION}}</strong>.
</p>

<p>
This prolonged interruption has caused significant inconvenience and has
affected my ability to perform normal online activities and work-related
tasks. Despite paying for the service, I have effectively been without
internet connectivity for the stated period.
</p>

<h4>Requested Resolution</h4>

<p>
I respectfully request that Converge immediately:
</p>

<ul>
  <li>Investigate and resolve the LOS issue.</li>
  <li>Restore the internet connection as soon as possible.</li>
  <li>Provide a specific explanation for the prolonged service interruption.</li>
  <li>Provide a clear estimated restoration time.</li>
  <li>Provide an updated status on Ticket Number: <strong>{{TICKET_NUMBER}}</strong>.</li>
  <li>Review the billing charges corresponding to the period when the service was unavailable.</li>
  <li>Provide an appropriate billing adjustment, rebate, or service credit for the period without service.</li>
</ul>

<h4>Request for NTC Assistance</h4>

<p>
I am requesting the assistance of the
<strong>National Telecommunications Commission (NTC)</strong> regarding this
matter, particularly if the prolonged service interruption remains unresolved
despite reporting the issue to the service provider.
</p>

<p>
I respectfully request that this complaint be documented and that the
appropriate action or assistance be provided to ensure that the service
provider addresses the prolonged interruption and provides a reasonable
resolution to the affected customer.
</p>

<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; margin: 24px 0; border-radius: 6px;">
  <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e293b;">
    Complaint Timeline & Reference
  </p>

  <p style="margin: 4px 0; color: #475569;">
    <strong>Converge Ticket Number:</strong> {{TICKET_NUMBER}}
  </p>

  <p style="margin: 4px 0; color: #475569;">
    <strong>Start of Interruption:</strong> September 8, 2026
  </p>

  <p style="margin: 4px 0; color: #475569;">
    <strong>Duration Without Internet:</strong> {{OUTAGE_DURATION}}
  </p>

  <p style="margin: 4px 0; color: #475569;">
    <strong>Last Update:</strong> {{CURRENT_DATE_TIME}}
  </p>
</div>

<p>
I will continue documenting the duration of the service interruption and
requesting updates until the connection is fully restored.
</p>

<p>
I hope this matter can be resolved promptly and that the appropriate billing
adjustment for the period without service will be provided.
</p>

<p style="margin-top: 32px;">
Thank you for your attention and assistance.
</p>

<p style="color: #64748b;">
Regards,<br>
Account Number o Modem SN: 63877 7001 868<br>
Ticket Number: {{TICKET_NUMBER}}<br>
Address: <a href="https://www.google.com/maps/search/105+Gumamela+Extension,+Mangahan+Pasig+City?entry=gmail&source=g" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline;">105 Gumamela Extension, Mangahan Pasig City</a>
</p>`,
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
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
  );
  const invalidCount = recipientList.length - validRecipients.length;

  const [showTimeline, setShowTimeline] = useState(false);
  const [countdownText, setCountdownText] = useState("");
  const autoTargetEmails = 90;
  const autoSchedule = calculateAutoSchedule(
    autoTargetEmails,
    7,
    17,
    validRecipients.length || 2
  );

  // Live countdown ticker to next auto-dispatch
  React.useEffect(() => {
    if (!isAutoSend || !scheduledAt) {
      setCountdownText("");
      return;
    }
    const updateCountdown = () => {
      const target = new Date(scheduledAt).getTime();
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setCountdownText("Ready to dispatch now");
        return;
      }
      const totalSec = Math.floor(diff / 1000);
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      if (hrs > 0) {
        setCountdownText(`${hrs}h ${mins}m ${secs}s`);
      } else {
        const mm = String(mins).padStart(2, "0");
        const ss = String(secs).padStart(2, "0");
        setCountdownText(`${mm}:${ss}`);
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [isAutoSend, scheduledAt]);

  const handleToggleAutoSend = (checked: boolean) => {
    setIsAutoSend(checked);
    if (checked) {
      const schedule = calculateAutoSchedule(
        90,
        7,
        17,
        validRecipients.length || 2
      );
      setScheduledAt(schedule.nextDispatchIso);
      const perRecipientText =
        validRecipients.length === 2
          ? "45 emails each"
          : `${schedule.emailsPerRecipient} emails each`;
      toast.info(
        `Auto-Send Armed: 90 emails scheduled between 7:00 AM – 5:00 PM (Every 6m 40s • ${perRecipientText})`,
        {
          icon: <Lock size={16} color="#f59e0b" />,
          duration: 4500,
        }
      );
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
    const isNtc = template.name.includes("NTC");
    const resolvedSubject = resolveTemplateVariables(template.subject, {
      isNtcTemplate: isNtc,
    });
    const resolvedContent = resolveTemplateVariables(template.content, {
      isNtcTemplate: isNtc,
    });

    setSubject(resolvedSubject);
    setContentHtml(resolvedContent);
    if (template.defaultRecipients) {
      setRecipientsRaw(template.defaultRecipients);
    }
    toast.success(
      `Applied "${template.name}" with dynamic duration (${getOutageDurationText()})`
    );
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

    // Safety guard: guarantee any unrendered {{OUTAGE_DURATION}} or template tags are resolved before dispatch!
    const isNtc =
      contentHtml.includes("National Telecommunications Commission") ||
      recipientsRaw.includes("ntc.gov.ph");
    const finalContent = resolveTemplateVariables(contentHtml, {
      isNtcTemplate: isNtc,
    });
    const finalSubject = resolveTemplateVariables(subject, {
      isNtcTemplate: isNtc,
    });

    if (finalContent !== contentHtml) {
      setContentHtml(finalContent);
    }
    if (finalSubject !== subject) {
      setSubject(finalSubject);
    }

    await onSendEmail({
      sender,
      recipients: validRecipients,
      subject: finalSubject,
      contentHtml: finalContent,
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
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              Email Campaign Composer
            </h2>
            {isAutoSend ? (
              <span className="field-lock-badge">
                <Lock size={12} />
                Fields Locked
              </span>
            ) : (
              <span
                className="badge badge-info"
                style={{ fontSize: "0.6875rem" }}
              >
                <Unlock size={11} />
                Editable
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              marginTop: "2px",
            }}
          >
            Configure receivers, rich content, and dispatch automated or manual
            schedules
          </p>
        </div>

        {/* Auto Send Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: isAutoSend
              ? "rgba(16, 185, 129, 0.08)"
              : "rgba(255, 255, 255, 0.03)",
            border: isAutoSend
              ? "1px solid rgba(16, 185, 129, 0.3)"
              : "1px solid var(--border-subtle)",
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
                  color: isAutoSend
                    ? "var(--status-success)"
                    : "var(--text-primary)",
                }}
              >
                Auto Send
              </span>
              {isAutoSend && (
                <span
                  className="badge badge-success"
                  style={{ fontSize: "0.65rem", padding: "1px 6px" }}
                >
                  ARMED
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.71875rem", color: "var(--text-muted)" }}>
              {isAutoSend
                ? "Automation active • Fields locked"
                : "Manual dispatch mode"}
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
              <strong>Lock Active:</strong> Email fields are locked to safeguard
              scheduled automation. Turn off Auto Send to edit.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            style={{
              fontSize: "0.75rem",
              padding: "4px 10px",
              borderColor: "rgba(245, 158, 11, 0.4)",
            }}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "0.78125rem",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              <Sparkles
                size={12}
                style={{ display: "inline", marginRight: "4px" }}
              />
              Quick Templates:
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                className="badge badge-warning"
                style={{
                  fontSize: "0.71875rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                }}
                title="Calculated dynamically from September 8, 2026 to current time"
              >
                <Clock size={11} />
                Live Outage: {getOutageDurationText()}
              </span>
              <span
                className="badge badge-info"
                style={{
                  fontSize: "0.71875rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                }}
              >
                <Users size={11} />
                Jefferson Resurreccion (63877 7001 868)
              </span>
              <span
                className="badge badge-success"
                style={{
                  fontSize: "0.71875rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                }}
              >
                <FileText size={11} />
                Ticket: CS-12950
              </span>
            </div>
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
                <span
                  className="badge badge-success"
                  style={{ fontSize: "0.6875rem" }}
                >
                  <CheckCircle2 size={11} />
                  {validRecipients.length} valid recipient
                  {validRecipients.length > 1 ? "s" : ""}
                </span>
              )}
              {invalidCount > 0 && (
                <span
                  className="badge badge-danger"
                  style={{ fontSize: "0.6875rem" }}
                >
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
            <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: "0.71875rem", padding: "3px 8px" }}
                onClick={() => setRecipientsRaw("help_alpha@s2sinternet.com")}
              >
                <Users size={11} />
                Converge (help_alpha@s2sinternet.com)
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: "0.71875rem", padding: "3px 8px" }}
                onClick={() =>
                  setRecipientsRaw("help_alpha@s2sinternet.com, consumer@ntc.gov.ph")
                }
              >
                <Users size={11} />
                Converge + NTC
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: "0.71875rem", padding: "3px 8px" }}
                onClick={() =>
                  setRecipientsRaw(
                    "demo.lead1@startup.io, partner2@venture.com, subscriber3@cloudtech.org",
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
              <span
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
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
            style={{
              resize: "vertical",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
            }}
            required
          />
        </div>

        {/* Auto-Send Smart Schedule Calculator & Timeline (Enabled when Auto-Send is ON) */}
        {isAutoSend && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.09) 0%, rgba(16, 185, 129, 0.06) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
              marginBottom: "24px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "var(--radius-sm)",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    boxShadow: "0 2px 10px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <Clock size={18} />
                </div>
                <div>
                  <h4
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>Auto-Send Schedule Calculator</span>
                    <span
                      className="badge badge-success"
                      style={{ fontSize: "0.6875rem", padding: "2px 8px" }}
                    >
                      7:00 AM – 5:00 PM Active Window
                    </span>
                  </h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Automated cadence distribution for selected recipient emails
                  </p>
                </div>
              </div>

              {countdownText && (
                <span
                  className="badge badge-warning"
                  style={{
                    fontSize: "0.78125rem",
                    padding: "4px 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    fontWeight: 600,
                  }}
                >
                  <Timer size={13} />
                  Next auto-dispatch in: {countdownText}
                </span>
              )}
            </div>

            {/* Calculations Grid (4 metrics) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              {/* Metric 1: Total Volume */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.25)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 12px",
                }}
              >
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "block" }}>
                  Daily Total Emails
                </span>
                <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  {autoSchedule.totalEmails} emails
                </span>
                <span style={{ fontSize: "0.6875rem", color: "var(--accent-primary)", display: "block" }}>
                  10-Hour Total Window
                </span>
              </div>

              {/* Metric 2: Cadence / Interval */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.25)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 12px",
                }}
              >
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "block" }}>
                  Dispatch Cadence
                </span>
                <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "#10b981" }}>
                  Every 6m 40s
                </span>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "block" }}>
                  9 emails / hour
                </span>
              </div>

              {/* Metric 3: Distribution per recipient */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.25)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 12px",
                }}
              >
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "block" }}>
                  Per Recipient Load
                </span>
                <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "#38bdf8" }}>
                  {validRecipients.length === 2 ? "45 each" : `${autoSchedule.emailsPerRecipient} each`}
                </span>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "block" }}>
                  {validRecipients.length} recipient{validRecipients.length === 1 ? "" : "s"} selected
                </span>
              </div>

              {/* Metric 4: Active Window Hours */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.25)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 12px",
                }}
              >
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "block" }}>
                  Active Time Window
                </span>
                <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "#f59e0b" }}>
                  7 AM – 5 PM
                </span>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "block" }}>
                  600 min operating span
                </span>
              </div>
            </div>

            {/* Recipient Distribution Breakdown Pill */}
            {validRecipients.length > 0 && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "16px",
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                }}
              >
                <strong style={{ color: "var(--text-primary)" }}>Automated Distribution Plan:</strong>{" "}
                {validRecipients.map((rec, i) => (
                  <span key={rec} style={{ marginRight: "14px", display: "inline-block" }}>
                    • <code style={{ color: "#a5b4fc" }}>{rec}</code>:{" "}
                    <strong style={{ color: "#38bdf8" }}>
                      {validRecipients.length === 2 ? "45" : autoSchedule.emailsPerRecipient} emails
                    </strong>
                  </span>
                ))}
              </div>
            )}

            {/* Controls: Target Scheduled Time & Quick Actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                paddingTop: "12px",
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={15} color="var(--text-secondary)" />
                  <span style={{ fontSize: "0.78125rem", fontWeight: 600 }}>Next Auto-Send At:</span>
                </div>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  style={{
                    width: "auto",
                    padding: "6px 12px",
                    fontSize: "0.8125rem",
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: "0.71875rem", padding: "6px 12px" }}
                  onClick={() => {
                    const sched = calculateAutoSchedule(90, 7, 17, validRecipients.length || 2);
                    setScheduledAt(sched.nextDispatchIso);
                    toast.success("Applied 7 AM – 5 PM auto-schedule (Every 6m 40s)");
                  }}
                >
                  <RotateCcw size={11} />
                  Reset to Next 7AM-5PM Slot
                </button>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: "0.71875rem", padding: "6px 12px" }}
                onClick={() => setShowTimeline(!showTimeline)}
              >
                {showTimeline ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                <span>{showTimeline ? "Hide Schedule Timeline" : "View 90-Email Timeline"}</span>
              </button>
            </div>

            {/* Collapsible 90-Email Timeline Preview */}
            {showTimeline && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px",
                  background: "#080c14",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-subtle)",
                  maxHeight: "220px",
                  overflowY: "auto",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <p style={{ color: "#10b981", fontWeight: 600, marginBottom: "8px" }}>
                  Paced Dispatch Sequence: 90 Emails Every 6m 40s (07:00 AM – 05:00 PM)
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "6px" }}>
                  {generateTimelinePreview(validRecipients).map((item) => (
                    <div
                      key={item.slot}
                      style={{
                        padding: "5px 8px",
                        background: "rgba(255, 255, 255, 0.03)",
                        borderRadius: "4px",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
                        #{item.slot} {item.time}
                      </span>
                      <span
                        style={{
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "140px",
                        }}
                      >
                        {item.recipient}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
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
              <span>
                {isSending ? "Scheduling..." : "Arm & Schedule Automation"}
              </span>
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: "12px 28px" }}
              disabled={isSending}
            >
              <Send size={16} />
              <span>
                {isSending
                  ? "Dispatching..."
                  : `Send Now (${validRecipients.length} Recipient${validRecipients.length === 1 ? "" : "s"})`}
              </span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
