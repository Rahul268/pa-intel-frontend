"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const path = usePathname();
  const links = [
    { href: "/",           icon: "📊", label: "Dashboard"  },
    { href: "/extraction", icon: "📤", label: "Extraction" },
  ];
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      background: "#1B2A4A", borderBottom: "1px solid #243B60",
      height: 52, display: "flex", alignItems: "center",
    }}>
      <div style={{
        maxWidth: 1440, width: "100%", margin: "0 auto",
        padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 30, height: 30, background: "#0066CC", borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.5px",
          }}>PA</div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "-0.2px" }}>
            PA Intelligence
          </span>
          <span style={{ color: "#4A6A8A", fontSize: 11, borderLeft: "1px solid #243B60", paddingLeft: 12, marginLeft: 4, display: "none" }}
            className="md:block">
            Prior Authorization Analytics
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {links.map(l => {
            const active = path === l.href;
            return (
              <Link key={l.href} href={l.href} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 16px", borderRadius: 6,
                fontSize: 12, fontWeight: 600,
                background: active ? "#0066CC" : "transparent",
                color: active ? "#fff" : "#8AAEC8",
                textDecoration: "none",
                transition: "all 0.15s",
                border: active ? "none" : "1px solid transparent",
              }}>
                <span>{l.icon}</span>
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
