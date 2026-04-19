"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  Plus,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/tests", icon: BookOpen, label: "My Tests" },
  { href: "/upload", icon: Upload, label: "Upload PDF" },
  { href: "/tests/new", icon: Plus, label: "New Test" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-ink-900 border-r-2 border-ink-900 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b-2 border-ink-700">
        <Link href="/dashboard" className="font-display text-2xl font-black text-ink-50">
          JEE<span className="text-amber-500">Forge</span>
        </Link>
        <p className="text-xs text-ink-400 font-mono mt-0.5">Mock Test Generator</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-body font-medium transition-all duration-100 border-2",
                active
                  ? "bg-amber-500 text-ink-900 border-amber-500 shadow-ink-sm"
                  : "text-ink-300 border-transparent hover:bg-ink-800 hover:text-ink-50 hover:border-ink-700"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t-2 border-ink-700 flex items-center gap-3">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 border-2 border-ink-600",
            },
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-ink-400 font-mono truncate">Account</p>
        </div>
      </div>
    </aside>
  );
}
