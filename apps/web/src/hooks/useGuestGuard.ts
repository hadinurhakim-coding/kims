"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function useGuestGuard() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, router]);

  return { isAuthenticated, isChecking };
}
