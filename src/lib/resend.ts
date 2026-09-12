import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "re_placeholder_key";

export const isResendConfigured =
  Boolean(resendApiKey) &&
  resendApiKey.startsWith("re_") &&
  !resendApiKey.includes("placeholder") &&
  !resendApiKey.includes("123456789");

export const resend = new Resend(isResendConfigured ? resendApiKey : "re_dummy_mock_key");

export interface SendEmailPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  message: string;
  deliveryCount: number;
  data?: unknown;
  isMock: boolean;
  mockId?: string;
  error?: string;
}

/**
 * Dispatch single or bulk emails via Resend or simulated mock
 */
export async function sendBulkEmails(payload: SendEmailPayload): Promise<SendEmailResult> {
  const { from, to, subject, html } = payload;

  if (!to || to.length === 0) {
    return {
      success: false,
      message: "No recipients provided",
      deliveryCount: 0,
      isMock: !isResendConfigured,
      error: "Recipient list is empty",
    };
  }

  // Filter and deduplicate valid emails
  const validRecipients = Array.from(
    new Set(to.map((e) => e.trim().toLowerCase()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))
  );

  if (validRecipients.length === 0) {
    return {
      success: false,
      message: "No valid email addresses found",
      deliveryCount: 0,
      isMock: !isResendConfigured,
      error: "All provided recipient addresses are invalid",
    };
  }

  // If Resend is NOT configured with real keys, simulate successful delivery
  if (!isResendConfigured) {
    // Artificial small delay to simulate network call
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      message: `Simulated bulk dispatch to ${validRecipients.length} recipient${validRecipients.length > 1 ? "s" : ""} (Demo Mode)`,
      deliveryCount: validRecipients.length,
      isMock: true,
      mockId: `mock_del_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      data: {
        recipients: validRecipients,
        sentAt: new Date().toISOString(),
      },
    };
  }

  // Real Resend delivery
  try {
    // If multiple recipients, use batch or send to list
    // Resend allows sending to an array of recipients up to 50 recipients per call
    // For large bulk lists, we chunk into batches of 50
    const chunkSize = 50;
    const chunks: string[][] = [];
    for (let i = 0; i < validRecipients.length; i += chunkSize) {
      chunks.push(validRecipients.slice(i, i + chunkSize));
    }

    const results = [];
    for (const chunk of chunks) {
      const response = await resend.emails.send({
        from: from,
        to: chunk,
        subject: subject,
        html: html,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send emails via Resend");
      }
      results.push(response.data);
    }

    return {
      success: true,
      message: `Successfully dispatched to ${validRecipients.length} recipient${validRecipients.length > 1 ? "s" : ""} via Resend`,
      deliveryCount: validRecipients.length,
      isMock: false,
      data: results,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown email delivery error";
    return {
      success: false,
      message: `Delivery failed: ${errorMsg}`,
      deliveryCount: 0,
      isMock: false,
      error: errorMsg,
    };
  }
}
