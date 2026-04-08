"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RoleSelectionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSelectHost = async () => {
    setError("");
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ role: "host" })
        .eq("id", user.id);

      if (updateError) {
        console.error("Role update error:", updateError);
        setError("Failed to set your role. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/home");
    } catch (err) {
      console.error("Role selection error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between px-8 py-12"
      style={{ background: "var(--color-bg-primary)" }}
    >
      {/* Header */}
      <header className="flex justify-center">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Evenzi
        </h1>
      </header>

      {/* Main */}
      <main className="flex flex-col items-center justify-center py-14">
        {/* Heading */}
        <div className="text-center mb-14">
          <h2
            className="text-4xl md:text-[36px] font-bold tracking-tight mb-4"
            style={{ color: "var(--color-text-primary)" }}
          >
            How will you use the platform?
          </h2>
          <p
            className="text-lg max-w-[672px] mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Select your role to get a personalized experience tailored to your
            needs.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-8 w-full max-w-[1024px] px-4 py-3 rounded-lg border text-sm flex items-center justify-between"
            style={{
              background: "var(--color-error-bg)",
              borderColor: "var(--color-error-border)",
              color: "var(--color-error)",
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-4 font-medium underline"
              style={{ color: "var(--color-error)" }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Role Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[1024px]"
          role="radiogroup"
          aria-label="Select your role"
        >
          {/* Host Card */}
          <div
            role="radio"
            aria-checked="false"
            tabIndex={0}
            className="flex flex-col items-center p-10 rounded-2xl border-2 transition-all duration-200 cursor-pointer hover:border-[var(--color-primary)]"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
              boxShadow: "var(--shadow-sm)",
            }}
            onClick={!loading ? handleSelectHost : undefined}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !loading) {
                e.preventDefault();
                handleSelectHost();
              }
            }}
          >
            {/* Icon */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
              style={{ background: "var(--color-bg-primary)" }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--color-text-primary)" }}
              >
                <path d="M5.8 11.3 2 22l10.7-3.79" />
                <path d="M4 3h.01" />
                <path d="M22 8h.01" />
                <path d="M15 2h.01" />
                <path d="M22 20h.01" />
                <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
                <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.63-.69 1.09-1.33 1.09h-.06c-.72 0-1.34.5-1.48 1.2l-.15.65" />
                <path d="M5 3 4 4l1 1 1-1Z" />
              </svg>
            </div>

            <h3
              className="text-2xl font-bold mb-4 text-center"
              style={{ color: "var(--color-text-primary)" }}
            >
              Host / Event Owner
            </h3>
            <p
              className="text-base text-center mb-10 max-w-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Manage your event details, guest lists, and create a beautiful
              event website. Collect all your memories in one place.
            </p>
            <button
              disabled={loading}
              className="w-full py-4 rounded-xl text-lg font-semibold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "var(--color-primary)" }}
              onClick={(e) => {
                e.stopPropagation();
                if (!loading) handleSelectHost();
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Setting up...
                </span>
              ) : (
                "Continue as Host"
              )}
            </button>
          </div>

          {/* Vendor Card (Disabled) */}
          <div
            role="radio"
            aria-checked="false"
            aria-disabled="true"
            tabIndex={-1}
            className="relative flex flex-col items-center p-10 rounded-2xl border-2 opacity-50 cursor-not-allowed"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {/* Coming Soon Badge */}
            <span
              role="status"
              className="absolute top-4 right-4 px-3 py-1 text-xs font-medium rounded-full"
              style={{
                background: "var(--color-bg-primary)",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              Coming Soon
            </span>

            {/* Icon */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
              style={{ background: "var(--color-bg-primary)" }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--color-text-muted)" }}
              >
                <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                <rect width="20" height="14" x="2" y="6" rx="2" />
              </svg>
            </div>

            <h3
              className="text-2xl font-bold mb-4 text-center"
              style={{ color: "var(--color-text-muted)" }}
            >
              Vendor
            </h3>
            <p
              className="text-base text-center mb-10 max-w-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Manage your bookings, coordinate with hosts, and showcase your
              services to potential clients efficiently.
            </p>
            <button
              disabled
              className="w-full py-4 rounded-xl text-lg font-semibold text-white cursor-not-allowed opacity-60"
              style={{ background: "var(--color-text-muted)" }}
            >
              Continue as Vendor
            </button>
          </div>
        </div>

        {/* Back to Login */}
        <button
          onClick={handleBackToLogin}
          className="mt-16 flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 6H2M5 9L2 6l3-3" />
          </svg>
          Back to Login
        </button>
      </main>

      {/* Footer */}
      <footer className="text-center">
        <p
          className="text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          &copy; 2026 Evenzi. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
