"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1B2A4A] border-b border-[#243B60] h-[52px]">
      <div className="max-w-[1440px] mx-auto px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-[30px] h-[30px] bg-[#0066CC] rounded-md flex items-center justify-center font-mono text-[11px] font-bold text-white tracking-wide">PA</div>
          <span className="text-white font-bold text-[14px] tracking-tight">PA Intelligence</span>
          <span className="hidden md:block text-[#4A6A8A] text-[11px] border-l border-[#243B60] pl-3 ml-1">Prior Authorization Analytics</span>
        </div>
        <div className="flex items-center gap-1.5">
          {([
            ["/", "📊", "Dashboard"],
            ["/extraction", "📤", "Extraction"],
          ] as [string, string, string][]).map(([href, icon, label]) => (
            <Link key={href} href={href}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-150 ${
                path === href
                  ? "bg-[#0066CC] text-white"
                  : "text-[#8AAEC8] hover:bg-[#243B60] hover:text-white"
              }`}>
              <span>{icon}</span>{label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
