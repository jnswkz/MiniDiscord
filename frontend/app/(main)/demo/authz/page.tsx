"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, ShieldCheck, HelpCircle } from "lucide-react";
import api from "@/lib/api";
import { AxiosError } from "axios";

export default function AuthzDemoPage() {
  const [results, setResults] = useState<{ [key: string]: { status: number; data: any; error?: string } }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  const endpoints = [
    {
      id: "public",
      name: "Public API",
      url: "/demo/public",
      description: "Accessible to anyone, authenticated or not.",
      expected: "200 OK"
    },
    {
      id: "user",
      name: "User API",
      url: "/demo/user",
      description: "Requires a valid session (Role: USER or ADMIN).",
      expected: "200 OK for logged-in users, 401 otherwise."
    },
    {
      id: "admin",
      name: "Admin API",
      url: "/demo/admin",
      description: "Requires a valid session with ADMIN role.",
      expected: "200 OK for ADMINs, 403 for USERs, 401 for anonymous."
    }
  ];

  async function testApi(endpointId: string, url: string) {
    setLoading((prev) => ({ ...prev, [endpointId]: true }));
    try {
      const response = await api.get(url);
      setResults((prev) => ({
        ...prev,
        [endpointId]: { status: response.status, data: response.data }
      }));
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        setResults((prev) => ({
          ...prev,
          [endpointId]: { status: err.response.status, data: err.response.data, error: err.response.statusText }
        }));
      } else {
        setResults((prev) => ({
          ...prev,
          [endpointId]: { status: 0, data: null, error: "Network Error" }
        }));
      }
    } finally {
      setLoading((prev) => ({ ...prev, [endpointId]: false }));
    }
  }

  function getStatusBadge(status: number) {
    if (status >= 200 && status < 300) {
      return <span className="bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded text-xs font-bold">HTTP {status} - SUCCESS</span>;
    }
    if (status === 401) {
      return <span className="bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded text-xs font-bold">HTTP 401 - UNAUTHORIZED</span>;
    }
    if (status === 403) {
      return <span className="bg-destructive/15 text-destructive px-2 py-0.5 rounded text-xs font-bold">HTTP 403 - FORBIDDEN</span>;
    }
    return <span className="bg-secondary text-foreground px-2 py-0.5 rounded text-xs font-bold">HTTP {status}</span>;
  }

  function getExplanation(status: number) {
    if (status === 401) return "The gateway rejected the request because you are not authenticated (missing, invalid, or expired token).";
    if (status === 403) return "The request passed authentication but failed authorization. You are logged in, but your role does not have permission to access this resource.";
    if (status === 200) return "Request succeeded. You have the correct permissions.";
    return "";
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground overflow-y-auto">
      <div className="border-b border-border p-6 pb-4">
        <h1 className="text-2xl font-bold">API Authorization Matrix</h1>
        <p className="text-muted-foreground mt-2">
          Test the Spring Cloud API Gateway's JWT validation and role-based access control (RBAC).
        </p>
      </div>

      <div className="p-6 max-w-4xl space-y-6">
        {endpoints.map((ep) => (
          <div key={ep.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border/50 bg-secondary/20">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="font-mono text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">GET</span>
                  {ep.url}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{ep.description}</p>
                <p className="text-xs text-muted-foreground mt-1 italic flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Expected: {ep.expected}
                </p>
              </div>
              <Button 
                onClick={() => testApi(ep.id, ep.url)} 
                disabled={loading[ep.id]}
                size="sm"
              >
                {loading[ep.id] ? "Sending..." : "Send Request"}
              </Button>
            </div>
            
            {results[ep.id] && (
              <div className="p-5 bg-background-tertiary">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">Response</h4>
                  {getStatusBadge(results[ep.id].status)}
                </div>
                
                <div className="bg-[#1e1f22] p-3 rounded-md mb-3 border border-border/50">
                  <pre className="text-xs font-mono text-[#dbdee1] whitespace-pre-wrap break-all">
                    {JSON.stringify(results[ep.id].data, null, 2)}
                  </pre>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  {results[ep.id].status >= 200 && results[ep.id].status < 300 ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Analysis: </strong>
                    {getExplanation(results[ep.id].status)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
