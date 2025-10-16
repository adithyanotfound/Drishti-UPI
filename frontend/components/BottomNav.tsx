"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ScanLine, History, User } from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/scan", label: "Scan", icon: ScanLine },
  { href: "/transactions", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white">
      <ul className="flex justify-between max-w-md mx-auto px-4 py-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = pathname?.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`flex flex-col items-center justify-center py-2 text-xs ${
                  active ? "text-black" : "text-gray-500"
                }`}
              >
                <Icon size={22} />
                <span className="mt-1">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


