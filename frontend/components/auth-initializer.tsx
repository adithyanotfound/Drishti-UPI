"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthStatus } from "@/lib/api";
import { useUserStore } from "@/store/user";

export default function AuthInitializer() {
  const router = useRouter();
  const pathname = usePathname();
  const { mobile, signedIn, signedInUntil, setAuth, logout } = useUserStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Verify persisted auth on load/refresh
  useEffect(() => {
    async function verify() {
      if (!mobile) return;
      try {
        const status = await getAuthStatus(mobile);
        // if server says signed in, persist data; else force logout
        if (status.signedIn) {
          setAuth({
            signedIn: true,
            upiId: status.upiId || null,
            qrCodeUrl: status.qrCodeUrl || null,
            username: status.username || null,
            signedInUntil: status.signedInUntil || null,
          });
          // If currently on /login, go to dashboard
          if (pathname === "/login") router.replace("/dashboard");
        } else {
          logout();
          if (pathname !== "/login") router.replace("/login");
        }
      } catch {
        // Network error: keep local state, but if not signedIn, enforce login
        if (!signedIn && pathname !== "/login") router.replace("/login");
      }
    }
    verify();
    // run once on mount and when mobile/path changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile, pathname]);

  // Auto-logout when signedInUntil elapses
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!signedIn || !signedInUntil) return;
    const expiry = new Date(signedInUntil).getTime();
    const now = Date.now();
    if (isNaN(expiry)) return;
    const ms = Math.max(0, expiry - now);
    timerRef.current = setTimeout(() => {
      logout();
      router.replace("/login");
    }, ms);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [signedIn, signedInUntil, logout, router]);

  return null;
}


