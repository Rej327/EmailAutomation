"use client";

import React, { useState } from "react";
import { X, User, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { supabase, isSupabaseConfigured, MockUser } from "@/lib/supabase";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: MockUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("jeffdev");
  const [password, setPassword] = useState("password123");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please provide both username and password");
      return;
    }

    setIsLoading(true);
    // If no email entered, generate dummy email matching user request: "email can be dummy"
    const effectiveEmail = email.trim() || `${username.trim().toLowerCase()}@app.local`;

    try {
      if (isSupabaseConfigured) {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email: effectiveEmail,
            password: password,
            options: {
              data: {
                username: username.trim(),
              },
            },
          });

          if (error) throw error;
          if (data.user) {
            toast.success("Account created successfully!");
            onSuccess({
              id: data.user.id,
              email: data.user.email || effectiveEmail,
              username: username.trim(),
              isMock: false,
            });
            onClose();
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: effectiveEmail,
            password: password,
          });

          if (error) throw error;
          if (data.user) {
            toast.success(`Welcome back, ${username}!`);
            onSuccess({
              id: data.user.id,
              email: data.user.email || effectiveEmail,
              username: data.user.user_metadata?.username || username.trim(),
              isMock: false,
            });
            onClose();
          }
        }
      } else {
        // Supabase placeholder / Demo mode
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.success(`Signed in as ${username} (Demo Mode)`);
        onSuccess({
          id: `demo-${Date.now()}`,
          email: effectiveEmail,
          username: username.trim(),
          isMock: true,
        });
        onClose();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-md)",
                background: "var(--accent-gradient-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-primary)",
              }}
            >
              <Lock size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                {isSupabaseConfigured
                  ? "Connected to live Supabase Auth"
                  : "Demo credentials (saved in session)"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Demo Mode Notice */}
        {!isSupabaseConfigured && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              borderRadius: "var(--radius-md)",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.8125rem",
              color: "#c7d2fe",
            }}
          >
            <Sparkles size={16} color="var(--accent-primary)" />
            <span>
              Demo Mode is active. You can log in with any test username and password!
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="form-group">
            <label className="form-label">
              <span>Username</span>
            </label>
            <div style={{ position: "relative" }}>
              <User
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="e.g. jeffdev"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: "36px" }}
                required
              />
            </div>
          </div>

          {/* Optional Dummy Email */}
          <div className="form-group">
            <label className="form-label">
              <span>Email (Optional / Dummy)</span>
              <span className="label-tag">auto-filled if blank</span>
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                className="form-control"
                placeholder={`${username.toLowerCase() || "user"}@app.local`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: "36px" }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">
              <span>Password</span>
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "36px" }}
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "10px", padding: "12px" }}
            disabled={isLoading}
          >
            <ShieldCheck size={16} />
            <span>{isLoading ? "Authenticating..." : isSignUp ? "Create Account" : "Sign In"}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div
          style={{
            marginTop: "18px",
            textAlign: "center",
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
          }}
        >
          {isSignUp ? "Already have an account?" : "Don't have an account yet?"}{" "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-primary)",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {isSignUp ? "Sign In" : "Register now"}
          </button>
        </div>
      </div>
    </div>
  );
};
