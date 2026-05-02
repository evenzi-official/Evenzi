"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"signup" | "login">("signup");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  let supabase: ReturnType<typeof createClient> | null = null;
  try {
    supabase = createClient();
  } catch {
    // Handle missing env vars - error will be shown in UI
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const envError = params.get("error");
      if (envError === "env_missing") {
        setError(
          "Environment variables are missing. Please create a .env.local file with your Supabase credentials."
        );
      }
    }
  }, []);

  const handlePhoneOTP = async () => {
    if (!supabase) {
      setError(
        "Supabase client not initialized. Please check your environment variables."
      );
      return;
    }

    setError("");
    setOtpLoading(true);

    try {
      let formattedPhone = phone.replace(/\D/g, "");
      if (formattedPhone.length === 10 && formattedPhone.startsWith("9")) {
        formattedPhone = "91" + formattedPhone;
      }
      if (!formattedPhone.startsWith("91")) {
        formattedPhone = "91" + formattedPhone;
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (otpError) {
        setError(otpError.message);
        setOtpLoading(false);
        return;
      }

      setOtpSent(true);
      setOtpLoading(false);
    } catch (err) {
      setError((err as Error).message || "Failed to send OTP");
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!supabase) {
      setError(
        "Supabase client not initialized. Please check your environment variables."
      );
      return;
    }

    setError("");
    setOtpLoading(true);

    try {
      let formattedPhone = phone.replace(/\D/g, "");
      if (formattedPhone.length === 10 && formattedPhone.startsWith("9")) {
        formattedPhone = "91" + formattedPhone;
      }
      if (!formattedPhone.startsWith("91")) {
        formattedPhone = "91" + formattedPhone;
      }

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: "sms",
      });

      if (verifyError) {
        console.error("OTP verification error:", verifyError);
        setError(verifyError.message);
        setOtpLoading(false);
        return;
      }

      if (data?.user) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user || data.user) {
          setOtpLoading(false);
          router.push("/auth/role-selection");
          setTimeout(() => {
            if (window.location.pathname === "/auth") {
              window.location.href = "/auth/role-selection";
            }
          }, 500);
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        window.location.href = "/auth/role-selection";
        return;
      }

      setError(
        "Verification successful but no user session found. Please try again."
      );
      setOtpLoading(false);
    } catch (err) {
      setError((err as Error).message || "Failed to verify OTP");
      setOtpLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!supabase) {
      setError(
        "Supabase client not initialized. Please check your environment variables."
      );
      return;
    }

    setError("");
    setGoogleLoading(true);

    try {
      // Use NEXT_PUBLIC_SITE_URL when set (required for production deployments).
      // Falls back to window.location.origin for local development.
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
        window.location.origin;

      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${baseUrl}/auth/callback`,
        },
      });

      if (googleError) {
        setError(googleError.message);
        setGoogleLoading(false);
      }
      // Note: on success, the browser redirects to Google — no need to reset loading
    } catch (err) {
      setError((err as Error).message || "Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  const isLoading = otpLoading || googleLoading;

  return (
    <div
      className="min-h-screen flex flex-col justify-between px-4 py-12"
      style={{ background: "var(--color-bg-primary)" }}
    >
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              Evenzi
            </h1>
            <p style={{ color: "var(--color-text-secondary)" }}>
              {activeTab === "signup"
                ? "Create your account to get started"
                : "Welcome back to Evenzi"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => {
                setActiveTab("signup");
                setOtpSent(false);
                setError("");
              }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === "signup"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => {
                setActiveTab("login");
                setOtpSent(false);
                setError("");
              }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === "login"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Log In
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-4 p-3 rounded-lg border text-sm"
              style={{
                background: "var(--color-error-bg)",
                borderColor: "var(--color-error-border)",
                color: "var(--color-error)",
              }}
            >
              {error}
            </div>
          )}

          {/* Phone OTP Section */}
          <div
            className="rounded-lg p-6 mb-4 border"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
            }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Phone Number
            </h3>
            {!otpSent ? (
              <div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number (e.g., 9999999999)"
                  className="w-full px-4 py-3 rounded-lg mb-4 focus:outline-none text-gray-900"
                  style={{
                    border: "1px solid var(--color-border)",
                  }}
                  disabled={isLoading}
                />
                <button
                  onClick={handlePhoneOTP}
                  disabled={otpLoading || !phone || googleLoading}
                  className="w-full py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "var(--color-primary)" }}
                >
                  {otpLoading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP code"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg mb-4 focus:outline-none text-gray-900"
                  style={{
                    border: "1px solid var(--color-border)",
                  }}
                  disabled={isLoading}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleVerifyOTP}
                    disabled={otpLoading || !otp}
                    className="flex-1 py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "var(--color-primary)" }}
                  >
                    {otpLoading ? "Verifying..." : "Verify OTP"}
                  </button>
                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className="px-4 py-3 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    style={{
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div
              className="flex-1 border-t"
              style={{ borderColor: "var(--color-border)" }}
            />
            <span
              className="px-4 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              or
            </span>
            <div
              className="flex-1 border-t"
              style={{ borderColor: "var(--color-border)" }}
            />
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full py-3 border-2 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            {googleLoading ? (
              <span className="flex items-center gap-2">
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
                Redirecting to Google...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center mt-12">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          &copy; 2026 Evenzi. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
