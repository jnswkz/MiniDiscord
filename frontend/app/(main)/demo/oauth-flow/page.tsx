"use client";

import { useAuthStore } from "@/stores/authStore";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function OAuthFlowDemoPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // In phase 1, token is returned to localStorage. If secure cookie (phase 2) is done, token might be null but isAuthenticated is true.
  const sessionMode = token ? "Bearer Token (localStorage)" : "Secure Cookie (HttpOnly)";

  return (
    <div className="flex h-full flex-col bg-background text-foreground overflow-y-auto">
      <div className="border-b border-border p-6 pb-4">
        <h1 className="text-2xl font-bold">OAuth2 Authorization Code Flow + PKCE</h1>
        <p className="text-muted-foreground mt-2">
          Demonstrating the secure backend-driven Google Login flow.
        </p>
      </div>

      <div className="p-6 max-w-4xl space-y-8">
        {/* Status Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 border-b border-border pb-2">Session Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <span className="flex items-center text-emerald-500 font-medium">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Authenticated
                  </span>
                ) : (
                  <span className="text-destructive font-medium">Not Authenticated</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Session Source</p>
              <p className="font-medium font-mono text-sm">{sessionMode}</p>
            </div>
            {user && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Logged in as</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Assigned Role</p>
                  <p className="font-medium text-blue-400">{user.role}</p>
                </div>
              </>
            )}
            {token && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground mb-1">Masked Access Token (For demo purposes only)</p>
                <p className="font-mono text-xs text-muted-foreground bg-secondary/50 p-2 rounded break-all border border-border/50">
                  {token.substring(0, 20)}...[REDACTED]...{token.substring(token.length - 10)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Flow Timeline</h2>
          <div className="space-y-4">
            {[
              "User clicks 'Log in with Google' on the frontend.",
              "Frontend redirects to Backend /start endpoint.",
              "Backend generates secure state, nonce, and PKCE challenge (S256).",
              "Backend redirects user's browser to Google's Authorization Server.",
              "Google authenticates user and redirects back to Backend callback with authorization code.",
              "Backend exchanges the code + PKCE verifier for Google tokens via back-channel.",
              "Backend verifies Google ID token signature and nonce.",
              "Backend issues internal MiniDiscord JWT.",
              "Frontend retrieves session (via /me or query parameter fallback) and renders protected layout."
            ].map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">
                    {idx + 1}
                  </div>
                  {idx !== 8 && <div className="w-0.5 h-full bg-border my-1" />}
                </div>
                <div className="pt-1 pb-4 flex-1">
                  <p className="text-sm text-foreground/90 leading-relaxed">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
