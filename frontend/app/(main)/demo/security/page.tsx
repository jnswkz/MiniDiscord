"use client";

import { Shield, ShieldAlert, Key, AlertTriangle } from "lucide-react";

export default function SecurityDemoPage() {
  const scenarios = [
    {
      title: "1. Token Leakage: LocalStorage vs HttpOnly Cookies",
      icon: <Key className="w-5 h-5 text-amber-500" />,
      description: "Why are we moving to HttpOnly cookies in Phase 2?",
      points: [
        "Currently (Phase 1), the JWT is stored in localStorage.",
        "Any malicious JavaScript (XSS) running on the page can easily read localStorage and steal the token.",
        "With HttpOnly cookies, the browser stores the token and automatically attaches it to API requests, but JavaScript cannot read it. This eliminates the XSS token theft vector."
      ]
    },
    {
      title: "2. Missing or Invalid Token (401 Unauthorized)",
      icon: <ShieldAlert className="w-5 h-5 text-destructive" />,
      description: "How does the API Gateway protect the backend?",
      points: [
        "The API Gateway checks every incoming request for a valid JWT signature.",
        "If the token is missing, malformed, or tampered with, the Gateway drops the request immediately and returns a 401.",
        "This prevents unauthorized traffic from ever reaching the downstream microservices."
      ]
    },
    {
      title: "3. Expired Token",
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      description: "What happens when time runs out?",
      points: [
        "Tokens have a built-in TTL (Time To Live) defined by the 'exp' claim.",
        "Even if a token is validly signed, if the current server time is past the 'exp' time, the Gateway rejects it.",
        "This limits the window of opportunity if a token is somehow compromised."
      ]
    },
    {
      title: "4. Role Mismatch (403 Forbidden)",
      icon: <Shield className="w-5 h-5 text-emerald-500" />,
      description: "Authentication vs. Authorization",
      points: [
        "Authentication (401): Who are you?",
        "Authorization (403): Are you allowed to do this?",
        "A regular USER can authenticate successfully, but if they try to access an ADMIN endpoint, the Gateway inspects the 'role' claim in the JWT and blocks the request with a 403."
      ]
    },
    {
      title: "5. CSRF & State Tampering Prevention",
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
      description: "Securing the OAuth2 callback flow.",
      points: [
        "The backend generates a cryptographically random 'state' parameter before redirecting to Google.",
        "When Google redirects back, the backend verifies the 'state' matches exactly what was expected for that session.",
        "This prevents a malicious actor from tricking a user into logging into the attacker's account (Login CSRF)."
      ]
    }
  ];

  return (
    <div className="flex h-full flex-col bg-background text-foreground overflow-y-auto">
      <div className="border-b border-border p-6 pb-4">
        <h1 className="text-2xl font-bold">Security Scenarios & Explanations</h1>
        <p className="text-muted-foreground mt-2">
          Understanding the defensive mechanisms implemented in MiniDiscord.
        </p>
      </div>

      <div className="p-6 max-w-4xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map((scenario, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-3 border-b border-border/50 pb-3">
                <div className="p-2 bg-secondary rounded-lg">
                  {scenario.icon}
                </div>
                <h3 className="font-semibold leading-tight">{scenario.title}</h3>
              </div>
              <p className="text-sm font-medium text-primary mb-3">{scenario.description}</p>
              <ul className="space-y-2">
                {scenario.points.map((point, pIdx) => (
                  <li key={pIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-border mt-1">•</span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShieldCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
