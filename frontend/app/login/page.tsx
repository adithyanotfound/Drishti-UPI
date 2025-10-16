"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getAuthStatus } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState("");
  const router = useRouter();
  const { setAuth } = useUserStore();

  async function handleCheck() {
    try {
      setLoading(true);
      const res = await getAuthStatus(mobile);
      if (res.signedIn) {
        setAuth({ mobile, username: res.username || null, signedIn: true, upiId: res.upiId || null, qrCodeUrl: res.qrCodeUrl || null, signedInUntil: res.signedInUntil || null });
        toast.success("Login successful");
        router.replace("/dashboard");
      } else {
        toast("The user has not authenticated");
      }
    } catch (e) {
      const message = typeof e === "string" ? e : "Failed to check status";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 pt-10">
      <Card className="shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Companion Login</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <label className="text-sm text-gray-700">Mobile Number</label>
            <Input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              className="h-12 rounded-xl"
            />
          </div>
          <Button
            className="w-full h-12 rounded-xl bg-black text-white hover:bg-gray-800"
            onClick={handleCheck}
            disabled={loading}
          >
            {loading ? "Checking..." : "Check Login Status"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


