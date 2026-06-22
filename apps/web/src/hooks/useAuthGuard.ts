"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function useAuthGuard() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, router]);

  return { isAuthenticated, isChecking };
}
