"use client";
// v: 2026-06-01 redesign-v2
import Nav from "@/components/Nav";
import {
  submissions, getScoreDistribution, getBrandBreakdown,
  getPayerTypeBreakdown, getParameterStats, getStepTherapyMatrix,
  scoreLabel, SCORE_COLORS, SCORE_BG, PAYER_COLORS, type Submission,
} from "@/lib/data";
import { useState } from "react";

/* ─── Helpers ──────────────────────────────────────────────────────────── */
function ScorePill({ score }: { score: number }) {
  return (
    <span className={`score-${score} rounded px-2 py-0.5 text-[11px] font-bold font-mono`}>{score}</span>
  );
}

function SectionHdr({ label, color = "#0066CC" }: { label: string; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-[3px] h-[18px] rounded-sm flex-shrink-0" style={{ background: color }} />
      <span className="text-[10.5px] font-bold tracking-[2px] uppercase text-[#374151]">{label}</span>
      <div className="flex-1 h-px bg-[#E2E6EC]" />
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border-[1.5px] border-[#E2E6EC] shadow-[0_2px_8px_rgba(27,42,74,0.07)] ${className}`}>
      {children}
    </div>
  );
}

/* ─── Pure CSS Score Distribution Bar Chart ────────────────────────────── */
function ScoreDistChart() {
  const data = getScoreDistribution();
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <div>
      <div className="flex items-end gap-3 h-[180px] border-b border-[#E5E7EB] pb-0">
        {/* Y-axis */}
        <div className="flex flex-col justify-between h-full pb-1 w-8 text-right">
          {[maxCount, Math.round(maxCount * 0.67), Math.round(maxCount * 0.33), 0].map(v => (
            <span key={v} className="text-[10px] font-mono text-[#9CA3AF] leading-none">{v}</span>
          ))}
        </div>
        {/* Bars */}
        <div className="flex-1 flex items-end gap-4 h-full border-l border-[#E5E7EB] px-4">
          {data.map(d => {
            const h = d.count === 0 ? 3 : Math.max(8, (d.count / maxCount) * 160);
            return (
              <div key={d.score} className="flex-1 flex flex-col items-center gap-1 group">
                {d.count > 0 && (
                  <span className="text-[11px] font-mono font-semibold" style={{ color: SCORE_COLORS[d.score] }}>{d.count}</span>
                )}
                <div className="w-full rounded-t-md transition-all" style={{ height: h, background: SCORE_COLORS[d.score], opacity: d.count === 0 ? 0.18 : 0.9 }} />
              </div>
            );
          })}
        </div>
      </div>
      {/* X-axis labels */}
      <div className="flex gap-4 mt-1 pl-12">
        {data.map(d => (
          <div key={d.score} className="flex-1 text-center text-[11px] font-mono text-[#6B7280]">{d.score}</div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {data.filter(d => d.count > 0).map(d => (
          <div key={d.score} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: SCORE_COLORS[d.score] }} />
            <span className="text-[11px] text-[#6B7280]">{d.score} — {d.label} ({d.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── CSS Donut Chart ───────────────────────────────────────────────────── */
function DonutChart() {
  const data = getPayerTypeBreakdown();
  const total = data.reduce((s, d) => s + d.count, 0);
  const radius = 40, cx = 50, cy = 50;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = data.map(d => {
    const pct = (d.count / total) * 100;
    const dash = (pct / 100) * circumference;
    const seg = { ...d, dash, offset, pct };
    offset += dash;
    return seg;
  });
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[140px] h-[140px]">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#F3F4F6" strokeWidth="12" />
          {segments.map(seg => (
            <circle key={seg.type} cx={cx} cy={cy} r={radius} fill="none"
              stroke={PAYER_COLORS[seg.type] || "#9CA3AF"} strokeWidth="12"
              strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
              strokeDashoffset={-seg.offset} />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[20px] font-bold text-[#1B2A4A] font-mono">{total}</span>
          <span className="text-[9px] text-[#6B7280] uppercase tracking-wider">total</span>
        </div>
      </div>
      <div className="w-full space-y-1.5 mt-3">
        {data.map(d => (
          <div key={d.type} className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6] last:border-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: PAYER_COLORS[d.type] }} />
              <span className="text-[12px] font-medium text-[#374151]">{d.type}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-[#6B7280]">{d.count}</span>
              <span className="text-[11px] font-mono font-bold" style={{ color: SCORE_COLORS[Math.round(d.avgScore / 25) * 25] || "#6B7280" }}>avg {d.avgScore}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Horizontal Bar Row ────────────────────────────────────────────────── */
function HBar({ label, value, max, color, unit = "" }: { label: string; value: number; max: number; color: string; unit?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-[95px] text-[11.5px] font-medium text-[#374151] text-right flex-shrink-0 truncate">{label}</div>
      <div className="flex-1 h-[9px] bg-[#F3F4F6] rounded-full overflow-hidden border border-[#E5E7EB]">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="w-10 text-right text-[11px] font-mono font-bold text-[#1B2A4A] flex-shrink-0">{value}{unit}</div>
    </div>
  );
}

/* ─── Brand chart ───────────────────────────────────────────────────────── */
function BrandChart() {
  const data = getBrandBreakdown().slice(0, 8);
  const maxScore = 100;
  return (
    <div className="space-y-3">
      {data.map(d => {
        const color = SCORE_COLORS[Math.round(d.avgScore / 25) * 25] || "#6B7280";
        return (
          <div key={d.brand} className="flex items-center gap-3">
            <div className="w-[85px] text-[11.5px] font-bold text-[#1B2A4A] text-right flex-shrink-0 truncate">{d.brand}</div>
            <div className="flex-1 h-[10px] bg-[#F3F4F6] rounded-full overflow-hidden border border-[#E5E7EB]">
              <div className="h-full rounded-full" style={{ width: `${(d.avgScore / maxScore) * 100}%`, background: color }} />
            </div>
            <div className="w-8 text-right text-[11px] font-mono font-bold flex-shrink-0" style={{ color }}>{d.avgScore}</div>
            <div className="w-12 text-[10px] text-[#9CA3AF] font-mono flex-shrink-0">n={d.count}</div>
          </div>
        );
      })}
      {/* X-axis markers */}
      <div className="flex ml-[88px] mr-[84px]">
        {[0, 25, 50, 75, 100].map(v => (
          <div key={v} className="flex-1 text-[9px] font-mono text-[#C4CBD4]" style={{ textAlign: v === 0 ? "left" : v === 100 ? "right" : "center" }}>{v}</div>
        ))}
      </div>
    </div>
  );
}

/* ─── Restriction param bars ────────────────────────────────────────────── */
function ParamCoverage() {
  const data = getParameterStats();
  return (
    <div className="space-y-3">
      {data.map(p => {
        const color = p.pct > 70 ? "#C0180C" : p.pct > 40 ? "#B45309" : "#0A7A45";
        return (
          <div key={p.param}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[12px] font-medium text-[#374151]">{p.param}</span>
              <span className="text-[11px] font-mono font-bold text-[#1B2A4A]">{p.pct}%</span>
            </div>
            <div className="h-[8px] bg-[#F3F4F6] rounded-full overflow-hidden border border-[#E2E6EC]">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.pct}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Detail Panel ─────────────────────────────────────────────────────── */
function DetailPanel({ row, onClose }: { row: Submission; onClose: () => void }) {
  return (
    <div className="fixed right-0 top-[52px] bottom-0 w-[380px] bg-white border-l-[1.5px] border-[#E2E6EC] overflow-y-auto z-40 shadow-2xl">
      <div className="px-6 py-4 border-b-[1.5px] border-[#E2E6EC] sticky top-0 bg-white z-10 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-mono text-[#9CA3AF] mb-0.5">{row.filename}</p>
          <p className="text-[15px] font-bold text-[#1B2A4A]">{row.brand}</p>
          <p className="text-[12px] text-[#6B7280]">{row.payerType}</p>
        </div>
        <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1B2A4A] text-xl w-7 h-7 flex items-center justify-center rounded hover:bg-[#F4F5F7] transition-colors">✕</button>
      </div>
      {/* Score banner */}
      <div className="px-6 py-5 text-center border-b-[1.5px] border-[#E2E6EC]" style={{ background: SCORE_BG[row.accessScore] }}>
        <p className="text-[10px] font-bold tracking-[2px] uppercase mb-1" style={{ color: SCORE_COLORS[row.accessScore] }}>Access Score</p>
        <p className="text-[48px] font-bold font-mono leading-none mb-1" style={{ color: SCORE_COLORS[row.accessScore] }}>{row.accessScore}</p>
        <p className="text-[12px] font-semibold" style={{ color: SCORE_COLORS[row.accessScore] }}>{scoreLabel(row.accessScore)}</p>
      </div>
      {/* Params */}
      <div className="px-6 py-4">
        <p className="text-[10px] font-bold tracking-[2px] uppercase text-[#6B7280] mb-3">Parameters</p>
        {[
          ["Age", row.age], ["Branded Steps", row.brandedSteps], ["Generic Steps", row.genericSteps],
          ["Phototherapy", row.phototherapy], ["TB Test", row.tbTest],
          ["Specialist", row.specialistTypes], ["Initial Auth", row.initAuthDuration],
          ["Reauth Duration", row.reauthDuration], ["Reauth Required", row.reauthRequired],
        ].map(([lbl, val]) => (
          <div key={lbl} className="flex justify-between items-center py-2 border-b border-[#F3F4F6] last:border-0">
            <span className="text-[12px] text-[#6B7280]">{lbl}</span>
            <span className={`text-[12px] font-semibold font-mono ${!val || val === "NA" ? "text-[#9CA3AF]" : "text-[#1B2A4A]"}`}>{val || "NA"}</span>
          </div>
        ))}
        {[["Step Therapy", row.stepTherapy], ["Reauth Requirements", row.reauthRequirements], ["Quantity Limits", row.quantityLimits]].map(([lbl, val]) => (
          <div key={lbl} className="mt-4">
            <p className="text-[10px] font-bold tracking-[2px] uppercase text-[#6B7280] mb-1.5">{lbl}</p>
            <p className="text-[11.5px] text-[#374151] leading-relaxed bg-[#F8F9FB] rounded-lg p-3 border-[1.5px] border-[#E2E6EC]">{val || "NA"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ───────────────────────────────────────────────────── */
export default function Dashboard() {
  const [sel, setSel] = useState<Submission | null>(null);
  const [fBrand, setFBrand] = useState("All");
  const [fPayer, setFPayer] = useState("All");

  const matrix = getStepTherapyMatrix();
  const avgScore = Math.round(submissions.reduce((s, r) => s + r.accessScore, 0) / submissions.length);
  const brands = Array.from(new Set(submissions.map(s => s.brand))).sort();
  const payers = Array.from(new Set(submissions.map(s => s.payerType)));
  const filtered = submissions.filter(s =>
    (fBrand === "All" || s.brand === fBrand) && (fPayer === "All" || s.payerType === fPayer)
  );

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <Nav />
      <main className="pt-[68px] pb-16 px-8 max-w-[1440px] mx-auto">

        {/* Page header */}
        <div className="py-6 mb-1 fade-up">
          <p className="text-[10px] font-bold tracking-[3px] uppercase text-[#0066CC] mb-1">Analytics Dashboard</p>
          <h1 className="text-[22px] font-bold text-[#1B2A4A] tracking-tight mb-1">Access Score Intelligence</h1>
          <p className="text-[13px] text-[#6B7280]">Prior authorization policy analysis · {submissions.length} submissions · {brands.length} brands</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Submissions",    value: submissions.length,                                                        sub: "policies analyzed",  color: "#0066CC" },
            { label: "Average Access Score", value: avgScore,                                                                  sub: scoreLabel(avgScore), color: SCORE_COLORS[Math.round(avgScore / 25) * 25] },
            { label: "Brands Covered",       value: brands.length,                                                             sub: brands.slice(0, 3).join(" · ") + (brands.length > 3 ? ` +${brands.length - 3}` : ""), color: "#7C3AED" },
            { label: "Open Access (100)",    value: submissions.filter(s => s.accessScore === 100).length,                    sub: "fully unrestricted",  color: "#008C7E" },
          ].map((k, i) => (
            <Card key={i} className={`p-5 fade-up-${i + 1}`} style={{ borderTop: `3px solid ${k.color}` } as React.CSSProperties}>
              <p className="text-[10px] font-bold tracking-[2px] uppercase text-[#6B7280] mb-2">{k.label}</p>
              <p className="text-[28px] font-bold font-mono leading-none mb-1.5" style={{ color: k.color }}>{k.value}</p>
              <p className="text-[11px] text-[#9CA3AF] truncate">{k.sub}</p>
            </Card>
          ))}
        </div>

        {/* Row 1: Score dist + Payer */}
        <div className="grid grid-cols-3 gap-5 mb-5">
          <Card className="col-span-2 p-5 fade-up-1">
            <SectionHdr label="Access Score Distribution" />
            <ScoreDistChart />
          </Card>
          <Card className="p-5 fade-up-2">
            <SectionHdr label="Payer Type Mix" color="#7C3AED" />
            <DonutChart />
          </Card>
        </div>

        {/* Row 2: Brand + Coverage */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <Card className="p-5 fade-up-3">
            <SectionHdr label="Brand · Avg Access Score" color="#7C3AED" />
            <BrandChart />
          </Card>
          <Card className="p-5 fade-up-4">
            <SectionHdr label="Restriction Parameter Coverage" color="#C0180C" />
            <p className="text-[11px] text-[#6B7280] mb-3">% of {submissions.length} submissions where restriction applies</p>
            <ParamCoverage />
          </Card>
        </div>

        {/* Step Matrix */}
        <Card className="p-5 mb-5 fade-up">
          <SectionHdr label="Step Therapy Burden Matrix" />
          <p className="text-[11px] text-[#6B7280] mb-3">Branded + generic step combinations across all {submissions.length} submissions</p>
          <div className="flex flex-wrap gap-3">
            {matrix.map(m => (
              <div key={m.key} className="bg-[#F8F9FB] border-[1.5px] border-[#E2E6EC] rounded-lg px-5 py-3 text-center min-w-[105px] hover:border-[#0066CC] hover:bg-[#EEF5FF] transition-colors cursor-default">
                <div className="text-[24px] font-bold font-mono text-[#1B2A4A]">{m.count}</div>
                <div className="text-[10px] font-mono text-[#6B7280] mt-0.5">{m.key}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden fade-up">
          <div className="px-6 py-4 bg-[#F8F9FB] border-b-[1.5px] border-[#E2E6EC] flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[10.5px] font-bold tracking-[2px] uppercase text-[#374151]">Submissions</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">{filtered.length} records · click any row to inspect</p>
            </div>
            <div className="flex gap-2">
              {([[fBrand, setFBrand, ["All", ...brands]], [fPayer, setFPayer, ["All", ...payers]]] as [string, (v: string) => void, string[]][]).map(([val, setter, opts], i) => (
                <select key={i} value={val} onChange={e => setter(e.target.value)}
                  className="bg-white border-[1.5px] border-[#E2E6EC] rounded-lg px-3 py-1.5 text-[11.5px] font-medium text-[#374151] outline-none focus:border-[#0066CC] shadow-sm cursor-pointer">
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#F8F9FB] border-b-[1.5px] border-[#E2E6EC]">
                  {["File", "Brand", "Payer", "Age", "B Steps", "G Steps", "Photo", "TB", "Specialist", "Init Auth", "Reauth", "Score"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold tracking-[1.5px] uppercase text-[#6B7280] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const isSel = sel?.filename === row.filename && sel?.brand === row.brand;
                  return (
                    <tr key={i} onClick={() => setSel(isSel ? null : row)}
                      className={`border-b border-[#F3F4F6] cursor-pointer transition-colors ${isSel ? "bg-[#EEF5FF] border-l-[3px] border-l-[#0066CC]" : i % 2 === 0 ? "bg-white hover:bg-[#F8F9FB]" : "bg-[#FAFBFC] hover:bg-[#F8F9FB]"}`}>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-[#9CA3AF] max-w-[130px] truncate">{row.filename}</td>
                      <td className="px-4 py-2.5 font-bold text-[13px] text-[#1B2A4A]">{row.brand}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap"
                          style={{ background: `${PAYER_COLORS[row.payerType]}18`, color: PAYER_COLORS[row.payerType], border: `1px solid ${PAYER_COLORS[row.payerType]}40` }}>
                          {row.payerType}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-[#374151]">{row.age}</td>
                      <td className="px-4 py-2.5 text-center font-mono text-[11px] font-semibold" style={{ color: row.brandedSteps !== "NA" && row.brandedSteps ? "#B45309" : "#C4CBD4" }}>{row.brandedSteps || "NA"}</td>
                      <td className="px-4 py-2.5 text-center font-mono text-[11px] font-semibold" style={{ color: row.genericSteps !== "NA" && row.genericSteps ? "#92630A" : "#C4CBD4" }}>{row.genericSteps || "NA"}</td>
                      <td className="px-4 py-2.5 text-[11px] font-medium" style={{ color: row.phototherapy === "Yes" ? "#C0180C" : "#C4CBD4" }}>{row.phototherapy}</td>
                      <td className="px-4 py-2.5 text-[11px] font-medium" style={{ color: row.tbTest === "Yes" ? "#B45309" : "#C4CBD4" }}>{row.tbTest}</td>
                      <td className="px-4 py-2.5 text-[11px] text-[#374151] max-w-[130px] truncate">{row.specialistTypes}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-[#374151] whitespace-nowrap">{row.initAuthDuration}</td>
                      <td className="px-4 py-2.5 text-[11px] font-semibold" style={{ color: row.reauthRequired === "Yes" ? "#0066CC" : "#C4CBD4" }}>{row.reauthRequired}</td>
                      <td className="px-4 py-2.5"><ScorePill score={row.accessScore} /></td>
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
