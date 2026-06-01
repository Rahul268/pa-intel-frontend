"use client";
import Nav from "@/components/Nav";
import {
  submissions, getScoreDistribution, getBrandBreakdown, getPayerTypeBreakdown,
  getParameterStats, getStepTherapyMatrix, scoreLabel,
  SCORE_COLORS, SCORE_BG, PAYER_COLORS, type Submission,
} from "@/lib/data";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, CartesianGrid,
} from "recharts";
import { useState } from "react";

/* ── Shared primitives ───────────────────────────────────────────────────── */
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1 h-5 rounded-full bg-[#0066CC]" />
      <h2 className="text-[11px] font-semibold tracking-[2px] uppercase text-[#3D4E5C]">{label}</h2>
      <div className="flex-1 h-px bg-[#E2E6EC]" />
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-[#E2E6EC] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  return (
    <span className={`score-${score} rounded px-2 py-0.5 text-[11px] font-semibold font-mono`}>
      {score}
    </span>
  );
}

const TT_STYLE = {
  backgroundColor: "#fff", border: "1px solid #E2E6EC",
  borderRadius: 8, fontSize: 12, color: "#0F1923",
  boxShadow: "0 4px 12px rgba(15,25,35,0.08)",
};

/* ── KPI ─────────────────────────────────────────────────────────────────── */
function KPI({ label, value, sub, accent = "#0066CC" }:
  { label: string; value: string|number; sub?: string; accent?: string }) {
  return (
    <Card className="p-5 fade-up">
      <div className="text-[10px] font-semibold tracking-[2px] uppercase text-[#6B7D8E] mb-3">{label}</div>
      <div className="text-3xl font-bold tabular-nums" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-xs text-[#6B7D8E] mt-1.5">{sub}</div>}
    </Card>
  );
}

/* ── Score Distribution custom bar label ─────────────────────────────────── */
const BarLabel = ({ x, y, width, value }: { x?: number; y?: number; width?: number; value?: number }) =>
  value ? (
    <text x={(x??0)+(width??0)/2} y={(y??0)-6} fill="#3D4E5C" fontSize={11} fontFamily="IBM Plex Mono" textAnchor="middle">
      {value}
    </text>
  ) : null;

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [selectedRow, setSelectedRow] = useState<Submission|null>(null);
  const [filterBrand, setFilterBrand] = useState("All");
  const [filterPayer, setFilterPayer] = useState("All");

  const scoreDist  = getScoreDistribution();
  const brandData  = getBrandBreakdown();
  const payerData  = getPayerTypeBreakdown();
  const paramStats = getParameterStats();
  const stepMatrix = getStepTherapyMatrix();

  const avgScore = Math.round(submissions.reduce((s,r) => s+r.accessScore,0)/submissions.length);
  const brands = Array.from(new Set(submissions.map(s=>s.brand)));
  const payers = Array.from(new Set(submissions.map(s=>s.payerType)));

  const filtered = submissions.filter(s =>
    (filterBrand==="All"||s.brand===filterBrand) &&
    (filterPayer==="All"||s.payerType===filterPayer)
  );

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <Nav />
      <main className="pt-20 pb-16 px-6 max-w-[1440px] mx-auto">

        {/* Page header */}
        <div className="mb-8 fade-up">
          <p className="text-[10px] font-semibold tracking-[3px] uppercase text-[#0066CC] mb-1.5">Analytics Dashboard</p>
          <h1 className="text-2xl font-bold text-[#0F1923] mb-1">Access Score Intelligence</h1>
          <p className="text-sm text-[#6B7D8E]">
            Prior authorization policy analysis across {submissions.length} submissions · {brands.length} brands
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPI label="Total Submissions" value={submissions.length} sub="policies analyzed" accent="#0066CC" />
          <KPI label="Average Access Score" value={avgScore} sub={scoreLabel(avgScore)} accent={SCORE_COLORS[Math.round(avgScore/25)*25]} />
          <KPI label="Brands Covered" value={brands.length} sub={brands.join(" · ")} accent="#008C7E" />
          <KPI label="Open Access (100)" value={submissions.filter(s=>s.accessScore===100).length} sub="fully unrestricted" accent="#0A7A45" />
        </div>

        {/* Row 1: Score dist + Payer pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

          <Card className="lg:col-span-2 p-6 fade-up-1">
            <Divider label="Access Score Distribution" />
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={scoreDist} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="4 4" stroke="#F0F2F5" vertical={false} />
                <XAxis dataKey="score" tick={{ fill:"#6B7D8E", fontSize:12, fontFamily:"IBM Plex Mono" }}
                  axisLine={{ stroke:"#E2E6EC" }} tickLine={false} />
                <YAxis tick={{ fill:"#6B7D8E", fontSize:11, fontFamily:"IBM Plex Mono" }}
                  axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT_STYLE}
                  formatter={(v:number) => [v, "Policies"]}
                  labelFormatter={(l:number) => `Score ${l} — ${scoreLabel(l)}`} />
                <Bar dataKey="count" radius={[4,4,0,0]} label={<BarLabel />}>
                  {scoreDist.map(d => (
                    <Cell key={d.score} fill={SCORE_COLORS[d.score]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 mt-2">
              {scoreDist.map(d => (
                <div key={d.score} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: SCORE_COLORS[d.score] }} />
                  <span className="text-[11px] text-[#6B7D8E]">{d.score} — {d.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 fade-up-2">
            <Divider label="Payer Type Mix" />
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={payerData} dataKey="count" nameKey="type"
                  cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2}>
                  {payerData.map(d => (
                    <Cell key={d.type} fill={PAYER_COLORS[d.type]||"#9CA3AF"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TT_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 mt-1">
              {payerData.map(d => (
                <div key={d.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PAYER_COLORS[d.type] }} />
                    <span className="text-xs text-[#3D4E5C] font-medium">{d.type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-[#6B7D8E]">{d.count}</span>
                    <span className="font-semibold" style={{ color: SCORE_COLORS[Math.round(d.avgScore/25)*25]||"#6B7D8E" }}>
                      avg {d.avgScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Row 2: Brand comparison + Restriction coverage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

          <Card className="p-6 fade-up-3">
            <Divider label="Brand vs Avg Access Score" />
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={brandData} layout="vertical" barCategoryGap="35%">
                <CartesianGrid strokeDasharray="4 4" stroke="#F0F2F5" horizontal={false} />
                <XAxis type="number" domain={[0,100]}
                  tick={{ fill:"#6B7D8E", fontSize:11, fontFamily:"IBM Plex Mono" }}
                  axisLine={{ stroke:"#E2E6EC" }} tickLine={false} />
                <YAxis type="category" dataKey="brand"
                  tick={{ fill:"#0F1923", fontSize:13, fontFamily:"var(--display)", fontWeight:600 }}
                  axisLine={false} tickLine={false} width={85} />
                <Tooltip contentStyle={TT_STYLE}
                  formatter={(v:number) => [`${v} / 100`, "Avg Access Score"]} />
                <Bar dataKey="avgScore" radius={[0,4,4,0]}
                  label={{ position:"right", fill:"#6B7D8E", fontSize:11, fontFamily:"IBM Plex Mono",
                    formatter:(v:number) => `${v}` }}>
                  {brandData.map(d => (
                    <Cell key={d.brand} fill={SCORE_COLORS[Math.round(d.avgScore/25)*25]||"#6B7D8E"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {brandData.map(d => (
                <div key={d.brand} className="bg-[#F8F9FA] rounded-lg p-3 border border-[#E2E6EC]">
                  <div className="font-bold text-sm text-[#0F1923]">{d.brand}</div>
                  <div className="text-xs text-[#6B7D8E] mt-0.5">
                    {d.count} submissions ·{" "}
                    <span className="font-semibold" style={{ color: SCORE_COLORS[Math.round(d.avgScore/25)*25] }}>
                      avg {d.avgScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 fade-up-4">
            <Divider label="Restriction Parameter Coverage" />
            <p className="text-[11px] text-[#6B7D8E] mb-4">
              % of submissions where restriction applies · higher = more restrictive
            </p>
            <div className="space-y-3.5">
              {paramStats.map(p => (
                <div key={p.param}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-[#3D4E5C]">{p.param}</span>
                    <span className="text-xs font-mono font-semibold text-[#0F1923]">{p.pct}%</span>
                  </div>
                  <div className="h-2 bg-[#F0F2F5] rounded-full overflow-hidden border border-[#E2E6EC]">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${p.pct}%`,
                        background: p.pct>65?"#C0180C":p.pct>35?"#B45309":"#0A7A45"
                      }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Step therapy matrix */}
        <Card className="p-6 mb-5 fade-up">
          <Divider label="Step Therapy Burden Matrix" />
          <p className="text-[11px] text-[#6B7D8E] mb-4">Combination of branded + generic step requirements across all submissions</p>
          <div className="flex flex-wrap gap-3">
            {stepMatrix.map(item => (
              <div key={item.key}
                className="bg-[#F8F9FA] border border-[#E2E6EC] rounded-lg px-5 py-3.5 text-center min-w-[110px] hover:border-[#0066CC] hover:bg-[#EEF5FF] transition-colors cursor-default">
                <div className="text-2xl font-bold text-[#0F1923]">{item.count}</div>
                <div className="text-[11px] font-mono text-[#6B7D8E] mt-0.5">{item.key}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Submissions table */}
        <Card className="overflow-hidden fade-up">
          <div className="px-6 py-4 border-b border-[#E2E6EC] flex flex-wrap items-center justify-between gap-3">
            <div>
              <Divider label="Submissions" />
              <p className="text-[11px] text-[#6B7D8E] -mt-3">
                {filtered.length} records · click any row to inspect
              </p>
            </div>
            <div className="flex gap-2">
              {[["brand", filterBrand, setFilterBrand, ["All",...brands]],
                ["payer",  filterPayer, setFilterPayer, ["All",...payers]]].map(([name, val, setter, opts]) => (
                <select key={String(name)} value={String(val)}
                  onChange={e => (setter as (v:string)=>void)(e.target.value)}
                  className="bg-white border border-[#E2E6EC] rounded-lg px-3 py-1.5 text-xs font-medium text-[#3D4E5C] outline-none focus:border-[#0066CC] transition-colors shadow-sm">
                  {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                </select>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#E2E6EC]">
                  {["File","Brand","Payer Type","Age","B Steps","G Steps","Photo","TB","Specialist","Init Auth","Reauth","Score"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[1.5px] uppercase text-[#6B7D8E] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const isSelected = selectedRow?.filename===row.filename && selectedRow?.brand===row.brand;
                  return (
                    <tr key={i} onClick={() => setSelectedRow(isSelected?null:row)}
                      className={`border-b border-[#F0F2F5] cursor-pointer transition-colors ${
                        isSelected ? "bg-[#EEF5FF] border-l-2 border-l-[#0066CC]"
                        : i%2===0 ? "bg-white hover:bg-[#F8F9FA]"
                        : "bg-[#FAFBFC] hover:bg-[#F8F9FA]"
                      }`}>
                      <td className="px-4 py-3 font-mono text-[10px] text-[#6B7D8E] max-w-[130px] truncate">{row.filename}</td>
                      <td className="px-4 py-3 font-semibold text-[#0F1923]">{row.brand}</td>
                      <td className="px-4 py-3">
                        <span className={`payer-${row.payerType.toLowerCase().replace(" ","").replace("state","")}`}
                          style={{ padding:"1px 8px", borderRadius:4, fontSize:10, fontWeight:600, whiteSpace:"nowrap" }}>
                          {row.payerType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#3D4E5C]">{row.age}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-mono text-[11px] font-semibold ${row.brandedSteps!=="NA"&&row.brandedSteps?"text-[#B45309]":"text-[#9AAAB8]"}`}>
                          {row.brandedSteps||"NA"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-mono text-[11px] font-semibold ${row.genericSteps!=="NA"&&row.genericSteps?"text-[#92630A]":"text-[#9AAAB8]"}`}>
                          {row.genericSteps||"NA"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-medium ${row.phototherapy==="Yes"?"text-[#C0180C]":"text-[#9AAAB8]"}`}>{row.phototherapy}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-medium ${row.tbTest==="Yes"?"text-[#B45309]":"text-[#9AAAB8]"}`}>{row.tbTest}</span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#3D4E5C] max-w-[120px] truncate">{row.specialistTypes}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#3D4E5C]">{row.initAuthDuration}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-medium ${row.reauthRequired==="Yes"?"text-[#0066CC]":"text-[#9AAAB8]"}`}>{row.reauthRequired}</span>
                      </td>
                      <td className="px-4 py-3"><ScorePill score={row.accessScore} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Detail panel */}
        {selectedRow && (
          <div className="fixed right-0 top-14 bottom-0 w-[380px] bg-white border-l border-[#E2E6EC] overflow-y-auto z-40 shadow-xl fade-up">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#E2E6EC] flex items-start justify-between bg-white sticky top-0 z-10">
              <div>
                <p className="text-[10px] font-mono text-[#6B7D8E] mb-0.5">{selectedRow.filename}</p>
                <p className="text-base font-bold text-[#0F1923]">{selectedRow.brand}</p>
                <p className="text-xs text-[#6B7D8E]">{selectedRow.payer} · {selectedRow.payerType}</p>
              </div>
              <button onClick={()=>setSelectedRow(null)}
                className="text-[#9AAAB8] hover:text-[#0F1923] text-xl w-7 h-7 flex items-center justify-center rounded hover:bg-[#F0F2F5] transition-colors">
                ✕
              </button>
            </div>

            {/* Score banner */}
            <div className="px-6 py-6 text-center border-b border-[#E2E6EC]"
              style={{ background: SCORE_BG[selectedRow.accessScore] }}>
              <p className="text-[10px] font-semibold tracking-[2px] uppercase mb-1" style={{ color: SCORE_COLORS[selectedRow.accessScore] }}>
                Access Score
              </p>
              <p className="text-5xl font-bold mb-1" style={{ color: SCORE_COLORS[selectedRow.accessScore] }}>
                {selectedRow.accessScore}
              </p>
              <p className="text-sm font-medium" style={{ color: SCORE_COLORS[selectedRow.accessScore] }}>
                {scoreLabel(selectedRow.accessScore)}
              </p>
            </div>

            {/* Parameters */}
            <div className="px-6 py-5">
              <p className="text-[10px] font-semibold tracking-[2px] uppercase text-[#6B7D8E] mb-3">Parameters</p>
              <div className="space-y-3">
                {[
                  ["Age",              selectedRow.age],
                  ["Branded Steps",    selectedRow.brandedSteps],
                  ["Generic Steps",    selectedRow.genericSteps],
                  ["Phototherapy",     selectedRow.phototherapy],
                  ["TB Test",          selectedRow.tbTest],
                  ["Quantity Limits",  selectedRow.quantityLimits],
                  ["Specialist",       selectedRow.specialistTypes],
                  ["Initial Auth",     selectedRow.initAuthDuration],
                  ["Reauth Duration",  selectedRow.reauthDuration],
                  ["Reauth Required",  selectedRow.reauthRequired],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-[#F0F2F5] last:border-0">
                    <span className="text-xs text-[#6B7D8E]">{label}</span>
                    <span className={`text-xs font-semibold font-mono ${value==="NA"||!value?"text-[#9AAAB8]":"text-[#0F1923]"}`}>
                      {value||"NA"}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] font-semibold tracking-[2px] uppercase text-[#6B7D8E] mt-5 mb-2">Step Therapy</p>
              <p className="text-xs text-[#3D4E5C] leading-relaxed bg-[#F8F9FA] rounded-lg p-3 border border-[#E2E6EC]">
                {selectedRow.stepTherapy}
              </p>

              <p className="text-[10px] font-semibold tracking-[2px] uppercase text-[#6B7D8E] mt-4 mb-2">Reauth Requirements</p>
              <p className="text-xs text-[#3D4E5C] leading-relaxed bg-[#F8F9FA] rounded-lg p-3 border border-[#E2E6EC]">
                {selectedRow.reauthRequirements}
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
