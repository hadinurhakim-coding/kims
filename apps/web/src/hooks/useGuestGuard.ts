"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function useGuestGuard() {
  const { isAuthenticated, hasLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hasLoaded && isAuthenticated) {
      router.replace("/");
    }
  }, [hasLoaded, isAuthenticated, router]);

  return { isAuthenticated, isChecking: !hasLoaded || isAuthenticated };
}
