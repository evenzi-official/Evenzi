"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"signup" | "login">("signup");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  
  let supabase:any;
  try {
    supabase = createClient();
  } catch (err: any) {
    // Handle missing env vars - error will be shown in UI
  }

  useEffect(() => {
    // Check for error in URL params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const envError = params.get('error');
      if (envError === 'env_missing') {
        setError('Environment variables are missing. Please create a .env.local file with your Supabase credentials.');
      }
    }
  }, []);

  const handlePhoneOTP = async () => {
    if (!supabase) {
      setError('Supabase client not initialized. Please check your environment variables.');
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Format phone number (remove leading 9 if user enters 9999999999)
      let formattedPhone = phone.replace(/\D/g, ""); // Remove non-digits
      if (formattedPhone.length === 10 && formattedPhone.startsWith("9")) {
        formattedPhone = "91" + formattedPhone; // Add country code for India
      }
      if (!formattedPhone.startsWith("91")) {
        formattedPhone = "91" + formattedPhone;
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (otpError) {
        setError(otpError.message);
        setLoading(false);
        return;
      }

      setOtpSent(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!supabase) {
      setError('Supabase client not initialized. Please check your environment variables.');
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Format phone number
      let formattedPhone = phone.replace(/\D/g, "");
      if (formattedPhone.length === 10 && formattedPhone.startsWith("9")) {
        formattedPhone = "91" + formattedPhone;
      }
      if (!formattedPhone.startsWith("91")) {
        formattedPhone = "91" + formattedPhone;
      }

      console.log("Verifying OTP for phone:", formattedPhone, "OTP:", otp);

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: "sms",
      });

      console.log("Verify response:", { data, error: verifyError });

      if (verifyError) {
        console.error("OTP verification error:", verifyError);
        setError(verifyError.message);
        setLoading(false);
        return;
      }

      // If verification was successful, we should have a user in data
      if (data?.user) {
        console.log("User found in data:", data.user);
        
        // Wait a bit to ensure cookies are set
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verify the session is accessible from the client
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session check:", session?.user ? "User found" : "No user");
        
        if (session?.user || data.user) {
          console.log("Redirecting to /home");
          setLoading(false);
          
          // Use router.push for client-side navigation
          // This should work better with Next.js middleware
          router.push("/home");
          
          // Fallback: if router.push doesn't work, use window.location after a delay
          setTimeout(() => {
            if (window.location.pathname === "/auth") {
              console.log("Router.push didn't work, using window.location");
              window.location.href = "/home";
            }
          }, 500);
          
          return;
        }
      }

      // Fallback: Check session directly
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("Session check:", session, "Error:", sessionError);
      
      if (session?.user) {
        console.log("User found in session, redirecting to /home");
        window.location.href = "/home";
        return;
      }

      // If we get here, something went wrong
      console.error("No user found after verification");
      setError("Verification successful but no user session found. Please try again.");
      setLoading(false);
    } catch (err: any) {
      console.error("OTP verification exception:", err);
      setError(err.message || "Failed to verify OTP");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!supabase) {
      setError('Supabase client not initialized. Please check your environment variables.');
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (googleError) {
        setError(googleError.message);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  const handleEmailMagicLink = async () => {
    if (!supabase) {
      setError('Supabase client not initialized. Please check your environment variables.');
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { error: emailError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (emailError) {
        setError(emailError.message);
        setLoading(false);
        return;
      }

      setError("");
      alert("Check your email for the magic link!");
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to send magic link");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">WeddingPlanner</h1>
          <p className="text-gray-600">Welcome back</p>
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
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Phone OTP Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phone Number</h3>
          {!otpSent ? (
            <div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number (e.g., 9999999999)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-900 text-gray-900"
                disabled={loading}
              />
              <button
                onClick={handlePhoneOTP}
                disabled={loading || !phone}
                className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send OTP"}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-900 text-gray-900"
                disabled={loading}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || !otp}
                  className="flex-1 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }}
                  className="px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-sm text-gray-500">or</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-3 border-2 border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors mb-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
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
        </button>

        {/* Email Magic Link */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Magic Link</h3>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-900 text-gray-900"
            disabled={loading}
          />
          <button
            onClick={handleEmailMagicLink}
            disabled={loading || !email}
            className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Email me a login link"}
          </button>
        </div>
      </div>
    </div>
  );
}

