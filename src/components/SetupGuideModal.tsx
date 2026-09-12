"use client";

import React, { useState } from "react";
import { X, BookOpen, Key, Database, Mail, ShieldAlert, Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const envTemplate = `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_DEFAULT_SENDER_EMAIL=jeffdev2701@gmail.com`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: "720px", maxHeight: "88vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-md)",
                background: "var(--accent-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>
                API Keys & Setup Guidance
              </h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Step-by-step instructions for Supabase & Resend
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Demo Mode Notice */}
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "var(--radius-md)",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.8125rem",
            color: "#6ee7b7",
          }}
        >
          <ShieldAlert size={18} color="var(--status-success)" />
          <span>
            <strong>Zero-Config Ready:</strong> You can test all features (auto-send lock, image rendering, bulk inputs, scheduler) in Demo Mode right now without adding API keys!
          </span>
        </div>

        {/* Step 1: Resend Setup */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Mail size={16} color="var(--accent-primary)" />
            <h4 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>1. Resend Email Setup</h4>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            1. Register for free at <strong>resend.com</strong>.<br />
            2. Go to <strong>API Keys</strong> &gt; <strong>Create API Key</strong>.<br />
            3. Paste into <code>RESEND_API_KEY</code> in <code>.env.local</code>.<br />
            4. <em>Domain Note:</em> To send from <code>jeffdev2701@gmail.com</code> or custom domains, verify your domain in Resend. By default, Resend allows testing from <code>onboarding@resend.dev</code> to your account email.
          </p>
        </div>

        {/* Step 2: Supabase & Auth */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Key size={16} color="var(--accent-primary)" />
            <h4 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>2. Supabase Setup (Database & Storage)</h4>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            1. Create a project at <strong>supabase.com</strong>.<br />
            2. In <strong>Project Settings &gt; API</strong>, copy your <code>Project URL</code> and <code>anon public key</code> into <code>.env.local</code>.<br />
            3. In Supabase <strong>SQL Editor</strong>, run the contents of <code>supabase_schema.sql</code> (creates the <code>campaigns</code>, <code>email_logs</code>, and <code>email_assets</code> tables with RLS and public storage).
          </p>
        </div>

        {/* Environment Template Box */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              .env.local Template
            </span>
            <button
              onClick={() => copyToClipboard(envTemplate, ".env.local")}
              className="btn btn-outline"
              style={{ fontSize: "0.71875rem", padding: "4px 8px" }}
            >
              {copiedSection === ".env.local" ? (
                <>
                  <Check size={12} color="var(--status-success)" /> Copied
                </>
              ) : (
                <>
                  <Copy size={12} /> Copy Template
                </>
              )}
            </button>
          </div>
          <pre
            style={{
              background: "#080c14",
              padding: "12px",
              borderRadius: "var(--radius-md)",
              fontSize: "0.75rem",
              color: "#a5b4fc",
              fontFamily: "var(--font-mono)",
              border: "1px solid var(--border-subtle)",
              overflowX: "auto",
            }}
          >
            {envTemplate}
          </pre>
        </div>

        {/* Footer Action */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-primary">
            Got it, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
