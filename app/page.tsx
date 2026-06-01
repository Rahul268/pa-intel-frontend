"use client";
import Nav from "@/components/Nav";
import {
  submissions, getScoreDistribution, getBrandBreakdown,
  getPayerTypeBreakdown, getParameterStats, getStepTherapyMatrix,
  scoreLabel, SCORE_COLORS, SCORE_BG, SCORE_BORDER, PAYER_COLORS, type Submission,
} from "@/lib/data";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  PieChart, Pie,
} from "recharts";
import { useState } from "react";

/* ── Primitives ─────────────────────────────────────────────────────────── */
const TT = { backgroundColor:"#fff", border:"1px solid #E2E6EC", borderRadius:8, fontSize:12, color:"#1B2A4A", boxShadow:"0 4px 12px rgba(27,42,74,.10)" };

function SectionHdr({ label, color="#0066CC" }: { label: string; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-[3px] h-[18px] rounded-full flex-shrink-0" style={{ background: color }} />
      <h3 className="text-[10.5px] font-bold tracking-[2px] uppercase text-[#374151]">{label}</h3>
      <div className="flex-1 h-px bg-[#E2E6EC]" />
    </div>
  );
}
function Card({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border-[1.5px] border-[#E2E6EC] shadow-[0_2px_8px_rgba(27,42,74,0.07)] ${className}`}>{children}</div>;
}
function ScorePill({ score }: { score: number }) {
  return (
    <span className={`score-${score} rounded px-2 py-0.5 text-[11px] font-bold font-mono`}>{score}</span>
  );
}
function BarLbl({ x, y, width, value }: { x?:number; y?:number; width?:number; value?:number }) {
  return value ? <text x={(x??0)+(width??0)/2} y={(y??0)-5} fill="#6B7280" fontSize={11} fontFamily="IBM Plex Mono,monospace" textAnchor="middle">{value}</text> : null;
}

export default function Dashboard() {
  const [sel, setSel] = useState<Submission|null>(null);
  const [fBrand, setFBrand] = useState("All");
  const [fPayer, setFPayer] = useState("All");

  const scoreDist = getScoreDistribution();
  const brandData = getBrandBreakdown();
  const payerData = getPayerTypeBreakdown();
  const params    = getParameterStats();
  const matrix    = getStepTherapyMatrix();
  const avgScore  = Math.round(submissions.reduce((s,r)=>s+r.accessScore,0)/submissions.length);
  const brands    = Array.from(new Set(submissions.map(s=>s.brand))).sort();
  const payers    = Array.from(new Set(submissions.map(s=>s.payerType)));
  const filtered  = submissions.filter(s=>(fBrand==="All"||s.brand===fBrand)&&(fPayer==="All"||s.payerType===fPayer));

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <Nav />
      <main className="pt-[68px] pb-16 px-8 max-w-[1440px] mx-auto">

        {/* Page header */}
        <div className="py-6 mb-2 fade-up">
          <p className="text-[10px] font-bold tracking-[3px] uppercase text-[#0066CC] mb-1">Analytics Dashboard</p>
          <h1 className="text-[22px] font-bold text-[#1B2A4A] tracking-tight mb-1">Access Score Intelligence</h1>
          <p className="text-[13px] text-[#6B7280]">Prior authorization policy analysis · {submissions.length} submissions · {brands.length} brands</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label:"Total Submissions", value:submissions.length, sub:"policies analyzed", color:"#0066CC" },
            { label:"Average Access Score", value:avgScore, sub:scoreLabel(avgScore), color:SCORE_COLORS[Math.round(avgScore/25)*25] },
            { label:"Brands Covered", value:brands.length, sub:`${brands.slice(0,3).join(" · ")} +${brands.length-3}`, color:"#7C3AED" },
            { label:"Open Access (100)", value:submissions.filter(s=>s.accessScore===100).length, sub:"fully unrestricted", color:"#008C7E" },
          ].map((k,i) => (
            <Card key={i} className={`p-5 fade-up-${i+1}`} style={{ borderTop:`3px solid ${k.color}` } as React.CSSProperties}>
              <p className="text-[10px] font-bold tracking-[2px] uppercase text-[#6B7280] mb-2">{k.label}</p>
              <p className="text-[28px] font-bold leading-none mb-1.5 font-mono" style={{ color:k.color }}>{k.value}</p>
              <p className="text-[11px] text-[#9CA3AF]">{k.sub}</p>
            </Card>
          ))}
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="col-span-2 p-5 fade-up-1">
            <SectionHdr label="Access Score Distribution" />
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={scoreDist} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="4 4" stroke="#F3F4F6" vertical={false}/>
                <XAxis dataKey="score" tick={{fill:"#6B7280",fontSize:11,fontFamily:"IBM Plex Mono"}} axisLine={{stroke:"#E2E6EC"}} tickLine={false}/>
                <YAxis tick={{fill:"#6B7280",fontSize:11,fontFamily:"IBM Plex Mono"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TT} formatter={(v:number)=>[v,"Policies"]} labelFormatter={(l:number)=>`Score ${l} — ${scoreLabel(l)}`}/>
                <Bar dataKey="count" radius={[4,4,0,0]} label={<BarLbl/>}>{scoreDist.map(d=><Cell key={d.score} fill={SCORE_COLORS[d.score]}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 mt-1">
              {scoreDist.filter(d=>d.count>0).map(d=>(
                <div key={d.score} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{background:SCORE_COLORS[d.score]}}/>
                  <span className="text-[11px] text-[#6B7280]">{d.score} — {d.label} ({d.count})</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 fade-up-2">
            <SectionHdr label="Payer Type Mix" color="#7C3AED" />
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={payerData} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2}>
                  {payerData.map(d=><Cell key={d.type} fill={PAYER_COLORS[d.type]||"#9CA3AF"}/>)}
                </Pie>
                <Tooltip contentStyle={TT}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-1">
              {payerData.map(d=>(
                <div key={d.type} className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6] last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{background:PAYER_COLORS[d.type]}}/>
                    <span className="text-[12px] font-medium text-[#374151]">{d.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-[#6B7280]">{d.count}</span>
                    <span className="text-[11px] font-mono font-bold" style={{color:SCORE_COLORS[Math.round(d.avgScore/25)*25]||"#6B7280"}}>avg {d.avgScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card className="p-5 fade-up-3">
            <SectionHdr label="Brand · Avg Access Score" color="#7C3AED" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={brandData.slice(0,8)} layout="vertical" barCategoryGap="30%">
                <CartesianGrid strokeDasharray="4 4" stroke="#F3F4F6" horizontal={false}/>
                <XAxis type="number" domain={[0,100]} tick={{fill:"#6B7280",fontSize:11,fontFamily:"IBM Plex Mono"}} axisLine={{stroke:"#E2E6EC"}} tickLine={false}/>
                <YAxis type="category" dataKey="brand" tick={{fill:"#374151",fontSize:12,fontWeight:600}} axisLine={false} tickLine={false} width={90}/>
                <Tooltip contentStyle={TT} formatter={(v:number)=>[`${v}/100`,"Avg Score"]}/>
                <Bar dataKey="avgScore" radius={[0,4,4,0]} label={{position:"right",fill:"#6B7280",fontSize:11,fontFamily:"IBM Plex Mono",formatter:(v:number)=>`${v}`}}>
                  {brandData.slice(0,8).map(d=><Cell key={d.brand} fill={SCORE_COLORS[Math.round(d.avgScore/25)*25]||"#6B7280"}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5 fade-up-4">
            <SectionHdr label="Restriction Parameter Coverage" color="#C0180C" />
            <p className="text-[11px] text-[#6B7280] mb-4">% of {submissions.length} submissions where restriction applies</p>
            <div className="space-y-3">
              {params.map(p=>(
                <div key={p.param}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[12px] font-medium text-[#374151]">{p.param}</span>
                    <span className="text-[11px] font-mono font-bold text-[#1B2A4A]">{p.pct}%</span>
                  </div>
                  <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden border border-[#E2E6EC]">
                    <div className="h-full rounded-full" style={{
                      width:`${p.pct}%`,
                      background:p.pct>70?"#C0180C":p.pct>40?"#B45309":"#0A7A45"
                    }}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Step Matrix */}
        <Card className="p-5 mb-4 fade-up">
          <SectionHdr label="Step Therapy Burden Matrix" />
          <p className="text-[11px] text-[#6B7280] mb-3">Branded + Generic step combinations across all {submissions.length} submissions</p>
          <div className="flex flex-wrap gap-3">
            {matrix.map(m=>(
              <div key={m.key} className="bg-[#F8F9FB] border-[1.5px] border-[#E2E6EC] rounded-lg px-5 py-3 text-center min-w-[110px] hover:border-[#0066CC] hover:bg-[#EEF5FF] transition-colors">
                <div className="text-[24px] font-bold text-[#1B2A4A]">{m.count}</div>
                <div className="text-[10px] font-mono text-[#6B7280] mt-0.5">{m.key}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Submissions Table */}
        <Card className="overflow-hidden fade-up">
          <div className="px-6 py-4 bg-[#F8F9FB] border-b-[1.5px] border-[#E2E6EC] flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[10.5px] font-bold tracking-[2px] uppercase text-[#374151]">Submissions</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">{filtered.length} records · click any row to inspect</p>
            </div>
            <div className="flex gap-2">
              {[[fBrand,setFBrand,["All",...brands]],[fPayer,setFPayer,["All",...payers]]].map(([val,setter,opts],i)=>(
                <select key={i} value={String(val)} onChange={e=>(setter as (v:string)=>void)(e.target.value)}
                  className="bg-white border-[1.5px] border-[#E2E6EC] rounded-lg px-3 py-1.5 text-[11.5px] font-medium text-[#374151] outline-none focus:border-[#0066CC] shadow-sm">
                  {(opts as string[]).map(o=><option key={o}>{o}</option>)}
                </select>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#F8F9FB] border-b-[1.5px] border-[#E2E6EC]">
                  {["File","Brand","Payer","Age","B Steps","G Steps","Photo","TB","Specialist","Init Auth","Reauth","Score"].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold tracking-[1.5px] uppercase text-[#6B7280] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row,i)=>{
                  const isSel = sel?.filename===row.filename&&sel?.brand===row.brand;
                  return (
                    <tr key={i} onClick={()=>setSel(isSel?null:row)}
                      className={`border-b border-[#F3F4F6] cursor-pointer transition-colors ${
                        isSel?"bg-[#EEF5FF] border-l-[3px] border-l-[#0066CC]"
                        :i%2===0?"bg-white hover:bg-[#F8F9FB]"
                        :"bg-[#FAFBFC] hover:bg-[#F8F9FB]"
                      }`}>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-[#6B7280] max-w-[130px] truncate">{row.filename}</td>
                      <td className="px-4 py-2.5 font-bold text-[#1B2A4A]">{row.brand}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
                          style={{background:`${PAYER_COLORS[row.payerType]}18`,color:PAYER_COLORS[row.payerType],border:`1px solid ${PAYER_COLORS[row.payerType]}40`}}>
                          {row.payerType}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-[#374151]">{row.age}</td>
                      <td className="px-4 py-2.5 text-center"><span className={`font-mono text-[11px] font-semibold ${row.brandedSteps!=="NA"&&row.brandedSteps?"text-[#B45309]":"text-[#9CA3AF]"}`}>{row.brandedSteps||"NA"}</span></td>
                      <td className="px-4 py-2.5 text-center"><span className={`font-mono text-[11px] font-semibold ${row.genericSteps!=="NA"&&row.genericSteps?"text-[#92630A]":"text-[#9CA3AF]"}`}>{row.genericSteps||"NA"}</span></td>
                      <td className="px-4 py-2.5"><span className={`text-[11px] font-medium ${row.phototherapy==="Yes"?"text-[#C0180C]":"text-[#9CA3AF]"}`}>{row.phototherapy}</span></td>
                      <td className="px-4 py-2.5"><span className={`text-[11px] font-medium ${row.tbTest==="Yes"?"text-[#B45309]":"text-[#9CA3AF]"}`}>{row.tbTest}</span></td>
                      <td className="px-4 py-2.5 text-[11px] text-[#374151] max-w-[130px] truncate">{row.specialistTypes}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-[#374151]">{row.initAuthDuration}</td>
                      <td className="px-4 py-2.5"><span className={`text-[11px] font-semibold ${row.reauthRequired==="Yes"?"text-[#0066CC]":"text-[#9CA3AF]"}`}>{row.reauthRequired}</span></td>
                      <td className="px-4 py-2.5"><ScorePill score={row.accessScore}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Detail panel */}
        {sel && (
          <div className="fixed right-0 top-[52px] bottom-0 w-[380px] bg-white border-l-[1.5px] border-[#E2E6EC] overflow-y-auto z-40 shadow-2xl">
            <div className="px-6 py-5 border-b-[1.5px] border-[#E2E6EC] sticky top-0 bg-white z-10 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono text-[#9CA3AF] mb-0.5">{sel.filename}</p>
                <p className="text-[15px] font-bold text-[#1B2A4A]">{sel.brand}</p>
                <p className="text-[12px] text-[#6B7280]">{sel.payerType}</p>
              </div>
              <button onClick={()=>setSel(null)} className="text-[#9CA3AF] hover:text-[#1B2A4A] text-lg w-7 h-7 flex items-center justify-center rounded hover:bg-[#F4F5F7] transition-colors">✕</button>
            </div>
            <div className="px-6 py-5 text-center border-b-[1.5px] border-[#E2E6EC]" style={{background:SCORE_BG[sel.accessScore]}}>
              <p className="text-[10px] font-bold tracking-[2px] uppercase mb-1" style={{color:SCORE_COLORS[sel.accessScore]}}>Access Score</p>
              <p className="text-[48px] font-bold leading-none mb-1" style={{color:SCORE_COLORS[sel.accessScore]}}>{sel.accessScore}</p>
              <p className="text-[12px] font-semibold" style={{color:SCORE_COLORS[sel.accessScore]}}>{scoreLabel(sel.accessScore)}</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-[10px] font-bold tracking-[2px] uppercase text-[#6B7280] mb-3">Parameters</p>
              {[["Age",sel.age],["Branded Steps",sel.brandedSteps],["Generic Steps",sel.genericSteps],["Phototherapy",sel.phototherapy],["TB Test",sel.tbTest],["Quantity Limits",sel.quantityLimits],["Specialist",sel.specialistTypes],["Initial Auth",sel.initAuthDuration],["Reauth Duration",sel.reauthDuration],["Reauth Required",sel.reauthRequired]].map(([lbl,val])=>(
                <div key={lbl} className="flex justify-between items-center py-2 border-b border-[#F3F4F6] last:border-0">
                  <span className="text-[12px] text-[#6B7280]">{lbl}</span>
                  <span className={`text-[12px] font-semibold font-mono ${!val||val==="NA"?"text-[#9CA3AF]":"text-[#1B2A4A]"}`}>{val||"NA"}</span>
                </div>
              ))}
              {[["Step Therapy",sel.stepTherapy],["Reauth Requirements",sel.reauthRequirements]].map(([lbl,val])=>(
                <div key={lbl} className="mt-4">
                  <p className="text-[10px] font-bold tracking-[2px] uppercase text-[#6B7280] mb-2">{lbl}</p>
                  <p className="text-[12px] text-[#374151] leading-relaxed bg-[#F8F9FB] rounded-lg p-3 border-[1.5px] border-[#E2E6EC]">{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
