"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";

export function ReverseAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrate = useAuthStore((state) => state.hydrate);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    hydrate();
    setIsHydrating(false);
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrating && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isHydrating, isAuthenticated, router]);

  // Show a loading state while hydrating to prevent flash of login page if already authenticated
  if (isHydrating || isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
