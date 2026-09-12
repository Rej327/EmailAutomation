"use client";

import React, { useState } from "react";
import { Monitor, Smartphone, CheckCircle, Code, Eye } from "lucide-react";

interface EmailPreviewProps {
  sender: string;
  recipients: string[];
  subject: string;
  contentHtml: string;
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  sender,
  recipients,
  subject,
  contentHtml,
}) => {
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [showRawCode, setShowRawCode] = useState(false);

  // Fallback content if blank
  const displaySender = sender.trim() || "jeffdev2701@gmail.com";
  const displayRecipients =
    recipients.length > 0 ? recipients.join(", ") : "recipient@example.com";
  const displaySubject = subject.trim() || "(No subject)";

  // Check if content contains images
  const hasImages = /<img[^>]+src="([^">]+)"/g.test(contentHtml);

  // Wrap content inside a standard professional email template
  const wrappedEmailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            line-height: 1.6;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .email-header {
            padding: 24px 32px;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: #ffffff;
          }
          .email-body {
            padding: 32px;
            font-size: 15px;
          }
          .email-body img {
            max-width: 100% !important;
            height: auto !important;
            display: block;
          }
          .email-footer {
            padding: 24px 32px;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
            text-align: center;
          }
          .email-footer a {
            color: #6366f1;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div style="padding: 20px 10px;">
          <div class="email-wrapper">
            <div class="email-header">
              <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff;">AutoMail Pro</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9; color: #e0e7ff;">Official Notification</p>
            </div>
            <div class="email-body">
              ${contentHtml || "<p style='color: #94a3b8; font-style: italic;'>Start typing in the composer to preview your email...</p>"}
            </div>
            <div class="email-footer">
              <p style="margin: 0 0 8px 0;">You received this email because you are registered with AutoMail Flow.</p>
              <p style="margin: 0;">Sent by <strong>${displaySender}</strong> • <a href="#">Unsubscribe</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return (
    <div
      className="glass-card"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "620px",
        overflow: "hidden",
      }}
    >
      {/* Header controls */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          background: "rgba(255, 255, 255, 0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Eye size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Live Email Preview</h3>
          {hasImages && (
            <span className="badge badge-success" style={{ fontSize: "0.6875rem" }}>
              <CheckCircle size={11} />
              Images Rendered
            </span>
          )}
        </div>

        {/* Viewport and Code toggles */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              display: "flex",
              background: "var(--bg-tertiary)",
              borderRadius: "var(--radius-sm)",
              padding: "2px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              className="btn-icon"
              style={{
                padding: "6px 8px",
                background:
                  deviceView === "desktop" && !showRawCode
                    ? "var(--accent-primary)"
                    : "transparent",
                color:
                  deviceView === "desktop" && !showRawCode ? "#ffffff" : "var(--text-secondary)",
              }}
              onClick={() => {
                setDeviceView("desktop");
                setShowRawCode(false);
              }}
              title="Desktop View"
            >
              <Monitor size={15} />
            </button>
            <button
              className="btn-icon"
              style={{
                padding: "6px 8px",
                background:
                  deviceView === "mobile" && !showRawCode
                    ? "var(--accent-primary)"
                    : "transparent",
                color:
                  deviceView === "mobile" && !showRawCode ? "#ffffff" : "var(--text-secondary)",
              }}
              onClick={() => {
                setDeviceView("mobile");
                setShowRawCode(false);
              }}
              title="Mobile View (375px)"
            >
              <Smartphone size={15} />
            </button>
          </div>

          <button
            className="btn btn-outline"
            style={{
              padding: "6px 10px",
              fontSize: "0.75rem",
              background: showRawCode ? "var(--bg-tertiary)" : "transparent",
              color: showRawCode ? "var(--accent-primary)" : "var(--text-secondary)",
            }}
            onClick={() => setShowRawCode(!showRawCode)}
          >
            <Code size={13} />
            <span>HTML</span>
          </button>
        </div>
      </div>

      {/* Simulated Email Client Envelope Headers */}
      <div
        style={{
          padding: "12px 20px",
          background: "rgba(10, 15, 26, 0.7)",
          borderBottom: "1px solid var(--border-subtle)",
          fontSize: "0.8125rem",
        }}
      >
        <div style={{ display: "flex", gap: "10px", marginBottom: "4px" }}>
          <span style={{ color: "var(--text-muted)", width: "55px" }}>From:</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{displaySender}</span>
        </div>
        <div style={{ display: "flex", gap: "10px", marginBottom: "4px" }}>
          <span style={{ color: "var(--text-muted)", width: "55px" }}>To:</span>
          <span
            style={{
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "480px",
            }}
          >
            {displayRecipients}
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <span style={{ color: "var(--text-muted)", width: "55px" }}>Subject:</span>
          <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>{displaySubject}</span>
        </div>
      </div>

      {/* Email Body Rendering Canvas */}
      <div
        style={{
          flex: 1,
          padding: "24px 16px",
          background: "radial-gradient(circle at center, #1a2335 0%, #0c111d 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          overflowY: "auto",
        }}
      >
        {showRawCode ? (
          <pre
            style={{
              width: "100%",
              height: "100%",
              minHeight: "400px",
              padding: "16px",
              background: "#080c14",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              color: "#a5b4fc",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              overflow: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {wrappedEmailHtml}
          </pre>
        ) : (
          <div
            style={{
              width: deviceView === "mobile" ? "375px" : "100%",
              maxWidth: deviceView === "mobile" ? "375px" : "620px",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              borderRadius: deviceView === "mobile" ? "24px" : "8px",
              overflow: "hidden",
              boxShadow:
                deviceView === "mobile"
                  ? "0 0 0 8px #1e293b, 0 20px 40px rgba(0,0,0,0.7)"
                  : "0 10px 25px rgba(0,0,0,0.3)",
              background: "#ffffff",
            }}
          >
            {deviceView === "mobile" && (
              <div
                style={{
                  background: "#0f172a",
                  padding: "6px 0",
                  textAlign: "center",
                  borderBottom: "1px solid #334155",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "4px",
                    background: "#475569",
                    borderRadius: "2px",
                    margin: "0 auto",
                  }}
                />
              </div>
            )}
            <iframe
              srcDoc={wrappedEmailHtml}
              title="Email Preview"
              style={{
                width: "100%",
                height: deviceView === "mobile" ? "540px" : "480px",
                border: "none",
                display: "block",
                background: "#f1f5f9",
              }}
              sandbox="allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  );
};
