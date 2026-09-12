"use client";

import React from "react";
import { Mail, Sparkles, ShieldCheck, User, LogOut, BookOpen, Clock } from "lucide-react";
import { MockUser } from "@/lib/supabase";

interface NavbarProps {
  user: MockUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenGuide: () => void;
  stats: {
    totalSent: number;
    scheduledCount: number;
  };
  isLiveMode: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
  onLogout,
  onOpenGuide,
  stats,
  isLiveMode,
}) => {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 0",
        borderBottom: "1px solid var(--border-subtle)",
        marginBottom: "32px",
        flexWrap: "wrap",
        gap: "16px",
      }}
    >
      {/* Brand & Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
          }}
        >
          <Mail size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              AutoMail <span style={{ color: "var(--accent-primary)" }}>Flow</span>
            </h1>
            <span
              className={`badge ${isLiveMode ? "badge-success" : "badge-purple"}`}
              style={{ fontSize: "0.6875rem", padding: "2px 8px" }}
            >
              <Sparkles size={11} />
              {isLiveMode ? "Resend Live" : "Demo Engine"}
            </span>
          </div>
          <p style={{ fontSize: "0.78125rem", color: "var(--text-muted)", marginTop: "1px" }}>
            Automated & Bulk Email Delivery System
          </p>
        </div>
      </div>

      {/* Center Stats Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          background: "rgba(255, 255, 255, 0.03)",
          padding: "6px 14px",
          borderRadius: "var(--radius-full)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem" }}>
          <ShieldCheck size={15} color="var(--status-success)" />
          <span style={{ color: "var(--text-secondary)" }}>Sent:</span>
          <strong style={{ color: "var(--text-primary)" }}>{stats.totalSent}</strong>
        </div>
        <div
          style={{
            width: "1px",
            height: "14px",
            backgroundColor: "var(--border-subtle)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem" }}>
          <Clock size={14} color="var(--status-warning)" />
          <span style={{ color: "var(--text-secondary)" }}>Scheduled:</span>
          <strong style={{ color: "var(--text-primary)" }}>{stats.scheduledCount}</strong>
        </div>
      </div>

      {/* Right Actions: Setup Guide & Auth */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={onOpenGuide}
          className="btn btn-secondary"
          style={{ fontSize: "0.8125rem", padding: "8px 14px" }}
          title="Open Setup & API Keys Guide"
        >
          <BookOpen size={14} />
          <span>Setup Guide</span>
        </button>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "var(--bg-tertiary)",
                padding: "6px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.8125rem",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight: 600 }}>{user.username}</span>
            </div>
            <button
              onClick={onLogout}
              className="btn btn-outline"
              style={{ padding: "8px" }}
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn btn-primary"
            style={{ fontSize: "0.8125rem", padding: "8px 16px" }}
          >
            <User size={14} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
