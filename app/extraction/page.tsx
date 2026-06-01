"use client";
import Nav from "@/components/Nav";
import { useState, useRef, useCallback, useEffect } from "react";
import { extractFromBackend, downloadCSV, type ExtractedRow } from "@/lib/extraction";
import { SCORE_COLORS, SCORE_BG, scoreLabel } from "@/lib/data";

const BRANDS = ["TREMFYA","STELARA","SKYRIZI","COSENTYX","OTEZLA","HUMIRA","ENBREL","RINVOQ","TALTZ","ILUMYA","BIMZELX","SPEVIGO","CIMZIA","SYMPONI","SIMPONI"];
const DEFAULT_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://pa-intel-api.onrender.com";

type UpFile = { file:File; id:string; brand:string; status:"pending"|"uploading"|"done"|"error"; result?:ExtractedRow; error?:string; };

function ScorePill({ score }: { score: number|string }) {
  const n = Number(score);
  const color = SCORE_COLORS[n]||"#6B7D8E";
  const bg    = SCORE_BG[n]||"#F8F9FA";
  return (
    <span style={{ background:bg, color, border:`1px solid ${color}40`, borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:700, fontFamily:"IBM Plex Mono" }}>
      {n}
    </span>
  );
}

function Field({ label, value }: { label:string; value:string }) {
  const [exp, setExp] = useState(false);
  const isNA = !value || value==="NA" || value==="N/A";
  const isLong = value && value.length > 100;
  return (
    <div className="py-2 border-b border-[#F0F2F5] last:border-0">
      <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-[#6B7D8E] mb-0.5">{label}</div>
      {isNA ? (
        <span className="text-xs font-mono text-[#9AAAB8]">NA</span>
      ) : isLong ? (
        <div>
          <span className="text-xs text-[#3D4E5C] leading-relaxed">{exp ? value : value.slice(0,100)+"…"}</span>
          <button onClick={()=>setExp(!exp)} className="text-[#0066CC] text-[10px] ml-1 hover:underline font-medium">
            {exp?"less":"more"}
          </button>
        </div>
      ) : (
        <span className="text-xs font-mono text-[#0F1923] font-medium">{value}</span>
      )}
    </div>
  );
}

function StatusBadge({ status, error }: { status: UpFile["status"]; error?: string }) {
  if (status==="pending")   return <span className="text-[11px] font-medium text-[#9AAAB8]">Pending</span>;
  if (status==="uploading") return <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#0066CC]"><span className="w-1.5 h-1.5 rounded-full bg-[#0066CC] pulse-dot"/>Processing…</span>;
  if (status==="done")      return <span className="text-[11px] font-medium text-[#0A7A45]">✓ Done</span>;
  return <span className="text-[11px] font-medium text-[#C0180C]" title={error}>✗ Error</span>;
}

export default function ExtractionPage() {
  const [files, setFiles]             = useState<UpFile[]>([]);
  const [backendUrl, setBackendUrl]   = useState(DEFAULT_URL);
  const [dragging, setDragging]       = useState(false);
  const [results, setResults]         = useState<ExtractedRow[]>([]);
  const [tab, setTab]                 = useState<"upload"|"results">("upload");
  const [connStatus, setConnStatus]   = useState<"unknown"|"ok"|"error">("unknown");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const s = localStorage.getItem("pa_backend_url"); if (s) setBackendUrl(s); }, []);

  const ping = useCallback(async () => {
    try {
      const r = await fetch(`${backendUrl.replace(/\/$/,"")}/health`, { signal: AbortSignal.timeout(8000) });
      setConnStatus(r.ok ? "ok" : "error");
    } catch { setConnStatus("error"); }
  }, [backendUrl]);

  useEffect(() => { ping(); }, [ping]);

  const saveUrl = (u: string) => { setBackendUrl(u); localStorage.setItem("pa_backend_url", u); };

  const addFiles = useCallback((newFiles: File[]) => {
    const pdfs = newFiles.filter(f => f.name.toLowerCase().endsWith(".pdf"));
    setFiles(prev => [...prev, ...pdfs.map(f => ({ file:f, id:crypto.randomUUID(), brand:"TREMFYA", status:"pending" as const }))]);
  }, []);

  const run = async () => {
    for (const uf of files.filter(f=>f.status==="pending")) {
      setFiles(prev => prev.map(f => f.id===uf.id ? {...f,status:"uploading"} : f));
      try {
        const result = await extractFromBackend(uf.file, uf.brand, backendUrl);
        setFiles(prev => prev.map(f => f.id===uf.id ? {...f,status:"done",result} : f));
        setResults(prev => [...prev.filter(r=>!(r.Filename===result.Filename&&r.Brand===result.Brand)), result]);
      } catch(e) {
        const msg = e instanceof Error ? e.message : String(e);
        setFiles(prev => prev.map(f => f.id===uf.id ? {...f,status:"error",error:msg} : f));
      }
    }
    setTab("results");
  };

  const doneCount  = files.filter(f=>f.status==="done").length;
  const hasResults = results.length > 0;

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <Nav />
      <main className="pt-20 pb-16 px-6 max-w-[1440px] mx-auto">

        {/* Header */}
        <div className="mb-8 fade-up">
          <p className="text-[10px] font-semibold tracking-[3px] uppercase text-[#0066CC] mb-1.5">Extraction Engine</p>
          <h1 className="text-2xl font-bold text-[#0F1923] mb-1">PA Parameter Extraction</h1>
          <p className="text-sm text-[#6B7D8E]">
            Upload PA policy PDFs · Full pipeline: parse → chunk → BM25 retrieve → LLM extract → normalize → score
          </p>
        </div>

        {/* Backend config */}
        <div className="bg-white rounded-xl border border-[#E2E6EC] shadow-sm p-5 mb-6 fade-up">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-[#0066CC]" />
              <span className="text-xs font-semibold tracking-[2px] uppercase text-[#3D4E5C]">Backend API</span>
            </div>
            <div className="flex items-center gap-2">
              {connStatus==="ok"      && <><div className="w-2 h-2 rounded-full bg-[#0A7A45] pulse-dot"/><span className="text-[11px] font-medium text-[#0A7A45]">Connected</span></>}
              {connStatus==="error"   && <><div className="w-2 h-2 rounded-full bg-[#C0180C]"/><span className="text-[11px] font-medium text-[#C0180C]">Unreachable</span></>}
              {connStatus==="unknown" && <><div className="w-2 h-2 rounded-full bg-[#9AAAB8] pulse-dot"/><span className="text-[11px] text-[#9AAAB8]">Checking…</span></>}
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <input type="text" value={backendUrl} onChange={e=>saveUrl(e.target.value)}
              placeholder="https://pa-intel-api.onrender.com"
              className="flex-1 min-w-[260px] bg-[#F8F9FA] border border-[#E2E6EC] rounded-lg px-4 py-2.5 text-xs font-mono text-[#0F1923] placeholder-[#9AAAB8] outline-none focus:border-[#0066CC] transition-colors" />
            <button onClick={ping}
              className="px-4 py-2.5 bg-white border border-[#E2E6EC] text-xs font-medium text-[#3D4E5C] rounded-lg hover:border-[#0066CC] hover:text-[#0066CC] transition-colors shadow-sm">
              Test Connection
            </button>
          </div>
          {connStatus==="error" && (
            <p className="text-[11px] text-[#B45309] mt-2 bg-[#FEF4E6] rounded-lg px-3 py-2 border border-[#FDD9A0]">
              ⚠ Backend unreachable. If using Render.com free tier, the service may be sleeping — wait 30 s and retry.
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white rounded-lg border border-[#E2E6EC] p-1 w-fit shadow-sm">
          {([["upload","Upload & Configure"],["results",`Results${hasResults?` (${results.length})`:""}`]] as [string,string][]).map(([t,lbl])=>(
            <button key={t} onClick={()=>setTab(t as "upload"|"results")}
              className={`px-5 py-1.5 rounded text-xs font-medium transition-all ${
                tab===t ? "bg-[#0066CC] text-white shadow-sm" : "text-[#6B7D8E] hover:text-[#0F1923]"
              }`}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Upload tab */}
        {tab==="upload" && (
          <div className="fade-up">
            <div onDragOver={e=>{e.preventDefault();setDragging(true);}}
              onDragLeave={()=>setDragging(false)}
              onDrop={e=>{e.preventDefault();setDragging(false);addFiles(Array.from(e.dataTransfer.files));}}
              onClick={()=>fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition-all mb-5 ${
                dragging ? "border-[#0066CC] bg-[#EEF5FF]" : "border-[#D1D9E0] bg-white hover:border-[#0066CC] hover:bg-[#EEF5FF]"
              }`}>
              <input ref={fileRef} type="file" accept=".pdf" multiple className="hidden"
                onChange={e=>addFiles(Array.from(e.target.files||[]))} />
              <div className="text-5xl mb-3">{dragging?"📂":"📄"}</div>
              <p className="font-semibold text-sm text-[#0F1923] mb-1">Drop PDF files here or click to browse</p>
              <p className="text-xs text-[#9AAAB8]">Multiple files supported · Prior Authorization policy documents</p>
            </div>

            {files.length > 0 && (
              <div className="bg-white rounded-xl border border-[#E2E6EC] shadow-sm overflow-hidden mb-5">
                <div className="px-5 py-3 border-b border-[#E2E6EC] bg-[#F8F9FA] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#3D4E5C]">
                    {files.length} file{files.length>1?"s":""} &nbsp;·&nbsp; {doneCount} completed
                  </span>
                  <button onClick={()=>setFiles([])} className="text-[11px] text-[#9AAAB8] hover:text-[#C0180C] font-medium transition-colors">
                    Remove all
                  </button>
                </div>
                <div className="divide-y divide-[#F0F2F5]">
                  {files.map(f=>(
                    <div key={f.id} className="px-5 py-3 flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-[180px]">
                        <div className="text-xs font-medium text-[#0F1923] truncate">{f.file.name}</div>
                        <div className="text-[10px] text-[#9AAAB8] mt-0.5 font-mono">{(f.file.size/1024).toFixed(0)} KB</div>
                      </div>
                      <select value={f.brand}
                        onChange={e=>setFiles(prev=>prev.map(p=>p.id===f.id?{...p,brand:e.target.value}:p))}
                        disabled={f.status!=="pending"}
                        className="bg-[#F8F9FA] border border-[#E2E6EC] rounded-lg px-3 py-1.5 text-[11px] font-medium text-[#3D4E5C] outline-none focus:border-[#0066CC]">
                        {BRANDS.map(b=><option key={b}>{b}</option>)}
                      </select>
                      <div className="w-28 text-right"><StatusBadge status={f.status} error={f.error}/></div>
                      {f.status==="error"&&f.error&&<p className="w-full text-[10px] text-[#C0180C] bg-[#FEF0EF] rounded px-2 py-1">{f.error}</p>}
                      <button onClick={()=>setFiles(prev=>prev.filter(p=>p.id!==f.id))}
                        className="text-[#9AAAB8] hover:text-[#C0180C] text-sm transition-colors">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={run}
                disabled={files.filter(f=>f.status==="pending").length===0||connStatus!=="ok"}
                className="px-8 py-3 bg-[#0066CC] text-white rounded-xl text-sm font-semibold hover:bg-[#0055AA] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                ▶ Run Extraction ({files.filter(f=>f.status==="pending").length} pending)
              </button>
              {hasResults && (
                <button onClick={()=>downloadCSV(results)}
                  className="px-6 py-3 bg-white border border-[#E2E6EC] text-[#0066CC] rounded-xl text-sm font-medium hover:border-[#0066CC] hover:bg-[#EEF5FF] transition-colors shadow-sm">
                  ↓ Export CSV
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results tab */}
        {tab==="results" && (
          <div className="fade-up">
            {!hasResults ? (
              <div className="bg-white rounded-xl border border-[#E2E6EC] p-20 text-center shadow-sm">
                <p className="text-[#9AAAB8] text-sm font-medium">No results yet — upload and extract PDFs first.</p>
              </div>
            ) : (
              <>
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                  {[
                    ["Extracted",results.length,"#0066CC"],
                    ["Avg Score",Math.round(results.reduce((s,r)=>s+Number(r["Access Score"]),0)/results.length),"#008C7E"],
                    ["Has Steps",results.filter(r=>r["Number of Steps through Brands"]!=="NA"||r["Number of Steps through Generic"]!=="NA").length,"#B45309"],
                    ["TB Required",results.filter(r=>r["TB Test required"]==="Y").length,"#0A7A45"],
                  ].map(([label,value,color])=>(
                    <div key={String(label)} className="bg-white rounded-xl border border-[#E2E6EC] shadow-sm p-5">
                      <div className="text-[10px] font-semibold tracking-[2px] uppercase text-[#6B7D8E] mb-2">{label}</div>
                      <div className="text-3xl font-bold" style={{color:String(color)}}>{value}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mb-4">
                  <button onClick={()=>downloadCSV(results)}
                    className="px-5 py-2.5 bg-white border border-[#E2E6EC] text-[#0066CC] rounded-lg text-xs font-medium hover:border-[#0066CC] hover:bg-[#EEF5FF] transition-colors shadow-sm">
                    ↓ Download CSV
                  </button>
                </div>

                {results.map((row,i)=>(
                  <div key={i} className="bg-white rounded-xl border border-[#E2E6EC] shadow-sm overflow-hidden mb-4">
                    <div className="px-6 py-4 border-b border-[#E2E6EC] bg-[#F8F9FA] flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-[10px] font-mono text-[#9AAAB8] mb-0.5">{row.Filename}</p>
                        <p className="text-base font-bold text-[#0F1923]">{row.Brand}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-semibold tracking-[2px] uppercase text-[#6B7D8E] mb-1">Access Score</p>
                        <ScorePill score={row["Access Score"]} />
                        <p className="text-[10px] font-medium mt-1" style={{ color: SCORE_COLORS[Number(row["Access Score"])] }}>
                          {scoreLabel(Number(row["Access Score"]))}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#F0F2F5]">
                      <div className="p-5">
                        <p className="text-[10px] font-semibold tracking-[2px] uppercase text-[#6B7D8E] mb-3">Key Parameters</p>
                        {["Age","Step through-Phototherapy","TB Test required","Specialist Types",
                          "Initial Authorization Duration(in-months)","Reauthorization Duration(in-months)","Reauthorization Required"
                        ].map(p=>(
                          <Field key={p} label={p.replace(/\(in-months\)/,"").slice(0,28)} value={String((row as Record<string,string|number>)[p]??"NA")} />
                        ))}
                      </div>
                      <div className="p-5">
                        <p className="text-[10px] font-semibold tracking-[2px] uppercase text-[#6B7D8E] mb-3">Step Counts & Limits</p>
                        {["Number of Steps through Brands","Number of Steps through Generic","Quantity Limits"].map(p=>(
                          <Field key={p} label={p.slice(0,30)} value={String((row as Record<string,string|number>)[p]??"NA")} />
                        ))}
                        <p className="text-[10px] font-semibold tracking-[2px] uppercase text-[#6B7D8E] mt-4 mb-2">Reauth Requirements</p>
                        <Field label="" value={String(row["Reauthorization Requirements Documented in Policy"]??"NA")} />
                      </div>
                      <div className="p-5">
                        <p className="text-[10px] font-semibold tracking-[2px] uppercase text-[#6B7D8E] mb-3">Step Therapy Requirements</p>
                        <Field label="" value={String(row["Step Therapy Requirements Documented in Policy"]??"NA")} />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
