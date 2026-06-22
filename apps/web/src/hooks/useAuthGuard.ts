"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function useAuthGuard() {
  const { isAuthenticated, hasLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hasLoaded && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasLoaded, isAuthenticated, router]);

  return { isAuthenticated, isChecking: !hasLoaded || !isAuthenticated };
}
