import type { Metadata } from "next";
import "@/styles/globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "AutoMail Flow - Automated Bulk Email Dispatcher & Scheduler",
  description:
    "Enterprise-grade email automation, bulk recipient scheduler, image embedder, and lockable safety controls powered by Next.js, Supabase, Prisma, and Resend.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Ambient background glows */}
        <div className="ambient-bg">
          <div className="ambient-glow-1" />
          <div className="ambient-glow-2" />
        </div>

        {/* Main content */}
        {children}

        {/* Global Toaster for rich, smooth notifications */}
        <Toaster
          position="top-right"
          richColors
          theme="dark"
          closeButton
          toastOptions={{
            style: {
              background: "#111827",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#f9fafb",
            },
          }}
        />
      </body>
    </html>
  );
}
