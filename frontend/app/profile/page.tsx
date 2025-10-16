"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { postLogout } from "@/lib/api";
import { useUserStore } from "@/store/user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";

export default function ProfilePage() {
  const router = useRouter();
  const { mobile, username, upiId, logout } = useUserStore();

  async function handleLogout() {
    try {
      await postLogout(mobile);
    } catch {
      // ignore errors; proceed to logout
    } finally {
      logout();
      toast("Logged out");
      router.replace("/login");
    }
  }

  return (
    <div className="pb-20">
      <div className="p-4 space-y-4">
        <Card className="shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>
              <span className="text-gray-500">Mobile: </span>
              <span className="font-medium">{mobile}</span>
            </div>
            <div>
              <span className="text-gray-500">Username: </span>
              <span className="font-medium">{username || '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">UPI ID: </span>
              <span className="font-medium">{upiId || "Not available"}</span>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full h-12 rounded-xl bg-black text-white hover:bg-gray-800"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}


