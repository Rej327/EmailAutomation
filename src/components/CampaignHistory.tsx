"use client";

import React from "react";
import {
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Send,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

export interface CampaignRecord {
  id: string;
  sender: string;
  recipients: string[];
  subject: string;
  contentHtml: string;
  isAutoSend: boolean;
  scheduledAt?: string;
  status: "SENT" | "SCHEDULED" | "SENDING" | "FAILED";
  sentAt?: string;
  createdAt: string;
  isMock?: boolean;
}

interface CampaignHistoryProps {
  campaigns: CampaignRecord[];
  onRefresh: () => void;
  onTriggerScheduled: (campaignId: string) => Promise<void>;
  onSelectCampaign: (campaign: CampaignRecord) => void;
}

export const CampaignHistory: React.FC<CampaignHistoryProps> = ({
  campaigns,
  onRefresh,
  onTriggerScheduled,
  onSelectCampaign,
}) => {
  const getStatusBadge = (status: CampaignRecord["status"]) => {
    switch (status) {
      case "SENT":
        return (
          <span className="badge badge-success">
            <CheckCircle2 size={12} />
            Delivered
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="badge badge-warning">
            <Clock size={12} />
            Scheduled
          </span>
        );
      case "SENDING":
        return (
          <span className="badge badge-info">
            <RefreshCw size={12} className="animate-spin" />
            Sending...
          </span>
        );
      case "FAILED":
        return (
          <span className="badge badge-danger">
            <AlertCircle size={12} />
            Failed
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="glass-card" style={{ padding: "24px", marginTop: "28px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-md)",
              background: "rgba(99, 102, 241, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-primary)",
            }}
          >
            <History size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>
              Sent Campaigns & Automation Logs
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Audit trail of bulk email dispatches and scheduled triggers
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            onRefresh();
            toast.success("Logs refreshed!");
          }}
          className="btn btn-secondary"
          style={{ fontSize: "0.8125rem", padding: "6px 14px" }}
        >
          <RefreshCw size={13} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Table / List */}
      {campaigns.length === 0 ? (
        <div
          style={{
            padding: "48px 20px",
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.01)",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--border-subtle)",
          }}
        >
          <History size={36} color="var(--text-muted)" style={{ margin: "0 auto 12px auto" }} />
          <h4 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            No campaigns dispatched yet
          </h4>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Compose and send or schedule an email campaign above to view real-time delivery logs.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.875rem",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <th style={{ padding: "12px 14px" }}>Subject</th>
                <th style={{ padding: "12px 14px" }}>Recipients</th>
                <th style={{ padding: "12px 14px" }}>Mode</th>
                <th style={{ padding: "12px 14px" }}>Status</th>
                <th style={{ padding: "12px 14px" }}>Timestamp</th>
                <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((camp) => (
                <tr
                  key={camp.id}
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                    transition: "background var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Subject & Sender */}
                  <td style={{ padding: "14px", maxWidth: "240px" }}>
                    <p
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {camp.subject}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      From: {camp.sender}
                    </p>
                  </td>

                  {/* Recipients */}
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="badge" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
                        {camp.recipients.length} Recipient{camp.recipients.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </td>

                  {/* Mode */}
                  <td style={{ padding: "14px" }}>
                    {camp.isAutoSend ? (
                      <span className="badge badge-warning" style={{ fontSize: "0.6875rem" }}>
                        <Clock size={11} />
                        Auto-Send
                      </span>
                    ) : (
                      <span className="badge" style={{ fontSize: "0.6875rem" }}>
                        Manual
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td style={{ padding: "14px" }}>{getStatusBadge(camp.status)}</td>

                  {/* Timestamp */}
                  <td style={{ padding: "14px", fontSize: "0.78125rem", color: "var(--text-muted)" }}>
                    {camp.status === "SCHEDULED" && camp.scheduledAt ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={13} color="var(--status-warning)" />
                        <span>{new Date(camp.scheduledAt).toLocaleString()}</span>
                      </div>
                    ) : (
                      <span>{new Date(camp.sentAt || camp.createdAt).toLocaleString()}</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "14px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                      {camp.status === "SCHEDULED" && (
                        <button
                          onClick={() => onTriggerScheduled(camp.id)}
                          className="btn btn-secondary"
                          style={{ fontSize: "0.71875rem", padding: "5px 9px" }}
                          title="Trigger and dispatch now"
                        >
                          <Send size={12} />
                          <span>Dispatch</span>
                        </button>
                      )}
                      <button
                        onClick={() => onSelectCampaign(camp)}
                        className="btn btn-outline"
                        style={{ fontSize: "0.71875rem", padding: "5px 9px" }}
                        title="Load into Composer"
                      >
                        <ExternalLink size={12} />
                        <span>Load</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
