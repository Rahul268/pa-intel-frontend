"use client";
// v: 2026-06-01-v3
import Nav from "@/components/Nav";
import {
  submissions, getScoreDistribution, getBrandBreakdown,
  getPayerTypeBreakdown, getParameterStats, getStepTherapyMatrix,
  SCORE_COLORS, SCORE_BG, PAYER_COLORS, type Submission,
} from "@/lib/data";
import { useState } from "react";

/* ── score label with range logic ───────────────────────────────────────── */
function scoreLabel(s: number) {
  if (s <= 0)  return "Restricted";
  if (s <= 25) return "Highly Restricted";
  if (s <= 50) return "Moderate";
  if (s <= 75) return "Standard Access";
  return "Open Access";
}
function scoreBucket(s: number) {
  if (s <= 0)  return 0;
  if (s <= 25) return 25;
  if (s <= 50) return 50;
  if (s <= 75) return 75;
  return 100;
}

/* ── design tokens ──────────────────────────────────────────────────────── */
const T = {
  bg:      "#F4F5F7",
  white:   "#FFFFFF",
  border:  "#E2E6EC",
  navy:    "#1B2A4A",
  blue:    "#0066CC",
  text:    "#374151",
  muted:   "#6B7280",
  light:   "#9CA3AF",
  shadow:  "0 2px 8px rgba(27,42,74,0.07)",
};

