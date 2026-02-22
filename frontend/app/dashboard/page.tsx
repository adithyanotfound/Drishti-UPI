"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserStore } from "@/store/user";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { getAuthStatus, getBalance, getUserBalanceByMobile } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const { signedIn, upiId, qrCodeUrl, mobile, setAuth } = useUserStore();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!signedIn) router.replace("/login");
  }, [signedIn, router]);

  useEffect(() => {
    // refresh QR and UPI from status
    async function refresh() {
      try {
        if (!mobile) return;
        const s = await getAuthStatus(mobile);
        setAuth({ upiId: s.upiId || null, qrCodeUrl: s.qrCodeUrl || null });
      } catch { }
    }
    refresh();
  }, [mobile, setAuth]);

  useEffect(() => {
    async function fetchBalance() {
      if (!upiId) return;
      // Prefer user-service balance when signed-in; fallback to bank-service
      if (mobile && signedIn) {
        const ub = await getUserBalanceByMobile(mobile);
        if (ub) {
          setBalance(ub.balance);
          return;
        }
      }
      const b = await getBalance(upiId);
      if (b) setBalance(b.balance);
    }
    fetchBalance();
  }, [upiId, mobile, signedIn]);

  return (
    <div className="pb-20">
      <div className="p-4 space-y-4">
        <Card className="shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle>Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">₹{balance ?? "—"}</p>
            <p className="text-xs text-gray-500 mt-1">{balance === null ? "Fetching..." : "Available"}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle>Receive Payments</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {qrCodeUrl ? (
              <Image
                src={qrCodeUrl}
                alt="QR Code"
                width={220}
                height={220}
                className="rounded-md border"
              />
            ) : (
              <div className="w-[220px] h-[220px] bg-neutral-100 rounded-md" />
            )}
            <div className="mt-3 text-sm text-gray-700">{upiId || "UPI not available"}</div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button asChild className="w-full h-12 rounded-xl bg-black text-white hover:bg-gray-800">
            <Link href="/scan">
              Scan QR
            </Link>
          </Button>
          <Button asChild className="w-full h-12 rounded-xl bg-black text-white hover:bg-gray-800">
            <Link href="/transactions">
              Transactions
            </Link>
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}


