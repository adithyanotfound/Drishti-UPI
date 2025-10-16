"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getPaymentHistory, getUserByUpi } from "@/lib/api";
import { useUserStore } from "@/store/user";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

type Txn = {
  sender: string;
  receiver: string;
  amount: number;
  status?: string;
  createdAt?: string | number | Date;
};

export default function TransactionsPage() {
  const router = useRouter();
  const { signedIn, upiId } = useUserStore();
  const [items, setItems] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!signedIn) {
      router.replace("/login");
      return;
    }
    if (!upiId) return;
    getPaymentHistory(upiId)
      .then((list) => {
        const normalized = (list as Txn[]).sort((a, b) => {
          const da = new Date(a.createdAt || 0).getTime();
          const db = new Date(b.createdAt || 0).getTime();
          return db - da;
        });
        setItems(normalized);
        // optional: prefetch usernames into a simple cache in memory
        const uniqueUpis = Array.from(new Set(normalized.flatMap(t => [t.sender, t.receiver])));
        uniqueUpis.forEach((id) => {
          getUserByUpi(id).catch(() => null);
        });
      })
      .finally(() => setLoading(false));
  }, [signedIn, upiId, router]);

  return (
    <div className="pb-20">
      <div className="p-4 space-y-3">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-neutral-100 rounded-xl" />
            ))}
          </div>
        )}
        {!loading && items.length === 0 && (
          <p className="text-sm text-gray-600">No transactions yet.</p>
        )}
        {!loading &&
          items.map((t, i) => (
            <Card key={i} className="shadow-md rounded-2xl">
              <CardContent className="py-3">
                <div className="flex justify-between text-sm">
                  <div className="text-gray-700">
                    <div>
                      <span className="font-medium">{t.sender}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{t.receiver}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {t.status || "success"} • {new Date(t.createdAt || Date.now()).toLocaleString()}
                    </div>
                  </div>
                  <div className="font-semibold">₹{t.amount}</div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
      <BottomNav />
    </div>
  );
}


