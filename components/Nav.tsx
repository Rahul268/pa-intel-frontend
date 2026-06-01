"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const path = usePathname();
  const links = [
    { href: "/",           label: "Dashboard" },
    { href: "/extraction", label: "Extraction" },
  ];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A2540] border-b border-[#0F3060]">
      <div className="max-w-[1440px] mx-auto px-8 h-14 flex items-center justify-between">

        {/* Wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#0066CC] rounded flex items-center justify-center">
              <span className="text-white text-[10px] font-bold font-mono">PA</span>
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">
              PA Intelligence
            </span>
          </div>
          <span className="text-[#3A5A7A] text-[11px] font-mono hidden md:block">
            Prior Authorization Analytics
          </span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={`px-4 py-1.5 rounded text-xs font-medium transition-all duration-150 ${
                path === l.href
                  ? "bg-[#0066CC] text-white"
                  : "text-[#8AAEC8] hover:text-white hover:bg-[#0F3060]"
              }`}>
              {l.label}
            </Link>
          ))}
        </div>

      </div>
    </nav>
  );
}
