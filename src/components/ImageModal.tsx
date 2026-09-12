"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon, Link as LinkIcon, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImage: (imageHtml: string, imageUrl: string) => void;
}

const SAMPLE_PRESETS = [
  {
    name: "Modern Header Banner",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    alt: "Abstract Fluid Banner",
  },
  {
    name: "Product Showcase",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    alt: "Data Dashboard Showcase",
  },
  {
    name: "Team Collaboration",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    alt: "Team Collaboration",
  },
];

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  onInsertImage,
}) => {
  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("Email Announcement Image");
  const [imageAlignment, setImageAlignment] = useState<"center" | "left" | "right">("center");
  const [maxWidth, setMaxWidth] = useState("100%");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, SVG, WebP)");
      return;
    }

    // Attempt to upload via API or convert to data URL for instant render
    setIsUploading(true);
    const toastId = toast.loading("Uploading and optimizing image...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setImageUrl(data.url);
        toast.success("Image uploaded successfully!", { id: toastId });
      } else {
        // Fallback: create base64/object URL for instant email preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageUrl(reader.result as string);
          toast.success("Image loaded for email embedding!", { id: toastId });
        };
        reader.readAsDataURL(file);
      }
    } catch {
      // Local fallback
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        toast.success("Image converted for email embedding!", { id: toastId });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInsert = () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter an image URL or upload an image file");
      return;
    }

    const alignStyle =
      imageAlignment === "center"
        ? "display: block; margin: 20px auto;"
        : imageAlignment === "right"
        ? "display: block; margin: 20px 0 20px auto;"
        : "display: block; margin: 20px 0;";

    const generatedHtml = `\n<div style="text-align: ${imageAlignment}; margin: 24px 0;">
  <img src="${imageUrl}" alt="${altText || "Email Asset"}" style="max-width: ${maxWidth}; height: auto; border-radius: 10px; ${alignStyle} box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
</div>\n`;

    onInsertImage(generatedHtml, imageUrl);
    toast.success("Image inserted into email content!");
    onClose();
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
                background: "rgba(99, 102, 241, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-primary)",
              }}
            >
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Import Image</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Add hosted links or upload image assets into email
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Upload Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed var(--border-medium)",
            borderRadius: "var(--radius-lg)",
            padding: "24px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: "rgba(255, 255, 255, 0.02)",
            marginBottom: "20px",
            transition: "all var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-primary)";
            e.currentTarget.style.background = "rgba(99, 102, 241, 0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-medium)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <Upload
            size={28}
            style={{ margin: "0 auto 8px auto", color: "var(--accent-primary)" }}
          />
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
            {isUploading ? "Processing image..." : "Click or drag to upload an image"}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            PNG, JPG, WebP or SVG (Saved to Supabase Storage or embedded URL)
          </p>
        </div>

        {/* Or URL input */}
        <div className="form-group">
          <label className="form-label">
            <span>Direct Image Web URL</span>
            <span className="label-tag">HTTPS link</span>
          </label>
          <div style={{ position: "relative" }}>
            <LinkIcon
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
              type="url"
              className="form-control"
              placeholder="https://example.com/banner.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              style={{ paddingLeft: "36px" }}
            />
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div style={{ marginBottom: "18px" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "8px", fontWeight: 600 }}>
            <Sparkles size={12} style={{ display: "inline", marginRight: "4px" }} />
            Or select high-res curated preset:
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className="btn btn-secondary"
                style={{
                  fontSize: "0.75rem",
                  padding: "6px 10px",
                  borderColor: imageUrl === preset.url ? "var(--accent-primary)" : "var(--border-subtle)",
                }}
                onClick={() => {
                  setImageUrl(preset.url);
                  setAltText(preset.alt);
                }}
              >
                {imageUrl === preset.url && <Check size={12} color="var(--status-success)" />}
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Alt text and alignment */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Alt Description</label>
            <input
              type="text"
              className="form-control"
              placeholder="Image title"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Alignment</label>
            <select
              className="form-control"
              value={imageAlignment}
              onChange={(e) => setImageAlignment(e.target.value as "center" | "left" | "right")}
            >
              <option value="center">Centered</option>
              <option value="left">Left Aligned</option>
              <option value="right">Right Aligned</option>
            </select>
          </div>
        </div>

        {/* Preview snippet if image selected */}
        {imageUrl && (
          <div
            style={{
              padding: "10px",
              background: "rgba(0, 0, 0, 0.3)",
              borderRadius: "var(--radius-md)",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Preview"
              style={{
                width: "56px",
                height: "56px",
                objectFit: "cover",
                borderRadius: "var(--radius-sm)",
              }}
            />
            <div style={{ overflow: "hidden", fontSize: "0.75rem" }}>
              <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>Preview Ready</p>
              <p
                style={{
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {imageUrl}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button onClick={handleInsert} className="btn btn-primary" disabled={!imageUrl.trim()}>
            Insert into Email
          </button>
        </div>
      </div>
    </div>
  );
};
