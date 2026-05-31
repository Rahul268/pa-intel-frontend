"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const path = usePathname();
  const links = [
    { href: "/", label: "Dashboard", icon: "▦" },
    { href: "/extraction", label: "Extraction", icon: "⬡" },
  ];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e2d42] bg-[#080c12]/90 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#00d4b8]/10 border border-[#00d4b8]/30 flex items-center justify-center">
            <span className="text-[#00d4b8] text-xs font-bold font-mono">PA</span>
          </div>
          <span className="font-display font-700 text-sm tracking-wide text-white">
            PA Intelligence
          </span>
          <span className="text-[#1e2d42] text-xs">|</span>
          <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">Prior Authorization Analytics</span>
        </div>
        <div className="flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                path === l.href
                  ? "bg-[#00d4b8]/10 text-[#00d4b8] border border-[#00d4b8]/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <span>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
