"use client";
import Nav from "@/components/Nav";
import {
  submissions, getScoreDistribution, getBrandBreakdown, getPayerTypeBreakdown,
  getParameterStats, getStepTherapyMatrix, scoreLabel, SCORE_COLORS, PAYER_TYPE_COLORS,
  type Submission
} from "@/lib/data";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ScatterChart, Scatter, ZAxis, CartesianGrid
} from "recharts";
import { useState } from "react";

// ── Tooltip styles ──────────────────────────────────────────────────────────
const tooltipStyle = {
  backgroundColor: "#0e1520", border: "1px solid #1e2d42",
  borderRadius: "8px", fontSize: "11px", color: "#94a3b8",
};

// ── KPI Card ────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color = "#00d4b8" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="fade-up bg-[#0e1520] border border-[#1e2d42] rounded-xl p-5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${color}40,transparent)` }} />
      <div className="text-[10px] font-mono tracking-widest uppercase text-slate-500 mb-2">{label}</div>
      <div className="font-display text-3xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1 font-mono">{sub}</div>}
    </div>
  );
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-5 rounded-full bg-[#00d4b8]" />
      <h2 className="font-display text-sm font-600 text-slate-200 tracking-wide uppercase">{children}</h2>
      <div className="flex-1 h-px bg-[#1e2d42]" />
    </div>
  );
}

// ── Score badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const cls = `score-${score}`;
  return (
    <span className={`${cls} border rounded px-2 py-0.5 text-xs font-mono font-medium`}>
      {score}
    </span>
  );
}