/* ── Card ────────────────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: T.white, borderRadius: 12, border: `1.5px solid ${T.border}`, boxShadow: T.shadow, ...style }}>
      {children}
    </div>
  );
}

/* ── Section header ─────────────────────────────────────────────────────── */
function Hdr({ label, color = T.blue }: { label: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: T.text }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

/* ── Score Pill ─────────────────────────────────────────────────────────── */
function ScorePill({ score }: { score: number }) {
  const color  = SCORE_COLORS[score] || T.muted;
  const bg     = SCORE_BG[score]     || "#F8F9FA";
  return (
    <span style={{ background: bg, color, border: `1.5px solid ${color}40`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: "IBM Plex Mono, monospace" }}>
      {score}
    </span>
  );
}

/* ── Score Distribution (CSS vertical bars) ──────────────────────────────── */
function ScoreDistChart() {
  const data    = getScoreDistribution();
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const H = 160; // chart height px

  return (
    <div>
      {/* Chart area */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: H, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
        {/* Y-axis */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: H, paddingBottom: 2, paddingTop: 2, width: 28, textAlign: "right", flexShrink: 0 }}>
          {[maxCount, Math.ceil(maxCount * 0.67), Math.ceil(maxCount * 0.33), 0].map(v => (
            <span key={v} style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: T.light, lineHeight: 1 }}>{v}</span>
          ))}
        </div>
        {/* Bars */}
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 16, height: H, borderLeft: `1px solid ${T.border}`, paddingLeft: 12 }}>
          {data.map(d => {
            const barH = d.count === 0 ? 3 : Math.max(8, (d.count / maxCount) * (H - 20));
            const color = SCORE_COLORS[d.score];
            return (
              <div key={d.score} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                {d.count > 0 && (
                  <span style={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color }}>{d.count}</span>
                )}
                <div style={{ width: "100%", height: barH, borderRadius: "4px 4px 0 0", background: color, opacity: d.count === 0 ? 0.18 : 1 }} />
              </div>
            );
          })}
        </div>
      </div>
      {/* X-axis */}
      <div style={{ display: "flex", paddingLeft: 40, marginTop: 6 }}>
        {data.map(d => (
          <div key={d.score} style={{ flex: 1, textAlign: "center", fontSize: 11, fontFamily: "IBM Plex Mono, monospace", color: T.muted }}>{d.score}</div>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px 16px", marginTop: 10 }}>
        {data.filter(d => d.count > 0).map(d => (
          <div key={d.score} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: SCORE_COLORS[d.score] }} />
            <span style={{ fontSize: 11, color: T.muted }}>{d.score} — {d.label} ({d.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Donut Chart ─────────────────────────────────────────────────────────── */
function DonutChart() {
  const data  = getPayerTypeBreakdown();
  const total = data.reduce((s, d) => s + d.count, 0);
  const r = 38, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div>
      {/* SVG donut */}
      <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 12px" }}>
        <svg viewBox="0 0 100 100" style={{ width: 140, height: 140, transform: "rotate(-90deg)", display: "block" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth="14" />
          {data.map(d => {
            const dash = (d.count / total) * circ;
            const seg = (
              <circle key={d.type} cx={cx} cy={cy} r={r} fill="none"
                stroke={PAYER_COLORS[d.type] || T.light}
                strokeWidth="14"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        {/* Center label — absolutely positioned inside the SVG container */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: T.navy, fontFamily: "IBM Plex Mono, monospace", lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: 9, color: T.muted, textTransform: "uppercase" as const, letterSpacing: "1px", marginTop: 2 }}>total</span>
        </div>
      </div>
      {/* Legend */}
      <div>
        {data.map(d => (
          <div key={d.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid #F3F4F6` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: PAYER_COLORS[d.type], flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{d.type}</span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", color: T.muted }}>{d.count}</span>
              <span style={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", fontWeight: 700, color: SCORE_COLORS[scoreBucket(d.avgScore)] }}>avg {d.avgScore}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Brand Horizontal Bar Chart ─────────────────────────────────────────── */
function BrandChart() {
  const data = getBrandBreakdown().slice(0, 8);
  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
      {data.map(d => {
        const color = SCORE_COLORS[scoreBucket(d.avgScore)];
        return (
          <div key={d.brand} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 80, textAlign: "right", fontSize: 11.5, fontWeight: 700, color: T.navy, flexShrink: 0 }}>{d.brand}</div>
            <div style={{ flex: 1, height: 10, background: "#F3F4F6", borderRadius: 99, overflow: "hidden", border: `1px solid ${T.border}` }}>
              <div style={{ width: `${d.avgScore}%`, height: "100%", background: color, borderRadius: 99 }} />
            </div>
            <span style={{ width: 28, textAlign: "right", fontSize: 11, fontFamily: "IBM Plex Mono, monospace", fontWeight: 700, color, flexShrink: 0 }}>{d.avgScore}</span>
            <span style={{ width: 36, fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: T.light, flexShrink: 0 }}>n={d.count}</span>
          </div>
        );
      })}
      <div style={{ display: "flex", marginLeft: 90, marginRight: 64, marginTop: 4 }}>
        {[0, 25, 50, 75, 100].map(v => (
          <div key={v} style={{ flex: 1, fontSize: 9, fontFamily: "IBM Plex Mono, monospace", color: "#C4CBD4", textAlign: v === 0 ? "left" : v === 100 ? "right" : "center" as any }}>{v}</div>
        ))}
      </div>
    </div>
  );
}

/* ── Restriction Parameter Coverage ─────────────────────────────────────── */
function ParamBars() {
  const data = getParameterStats();
  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
      {data.map(p => {
        const color = p.pct > 70 ? "#C0180C" : p.pct > 40 ? "#B45309" : "#0A7A45";
        return (
          <div key={p.param}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{p.param}</span>
              <span style={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", fontWeight: 700, color: T.navy }}>{p.pct}%</span>
            </div>
            <div style={{ height: 8, background: "#F3F4F6", borderRadius: 99, overflow: "hidden", border: `1px solid ${T.border}` }}>
              <div style={{ width: `${p.pct}%`, height: "100%", background: color, borderRadius: 99 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Detail slide panel ──────────────────────────────────────────────────── */
function DetailPanel({ row, onClose }: { row: Submission; onClose: () => void }) {
  const color = SCORE_COLORS[row.accessScore] || T.muted;
  const bg    = SCORE_BG[row.accessScore]    || "#F8F9FA";
  return (
    <div style={{ position: "fixed", right: 0, top: 52, bottom: 0, width: 380, background: T.white, borderLeft: `1.5px solid ${T.border}`, overflowY: "auto" as const, zIndex: 50, boxShadow: "-4px 0 24px rgba(27,42,74,0.10)" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1.5px solid ${T.border}`, position: "sticky" as const, top: 0, background: T.white, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: T.light, marginBottom: 2 }}>{row.filename}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{row.brand}</div>
          <div style={{ fontSize: 12, color: T.muted }}>{row.payerType}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: T.light, padding: 4, lineHeight: 1 }}>✕</button>
      </div>
      {/* Score banner */}
      <div style={{ padding: "20px 24px", textAlign: "center", borderBottom: `1.5px solid ${T.border}`, background: bg }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color, marginBottom: 4 }}>Access Score</div>
        <div style={{ fontSize: 52, fontWeight: 700, color, fontFamily: "IBM Plex Mono, monospace", lineHeight: 1, marginBottom: 4 }}>{row.accessScore}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color }}>{scoreLabel(row.accessScore)}</div>
      </div>
      {/* Params */}
      <div style={{ padding: "16px 24px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: T.muted, marginBottom: 12 }}>Parameters</div>
        {[
          ["Age", row.age], ["Branded Steps", row.brandedSteps], ["Generic Steps", row.genericSteps],
          ["Phototherapy", row.phototherapy], ["TB Test", row.tbTest], ["Specialist", row.specialistTypes],
          ["Initial Auth", row.initAuthDuration], ["Reauth Duration", row.reauthDuration], ["Reauth Required", row.reauthRequired],
        ].map(([lbl, val]) => (
          <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid #F3F4F6` }}>
            <span style={{ fontSize: 12, color: T.muted }}>{lbl}</span>
            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "IBM Plex Mono, monospace", color: !val || val === "NA" ? T.light : T.navy }}>{val || "NA"}</span>
          </div>
        ))}
        {[["Step Therapy", row.stepTherapy], ["Reauth Requirements", row.reauthRequirements], ["Quantity Limits", row.quantityLimits]].map(([lbl, val]) => (
          <div key={lbl} style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: T.muted, marginBottom: 6 }}>{lbl}</div>
            <div style={{ fontSize: 12, color: T.text, lineHeight: 1.65, background: "#F8F9FB", borderRadius: 8, padding: 12, border: `1.5px solid ${T.border}` }}>{val || "NA"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [sel, setSel]       = useState<Submission | null>(null);
  const [fBrand, setFBrand] = useState("All");
  const [fPayer, setFPayer] = useState("All");

  const matrix    = getStepTherapyMatrix();
  const avgScore  = Math.round(submissions.reduce((s, r) => s + r.accessScore, 0) / submissions.length);
  const brands    = Array.from(new Set(submissions.map(s => s.brand))).sort();
  const payers    = Array.from(new Set(submissions.map(s => s.payerType)));
  const filtered  = submissions.filter(s =>
    (fBrand === "All" || s.brand === fBrand) && (fPayer === "All" || s.payerType === fPayer)
  );
  const avgColor  = SCORE_COLORS[scoreBucket(avgScore)];

  const CELL: React.CSSProperties = { padding: "10px 14px" };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Inter, system-ui, sans-serif" }}>
      <Nav />
      <main style={{ paddingTop: 68, paddingBottom: 64, paddingLeft: 32, paddingRight: 32, maxWidth: 1440, margin: "0 auto" }}>

        {/* Page header */}
        <div style={{ padding: "24px 0 20px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: T.blue, marginBottom: 4 }}>Analytics Dashboard</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, marginBottom: 4, letterSpacing: -0.3 }}>Access Score Intelligence</h1>
          <p style={{ fontSize: 13, color: T.muted }}>Prior authorization policy analysis · {submissions.length} submissions · {brands.length} brands</p>
        </div>

        {/* KPIs — 4 equal columns */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Submissions",    value: submissions.length,                                         sub: "policies analyzed",     color: T.blue     },
            { label: "Average Access Score", value: avgScore,                                                   sub: scoreLabel(avgScore),    color: avgColor    },
            { label: "Brands Covered",       value: brands.length,                                              sub: brands.slice(0,3).join(" · ") + (brands.length > 3 ? ` +${brands.length-3}` : ""), color: "#7C3AED" },
            { label: "Open Access (100)",    value: submissions.filter(s => s.accessScore === 100).length,     sub: "fully unrestricted",    color: "#008C7E"   },
          ].map(k => (
            <Card key={k.label} style={{ padding: 20, borderTop: `3px solid ${k.color}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: T.muted, marginBottom: 8 }}>{k.label}</p>
              <p style={{ fontSize: 30, fontWeight: 700, fontFamily: "IBM Plex Mono, monospace", color: k.color, lineHeight: 1, marginBottom: 6 }}>{k.value}</p>
              <p style={{ fontSize: 11, color: T.light }}>{k.sub}</p>
            </Card>
          ))}
        </div>

        {/* Row 1: Score dist (2/3) + Payer (1/3) */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
          <Card style={{ padding: 20 }}>
            <Hdr label="Access Score Distribution" />
            <ScoreDistChart />
          </Card>
          <Card style={{ padding: 20 }}>
            <Hdr label="Payer Type Mix" color="#7C3AED" />
            <DonutChart />
          </Card>
        </div>

        {/* Row 2: Brand (1/2) + Coverage (1/2) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <Card style={{ padding: 20 }}>
            <Hdr label="Brand · Avg Access Score" color="#7C3AED" />
            <BrandChart />
          </Card>
          <Card style={{ padding: 20 }}>
            <Hdr label="Restriction Parameter Coverage" color="#C0180C" />
            <p style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>% of {submissions.length} submissions where restriction applies</p>
            <ParamBars />
          </Card>
        </div>

        {/* Step Therapy Matrix */}
        <Card style={{ padding: 20, marginBottom: 20 }}>
          <Hdr label="Step Therapy Burden Matrix" />
          <p style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>Branded + generic step combinations across all {submissions.length} submissions</p>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12 }}>
            {matrix.map(m => (
              <div key={m.key} style={{ background: "#F8F9FB", border: `1.5px solid ${T.border}`, borderRadius: 8, padding: "12px 20px", textAlign: "center", minWidth: 100 }}>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "IBM Plex Mono, monospace", color: T.navy, lineHeight: 1 }}>{m.count}</div>
                <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: T.muted, marginTop: 4 }}>{m.key}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Submissions Table */}
        <Card style={{ overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ padding: "14px 20px", background: "#F8F9FB", borderBottom: `1.5px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
            <div>
              <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: T.text }}>Submissions</p>
              <p style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{filtered.length} records · click any row to inspect</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {([[fBrand, setFBrand, ["All", ...brands]], [fPayer, setFPayer, ["All", ...payers]]] as [string, (v: string) => void, string[]][]).map(([val, setter, opts], i) => (
                <select key={i} value={val} onChange={e => setter(e.target.value)}
                  style={{ background: T.white, border: `1.5px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 11.5, fontWeight: 500, color: T.text, outline: "none", cursor: "pointer" }}>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              ))}
            </div>
          </div>

          <div style={{ overflowX: "auto" as const }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F8F9FB", borderBottom: `1.5px solid ${T.border}` }}>
                  {["File", "Brand", "Payer", "Age", "B Steps", "G Steps", "Photo", "TB", "Specialist", "Init Auth", "Reauth", "Score"].map(h => (
                    <th key={h} style={{ ...CELL, textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: T.muted, whiteSpace: "nowrap" as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const isSel = sel?.filename === row.filename && sel?.brand === row.brand;
                  const rowBg = isSel ? "#EEF5FF" : i % 2 === 0 ? T.white : "#FAFBFC";
                  return (
                    <tr key={i} onClick={() => setSel(isSel ? null : row)}
                      style={{ borderBottom: `1px solid #F3F4F6`, cursor: "pointer", background: rowBg, borderLeft: isSel ? `3px solid ${T.blue}` : "3px solid transparent" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F8F9FB"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = rowBg; }}>
                      <td style={{ ...CELL, fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: T.light, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{row.filename}</td>
                      <td style={{ ...CELL, fontWeight: 700, fontSize: 13, color: T.navy }}>{row.brand}</td>
                      <td style={{ ...CELL }}>
                        <span style={{ background: `${PAYER_COLORS[row.payerType]}18`, color: PAYER_COLORS[row.payerType], border: `1px solid ${PAYER_COLORS[row.payerType]}40`, borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" as const }}>{row.payerType}</span>
                      </td>
                      <td style={{ ...CELL, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: T.text }}>{row.age}</td>
                      <td style={{ ...CELL, textAlign: "center", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 600, color: row.brandedSteps !== "NA" && row.brandedSteps ? "#B45309" : "#C4CBD4" }}>{row.brandedSteps || "NA"}</td>
                      <td style={{ ...CELL, textAlign: "center", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 600, color: row.genericSteps !== "NA" && row.genericSteps ? "#92630A" : "#C4CBD4" }}>{row.genericSteps || "NA"}</td>
                      <td style={{ ...CELL, fontSize: 11, fontWeight: 500, color: row.phototherapy === "Yes" ? "#C0180C" : "#C4CBD4" }}>{row.phototherapy}</td>
                      <td style={{ ...CELL, fontSize: 11, fontWeight: 500, color: row.tbTest === "Yes" ? "#B45309" : "#C4CBD4" }}>{row.tbTest}</td>
                      <td style={{ ...CELL, fontSize: 11, color: T.text, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{row.specialistTypes}</td>
                      <td style={{ ...CELL, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: T.text, whiteSpace: "nowrap" as const }}>{row.initAuthDuration}</td>
                      <td style={{ ...CELL, fontSize: 11, fontWeight: 600, color: row.reauthRequired === "Yes" ? T.blue : "#C4CBD4" }}>{row.reauthRequired}</td>
                      <td style={{ ...CELL }}><ScorePill score={row.accessScore} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {sel && <DetailPanel row={sel} onClose={() => setSel(null)} />}
      </main>
    </div>
  );
}
