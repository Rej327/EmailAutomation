"use client";

import React, { useState } from "react";
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export const DEFAULT_WELCOME_PASSWORD = "Password@123";

interface WelcomePasswordModalProps {
  isOpen: boolean;
  onUnlock: () => void;
}

export const WelcomePasswordModal: React.FC<WelcomePasswordModalProps> = ({
  isOpen,
  onUnlock,
}) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Please enter the password");
      triggerShake();
      return;
    }

    if (password.trim() === DEFAULT_WELCOME_PASSWORD) {
      setError("");
      toast.success("Access Granted! Welcome to ComplaintEmail.", {
        icon: <ShieldCheck size={16} color="#10b981" />,
      });
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Fallback if canvas is unavailable
      }
      onUnlock();
    } else {
      setError("Incorrect password. The default password is Password@123");
      triggerShake();
      toast.error("Incorrect password");
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleFillDefault = () => {
    setPassword(DEFAULT_WELCOME_PASSWORD);
    setError("");
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 9999,
        backdropFilter: "blur(18px)",
        background: "rgba(5, 8, 16, 0.88)",
      }}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "36px 32px",
          borderRadius: "var(--radius-xl)",
          border: "1px solid rgba(99, 102, 241, 0.35)",
          boxShadow:
            "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.2)",
          position: "relative",
          animation: isShaking
            ? "shake 0.4s ease-in-out"
            : "fadeIn 0.25s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Icon */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 25px rgba(99, 102, 241, 0.45)",
              marginBottom: "14px",
            }}
          >
            <Lock size={28} color="#ffffff" />
          </div>

          <h2
            style={{
              fontSize: "1.375rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Welcome to{" "}
            <span style={{ color: "var(--accent-primary)" }}>
              ComplaintEmail
            </span>
          </h2>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              marginTop: "6px",
            }}
          >
            Enter the security password to unlock the workspace
          </p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleUnlock}>
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label">
              <span>Security Password</span>
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                style={{
                  paddingLeft: "40px",
                  paddingRight: "40px",
                  fontSize: "0.875rem",
                  borderColor: error ? "var(--status-danger)" : undefined,
                }}
                autoFocus
                required
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: "4px",
                  color: "var(--text-muted)",
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <p
                style={{
                  color: "var(--status-danger)",
                  fontSize: "0.75rem",
                  marginTop: "6px",
                  fontWeight: 500,
                }}
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "0.875rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Unlock size={16} />
            <span>Unlock Workspace</span>
          </button>
        </form>
      </div>
    </div>
  );
};