export default function Dashboard() {
  const [selectedRow, setSelectedRow] = useState<Submission | null>(null);
  const [filterBrand, setFilterBrand] = useState("All");
  const [filterPayer, setFilterPayer] = useState("All");

  const scoreDist = getScoreDistribution();
  const brandData  = getBrandBreakdown();
  const payerData  = getPayerTypeBreakdown();
  const paramStats = getParameterStats();
  const stepMatrix = getStepTherapyMatrix();

  const avgScore = Math.round(submissions.reduce((s, r) => s + r.accessScore, 0) / submissions.length);
  const brands = Array.from(new Set(submissions.map(s => s.brand)));
  const payers = Array.from(new Set(submissions.map(s => s.payerType)));

  const filtered = submissions.filter(s =>
    (filterBrand === "All" || s.brand === filterBrand) &&
    (filterPayer === "All" || s.payerType === filterPayer)
  );

  return (
    <div className="min-h-screen grid-bg">
      <Nav />
      <main className="pt-20 pb-16 px-6 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="mb-8 fade-up">
          <p className="text-[10px] font-mono tracking-[4px] uppercase text-[#00d4b8] mb-2">Analytics Dashboard</p>
          <h1 className="font-display text-3xl font-800 text-white mb-1">Access Score Intelligence</h1>
          <p className="text-sm text-slate-400">Prior authorization policy analysis across {submissions.length} submissions · {brands.length} brands</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPI label="Total Submissions" value={submissions.length} sub="policies analyzed" color="#00d4b8" />
          <KPI label="Average Access Score" value={avgScore} sub={scoreLabel(avgScore)} color="#4f8ef7" />
          <KPI label="Brands Covered" value={brands.length} sub={brands.join(" · ")} color="#a78bfa" />
          <KPI label="Open Access (100)" value={submissions.filter(s => s.accessScore === 100).length} sub="fully accessible" color="#22c55e" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

          {/* Access Score Distribution */}
          <div className="lg:col-span-2 bg-[#0e1520] border border-[#1e2d42] rounded-xl p-5 fade-up-1">
            <SectionTitle>Access Score Distribution</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDist} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
                <XAxis dataKey="score" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "Policies"]} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} label={{ position: "top", fill: "#64748b", fontSize: 11, fontFamily: "DM Mono" }}>
                  {scoreDist.map((entry) => (
                    <Cell key={entry.score} fill={SCORE_COLORS[entry.score]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {scoreDist.map(d => (
                <div key={d.score} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: SCORE_COLORS[d.score] }} />
                  <span className="text-[10px] font-mono text-slate-400">{d.score} — {d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payer Type Breakdown */}
          <div className="bg-[#0e1520] border border-[#1e2d42] rounded-xl p-5 fade-up-2">
            <SectionTitle>Payer Type Distribution</SectionTitle>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={payerData} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {payerData.map((entry) => (
                    <Cell key={entry.type} fill={PAYER_TYPE_COLORS[entry.type] || "#64748b"} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-1">
              {payerData.map(d => (
                <div key={d.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: PAYER_TYPE_COLORS[d.type] }} />
                    <span className="text-xs text-slate-400 font-mono">{d.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-300">{d.count} docs</span>
                    <span className="text-xs font-mono" style={{ color: SCORE_COLORS[Math.round(d.avgScore / 25) * 25] || "#64748b" }}>
                      avg {d.avgScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

          {/* Restriction Parameter Coverage */}
          <div className="bg-[#0e1520] border border-[#1e2d42] rounded-xl p-5 fade-up-3">
            <SectionTitle>Restriction Parameter Coverage</SectionTitle>
            <div className="space-y-3">
              {paramStats.map(p => (
                <div key={p.param} className="flex items-center gap-3">
                  <div className="w-36 text-[11px] font-mono text-slate-400 shrink-0 truncate">{p.param}</div>
                  <div className="flex-1 h-5 bg-[#131c2a] rounded-full overflow-hidden border border-[#1e2d42]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${p.pct}%`, background: p.pct > 60 ? "#ef4444" : p.pct > 30 ? "#f59e0b" : "#22c55e", opacity: 0.8 }}
                    />
                  </div>
                  <div className="w-10 text-right text-xs font-mono text-slate-300">{p.pct}%</div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-3 font-mono">Higher % = more restrictive across submissions</p>
          </div>

          {/* Brand Comparison */}
          <div className="bg-[#0e1520] border border-[#1e2d42] rounded-xl p-5 fade-up-4">
            <SectionTitle>Brand vs Average Access Score</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={brandData} layout="vertical" barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="brand" tick={{ fill: "#94a3b8", fontSize: 12, fontFamily: "Syne", fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}/100`, "Avg Access Score"]} />
                <Bar dataKey="avgScore" radius={[0, 4, 4, 0]} label={{ position: "right", fill: "#64748b", fontSize: 11, fontFamily: "DM Mono", formatter: (v: number) => `${v}` }}>
                  {brandData.map((entry) => (
                    <Cell key={entry.brand} fill={SCORE_COLORS[Math.round(entry.avgScore / 25) * 25] || "#64748b"} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {brandData.map(d => (
                <div key={d.brand} className="bg-[#131c2a] rounded-lg p-3 border border-[#1e2d42]">
                  <div className="font-display font-700 text-sm text-white">{d.brand}</div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">{d.count} submissions · avg <span style={{ color: SCORE_COLORS[Math.round(d.avgScore/25)*25]||"#64748b" }}>{d.avgScore}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Therapy Matrix */}
        <div className="bg-[#0e1520] border border-[#1e2d42] rounded-xl p-5 mb-5 fade-up">
          <SectionTitle>Step Therapy Burden Matrix</SectionTitle>
          <div className="flex flex-wrap gap-3">
            {stepMatrix.map(item => (
              <div key={item.key} className="bg-[#131c2a] border border-[#1e2d42] rounded-lg px-4 py-3 text-center min-w-[100px]">
                <div className="font-display font-700 text-lg text-white">{item.count}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">{item.key}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-3 font-mono">Branded step count + Generic step count combinations across all submissions</p>
        </div>

        {/* Submissions Table */}
        <div className="bg-[#0e1520] border border-[#1e2d42] rounded-xl overflow-hidden fade-up">
          <div className="p-5 border-b border-[#1e2d42] flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionTitle>Submissions</SectionTitle>
              <p className="text-xs text-slate-500 font-mono -mt-3">{filtered.length} rows · click any row for detail</p>
            </div>
            <div className="flex gap-2">
              <select
                value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
                className="bg-[#131c2a] border border-[#1e2d42] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 outline-none"
              >
                <option value="All">All Brands</option>
                {brands.map(b => <option key={b}>{b}</option>)}
              </select>
              <select
                value={filterPayer} onChange={e => setFilterPayer(e.target.value)}
                className="bg-[#131c2a] border border-[#1e2d42] rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 outline-none"
              >
                <option value="All">All Payer Types</option>
                {payers.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1e2d42]">
                  {["File","Brand","Payer","Age","Branded Steps","Generic Steps","Photo","TB","Specialist","Init Auth","Reauth","Score"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedRow(selectedRow?.filename === row.filename && selectedRow?.brand === row.brand ? null : row)}
                    className={`border-b border-[#131c2a] cursor-pointer transition-colors ${
                      selectedRow?.filename === row.filename && selectedRow?.brand === row.brand
                        ? "bg-[#00d4b8]/5 border-l-2 border-l-[#00d4b8]"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400 max-w-[120px] truncate">{row.filename}</td>
                    <td className="px-4 py-3 font-display font-600 text-xs text-white">{row.brand}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: `${PAYER_TYPE_COLORS[row.payerType]}15`, color: PAYER_TYPE_COLORS[row.payerType] }}>
                        {row.payerType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-300">{row.age}</td>
                    <td className="px-4 py-3 font-mono text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-medium ${row.brandedSteps !== "NA" && row.brandedSteps !== "" ? "text-[#f97316] bg-[#f97316]/10" : "text-slate-500"}`}>
                        {row.brandedSteps || "NA"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-medium ${row.genericSteps !== "NA" && row.genericSteps !== "" ? "text-[#f59e0b] bg-[#f59e0b]/10" : "text-slate-500"}`}>
                        {row.genericSteps || "NA"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px]">
                      <span className={row.phototherapy === "Yes" ? "text-red-400" : "text-slate-500"}>{row.phototherapy}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px]">
                      <span className={row.tbTest === "Yes" ? "text-[#f97316]" : "text-slate-500"}>{row.tbTest}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-300 max-w-[100px] truncate">{row.specialistTypes}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-300">{row.initAuthDuration}</td>
                    <td className="px-4 py-3 font-mono text-[10px]">
                      <span className={row.reauthRequired === "Yes" ? "text-[#f59e0b]" : "text-slate-500"}>{row.reauthRequired}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={row.accessScore} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row detail panel */}
        {selectedRow && (
          <div className="fixed right-0 top-14 bottom-0 w-96 bg-[#0a0f14] border-l border-[#1e2d42] overflow-y-auto z-40 fade-up shadow-2xl">
            <div className="p-5 border-b border-[#1e2d42] flex items-start justify-between">
              <div>
                <div className="font-mono text-[10px] text-slate-500 mb-1">{selectedRow.filename}</div>
                <div className="font-display font-700 text-white">{selectedRow.brand}</div>
                <div className="text-xs font-mono text-slate-400 mt-0.5">{selectedRow.payer} · {selectedRow.payerType}</div>
              </div>
              <button onClick={() => setSelectedRow(null)} className="text-slate-500 hover:text-white text-lg p-1">✕</button>
            </div>
            <div className="p-5 text-center border-b border-[#1e2d42]">
              <div className="text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-widest">Access Score</div>
              <div className="font-display text-5xl font-800 mb-1" style={{ color: SCORE_COLORS[selectedRow.accessScore] }}>
                {selectedRow.accessScore}
              </div>
              <div className="text-xs font-mono" style={{ color: SCORE_COLORS[selectedRow.accessScore] }}>{scoreLabel(selectedRow.accessScore)}</div>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "Age", value: selectedRow.age },
                { label: "Branded Steps", value: selectedRow.brandedSteps },
                { label: "Generic Steps", value: selectedRow.genericSteps },
                { label: "Phototherapy", value: selectedRow.phototherapy },
                { label: "TB Test", value: selectedRow.tbTest },
                { label: "Quantity Limits", value: selectedRow.quantityLimits },
                { label: "Specialist Types", value: selectedRow.specialistTypes },
                { label: "Initial Auth Duration", value: selectedRow.initAuthDuration },
                { label: "Reauth Duration", value: selectedRow.reauthDuration },
                { label: "Reauth Required", value: selectedRow.reauthRequired },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-3">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wide shrink-0 w-32">{label}</div>
                  <div className="text-xs font-mono text-slate-200 text-right">{value || "NA"}</div>
                </div>
              ))}
              <div className="pt-3 border-t border-[#1e2d42]">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wide mb-2">Step Therapy</div>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedRow.stepTherapy}</p>
              </div>
              <div className="pt-3 border-t border-[#1e2d42]">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wide mb-2">Reauth Requirements</div>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedRow.reauthRequirements}</p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
