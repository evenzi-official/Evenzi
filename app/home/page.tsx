"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg-primary)" }}>
        <div style={{ color: "var(--color-text-secondary)" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-primary)" }}>
      {/* Navigation */}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b"
        style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold"
            style={{ color: "var(--color-text-primary)" }}>Evenzi</div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}>
                {user.email || user.phone || "User"}
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            style={{ color: "var(--color-text-primary)" }}>
            Welcome to Evenzi!
          </h1>
          <p className="text-xl sm:text-2xl mb-12 max-w-2xl mx-auto"
            style={{ color: "var(--color-text-secondary)" }}>
            Start planning your perfect event.
          </p>

          <button
            onClick={() => alert("Create Event Wizard coming soon!")}
            className="px-8 py-4 font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg text-white"
            style={{ background: "var(--color-primary)" }}
          >
            Create Your First Event
          </button>
        </div>
      </main>
    </div>
  );
}

