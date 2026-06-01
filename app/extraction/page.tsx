"use client";
import Nav from "@/components/Nav";
import { useState, useRef, useCallback, useEffect } from "react";
import { extractFromBackend, downloadCSV, type ExtractedRow } from "@/lib/extraction";
import { SCORE_COLORS, SCORE_BG, scoreLabel } from "@/lib/data";

const BRANDS = ["TREMFYA","STELARA","SKYRIZI","COSENTYX","OTEZLA","HUMIRA","ENBREL","RINVOQ","TALTZ","ILUMYA","BIMZELX","SPEVIGO","CIMZIA","SYMPONI","SIMPONI","AMJEVITA","YESINTEK","REMICADE","ACITRETIN","SILIQ"];
const DEFAULT_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://pa-intel-api.onrender.com";

/* The 15 columns shown in the results table — matches your Excel exactly */
const TABLE_COLS: { key: keyof ExtractedRow | "Access Score"; label: string; width: string; mono?: boolean }[] = [
  { key:"Filename",                                              label:"File",          width:"w-[130px]", mono:true },
  { key:"Brand",                                                 label:"Brand",         width:"w-[90px]"  },
  { key:"Age",                                                   label:"Age",           width:"w-[60px]",  mono:true },
  { key:"Number of Steps through Brands",                        label:"B Steps",       width:"w-[72px]",  mono:true },
  { key:"Number of Steps through Generic",                       label:"G Steps",       width:"w-[72px]",  mono:true },
  { key:"Step through-Phototherapy",                             label:"Photo",         width:"w-[64px]"  },
  { key:"TB Test required",                                      label:"TB",            width:"w-[56px]"  },
  { key:"Quantity Limits",                                       label:"Qty Limits",    width:"w-[100px]" },
  { key:"Specialist Types",                                      label:"Specialist",    width:"w-[110px]" },
  { key:"Initial Authorization Duration(in-months)",             label:"Init Auth",     width:"w-[82px]",  mono:true },
  { key:"Reauthorization Duration(in-months)",                   label:"Reauth Dur",    width:"w-[82px]",  mono:true },
  { key:"Reauthorization Required",                              label:"Reauth Req",    width:"w-[82px]"  },
  { key:"Step Therapy Requirements Documented in Policy",        label:"Step Therapy",  width:"w-[200px]" },
  { key:"Reauthorization Requirements Documented in Policy",     label:"Reauth Req'ts", width:"w-[200px]" },
  { key:"Access Score",                                          label:"Score",         width:"w-[64px]"  },
];

type UpFile = { file:File; id:string; brand:string; status:"pending"|"uploading"|"done"|"error"; result?:ExtractedRow; error?:string; };

function ScorePill({ score }: { score: number|string }) {
  const n = Number(score);
  return <span className={`score-${n} rounded px-2 py-0.5 text-[11px] font-bold font-mono`}>{n}</span>;
}

function TruncCell({ value, maxLen=60 }: { value: string; maxLen?: number }) {
  const [exp, setExp] = useState(false);
  const isNA = !value || value === "NA" || value === "N/A";
  if (isNA) return <span className="text-[#9CA3AF] font-mono text-[10px]">NA</span>;
  if (value.length <= maxLen) return <span className="text-[#374151] text-[11px]">{value}</span>;
  return (
    <span>
      <span className="text-[#374151] text-[11px]">{exp ? value : value.slice(0, maxLen) + "…"}</span>
      <button onClick={e => { e.stopPropagation(); setExp(!exp); }}
        className="text-[#0066CC] text-[10px] ml-1 font-semibold hover:underline">
        {exp ? "less" : "more"}
      </button>
    </span>
  );
}

export default function ExtractionPage() {
  const [files, setFiles]           = useState<UpFile[]>([]);
  const [backendUrl, setBackendUrl] = useState(DEFAULT_URL);
  const [dragging, setDragging]     = useState(false);
  const [results, setResults]       = useState<ExtractedRow[]>([]);
  const [tab, setTab]               = useState<"upload"|"results">("upload");
  const [conn, setConn]             = useState<"unknown"|"ok"|"error">("unknown");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const s = localStorage.getItem("pa_backend_url"); if (s) setBackendUrl(s); }, []);

  const ping = useCallback(async () => {
    try {
      const r = await fetch(`${backendUrl.replace(/\/$/,"")}/health`, { signal: AbortSignal.timeout(8000) });
      setConn(r.ok ? "ok" : "error");
    } catch { setConn("error"); }
  }, [backendUrl]);

  useEffect(() => { ping(); }, [ping]);

  const saveUrl = (u:string) => { setBackendUrl(u); localStorage.setItem("pa_backend_url", u); };
  const addFiles = useCallback((newFiles: File[]) => {
    const pdfs = newFiles.filter(f => f.name.toLowerCase().endsWith(".pdf"));
    setFiles(prev => [...prev, ...pdfs.map(f => ({ file:f, id:crypto.randomUUID(), brand:"TREMFYA", status:"pending" as const }))]);
  }, []);

  const runExtraction = async () => {
    for (const uf of files.filter(f => f.status === "pending")) {
      setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status:"uploading" } : f));
      try {
        const result = await extractFromBackend(uf.file, uf.brand, backendUrl);
        setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status:"done", result } : f));
        setResults(prev => [...prev.filter(r => !(r.Filename===result.Filename&&r.Brand===result.Brand)), result]);
      } catch(e) {
        const msg = e instanceof Error ? e.message : String(e);
        setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status:"error", error:msg } : f));
      }
    }
    setTab("results");
  };

  const doneCount  = files.filter(f => f.status === "done").length;
  const hasResults = results.length > 0;

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <Nav />
      <main className="pt-[68px] pb-16 px-8 max-w-[1440px] mx-auto">

        {/* Header */}
        <div className="py-6 mb-2 fade-up">
          <p className="text-[10px] font-bold tracking-[3px] uppercase text-[#0066CC] mb-1">Extraction Engine</p>
          <h1 className="text-[22px] font-bold text-[#1B2A4A] tracking-tight mb-1">PA Parameter Extraction</h1>
          <p className="text-[13px] text-[#6B7280]">Upload PA policy PDFs · Full pipeline: parse → chunk → BM25 retrieve → LLM extract → normalize → score</p>
        </div>

        {/* Backend status bar */}
        <div className="bg-white border-[1.5px] border-[#E2E6EC] rounded-xl p-4 mb-5 fade-up shadow-[0_2px_8px_rgba(27,42,74,0.07)] flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${conn==="ok"?"bg-[#22C55E] pulse-dot":conn==="error"?"bg-[#C0180C]":"bg-[#F59E0B] pulse-dot"}`}/>
            <span className={`text-[11px] font-bold ${conn==="ok"?"text-[#0A7A45]":conn==="error"?"text-[#C0180C]":"text-[#B45309]"}`}>
              {conn==="ok"?"Connected":conn==="error"?"Unreachable":"Checking…"}
            </span>
          </div>
          <input type="text" value={backendUrl} onChange={e=>saveUrl(e.target.value)}
            className="flex-1 min-w-[220px] bg-[#F8F9FB] border-[1.5px] border-[#E2E6EC] rounded-lg px-3 py-2 text-[12px] font-mono text-[#1B2A4A] outline-none focus:border-[#0066CC] transition-colors"/>
          <button onClick={ping} className="px-4 py-2 bg-white border-[1.5px] border-[#E2E6EC] rounded-lg text-[12px] font-semibold text-[#374151] hover:border-[#0066CC] hover:text-[#0066CC] transition-colors flex-shrink-0">
            Test Connection
          </button>
          {conn === "error" && <p className="w-full text-[11px] text-[#B45309] bg-[#FEF4E6] border border-[#FDD9A0] rounded-lg px-3 py-2 mt-1">⚠ Backend unreachable. Render free tier sleeps after 15 min — wait ~30s and retry.</p>}
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex bg-white border-[1.5px] border-[#E2E6EC] rounded-lg p-1 shadow-sm">
            {(["upload","results"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                  tab===t ? "bg-[#0066CC] text-white shadow-sm" : "text-[#6B7280] hover:text-[#1B2A4A]"
                }`}>
                {t === "upload" ? "Upload & Configure" : `Results${hasResults ? ` (${results.length})` : ""}`}
              </button>
            ))}
          </div>
          {hasResults && tab === "results" && (
            <button onClick={() => downloadCSV(results)}
              className="px-5 py-2 bg-white border-[1.5px] border-[#0066CC] text-[#0066CC] rounded-lg text-[12px] font-semibold hover:bg-[#EEF5FF] transition-colors shadow-sm">
              ↓ Download CSV
            </button>
          )}
        </div>

        {/* ── UPLOAD TAB ─────────────────────────────────────────────────── */}
        {tab === "upload" && (
          <div className="fade-up">
            {/* Drop zone */}
            <div onDragOver={e=>{e.preventDefault();setDragging(true);}}
              onDragLeave={()=>setDragging(false)}
              onDrop={e=>{e.preventDefault();setDragging(false);addFiles(Array.from(e.dataTransfer.files));}}
              onClick={()=>fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl py-16 text-center cursor-pointer transition-all mb-5 ${
                dragging?"border-[#0066CC] bg-[#EEF5FF]":"border-[#BDD5F5] bg-white hover:border-[#0066CC] hover:bg-[#EEF5FF]"
              }`}>
              <input ref={fileRef} type="file" accept=".pdf" multiple className="hidden" onChange={e=>addFiles(Array.from(e.target.files||[]))}/>
              <div className="text-[44px] mb-3">{dragging ? "📂" : "📄"}</div>
              <p className="text-[14px] font-semibold text-[#1B2A4A] mb-1">Drop PDF files here or click to browse</p>
              <p className="text-[12px] text-[#9CA3AF]">Multiple files supported · Prior Authorization policy documents</p>
            </div>

            {/* File queue */}
            {files.length > 0 && (
              <div className="bg-white rounded-xl border-[1.5px] border-[#E2E6EC] shadow-sm overflow-hidden mb-5">
                <div className="px-5 py-3 bg-[#F8F9FB] border-b-[1.5px] border-[#E2E6EC] flex items-center justify-between">
                  <span className="text-[11.5px] font-semibold text-[#374151]">{files.length} file{files.length>1?"s":""} · {doneCount} completed</span>
                  <button onClick={()=>setFiles([])} className="text-[11px] text-[#9CA3AF] hover:text-[#C0180C] font-semibold transition-colors">Remove all</button>
                </div>
                <div className="divide-y divide-[#F3F4F6]">
                  {files.map(f=>(
                    <div key={f.id} className="px-5 py-3 flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-[180px]">
                        <p className="text-[12px] font-medium text-[#1B2A4A] truncate">{f.file.name}</p>
                        <p className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">{(f.file.size/1024).toFixed(0)} KB</p>
                      </div>
                      <select value={f.brand} onChange={e=>setFiles(p=>p.map(x=>x.id===f.id?{...x,brand:e.target.value}:x))}
                        disabled={f.status!=="pending"}
                        className="bg-[#F8F9FB] border-[1.5px] border-[#E2E6EC] rounded-lg px-3 py-1.5 text-[11.5px] font-medium text-[#374151] outline-none focus:border-[#0066CC]">
                        {BRANDS.map(b=><option key={b}>{b}</option>)}
                      </select>
                      <div className="w-28 text-right text-[11px] font-semibold">
                        {f.status==="pending"&&<span className="text-[#9CA3AF]">Pending</span>}
                        {f.status==="uploading"&&<span className="flex items-center gap-1.5 justify-end text-[#0066CC]"><span className="w-1.5 h-1.5 bg-[#0066CC] rounded-full pulse-dot"/>Processing…</span>}
                        {f.status==="done"&&<span className="text-[#0A7A45]">✓ Done</span>}
                        {f.status==="error"&&<span className="text-[#C0180C]" title={f.error}>✗ Error</span>}
                      </div>
                      {f.status==="error"&&f.error&&<p className="w-full text-[10px] text-[#C0180C] bg-[#FEF0EF] border border-[#FBCCC9] rounded px-2 py-1">{f.error}</p>}
                      <button onClick={()=>setFiles(p=>p.filter(x=>x.id!==f.id))} className="text-[#9CA3AF] hover:text-[#C0180C] transition-colors text-sm">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={runExtraction}
                disabled={files.filter(f=>f.status==="pending").length===0||conn!=="ok"}
                className="px-8 py-3 bg-[#0066CC] text-white rounded-xl text-[13px] font-bold hover:bg-[#0055AA] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(0,102,204,0.3)]">
                ▶ Run Extraction ({files.filter(f=>f.status==="pending").length} pending)
              </button>
              {hasResults && (
                <button onClick={()=>downloadCSV(results)}
                  className="px-6 py-3 bg-white border-[2px] border-[#0066CC] text-[#0066CC] rounded-xl text-[13px] font-bold hover:bg-[#EEF5FF] transition-colors">
                  ↓ Export CSV
                </button>
              )}
            </div>

            {/* Empty state */}
            {files.length === 0 && (
              <div className="mt-8 bg-white rounded-xl border-[1.5px] border-[#E2E6EC] p-12 text-center shadow-sm">
                <div className="text-[36px] mb-3">📋</div>
                <p className="text-[14px] font-semibold text-[#374151] mb-1">No files uploaded yet</p>
                <p className="text-[12px] text-[#9CA3AF]">Drag PDF files above or click to browse</p>
              </div>
            )}
          </div>
        )}

        {/* ── RESULTS TAB ────────────────────────────────────────────────── */}
        {tab === "results" && (
          <div className="fade-up">
            {!hasResults ? (
              <div className="bg-white rounded-xl border-[1.5px] border-[#E2E6EC] p-20 text-center shadow-sm">
                <div className="text-[40px] mb-3">🔍</div>
                <p className="text-[14px] font-semibold text-[#374151] mb-1">No extraction results yet</p>
                <p className="text-[12px] text-[#9CA3AF]">Upload PDFs and run extraction to see results here</p>
              </div>
            ) : (
              <>
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                  {[
                    ["Extracted",results.length,"#0066CC"],
                    ["Avg Score",Math.round(results.reduce((s,r)=>s+Number(r["Access Score"]),0)/results.length),"#0A7A45"],
                    ["Has Step Therapy",results.filter(r=>r["Number of Steps through Brands"]!=="NA"||r["Number of Steps through Generic"]!=="NA").length,"#B45309"],
                    ["TB Required",results.filter(r=>r["TB Test required"]==="Y"||r["TB Test required"]==="Yes").length,"#92630A"],
                  ].map(([lbl,val,color])=>(
                    <div key={String(lbl)} className="bg-white rounded-xl border-[1.5px] border-[#E2E6EC] shadow-sm p-4" style={{borderTop:`3px solid ${color}`} as React.CSSProperties}>
                      <p className="text-[10px] font-bold tracking-[2px] uppercase text-[#6B7280] mb-2">{lbl}</p>
                      <p className="text-[26px] font-bold font-mono" style={{color:String(color)}}>{val}</p>
                    </div>
                  ))}
                </div>

                {/* Results table — matches Excel format */}
                <div className="bg-white rounded-xl border-[1.5px] border-[#E2E6EC] shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-[#F8F9FB] border-b-[1.5px] border-[#E2E6EC] flex items-center justify-between">
                    <p className="text-[10.5px] font-bold tracking-[2px] uppercase text-[#374151]">
                      Extraction Results — {results.length} document{results.length>1?"s":""}
                    </p>
                    <button onClick={()=>downloadCSV(results)}
                      className="px-4 py-1.5 bg-white border-[1.5px] border-[#0066CC] text-[#0066CC] rounded-lg text-[11px] font-bold hover:bg-[#EEF5FF] transition-colors">
                      ↓ Download CSV
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px] border-collapse" style={{minWidth:"1400px"}}>
                      <thead>
                        <tr className="bg-[#F8F9FB] border-b-[1.5px] border-[#E2E6EC]">
                          {TABLE_COLS.map(col=>(
                            <th key={String(col.key)} className="px-3 py-3 text-left text-[10px] font-bold tracking-[1.5px] uppercase text-[#6B7280] whitespace-nowrap border-r border-[#F3F4F6] last:border-r-0">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((row, i) => (
                          <tr key={i} className={`border-b border-[#F3F4F6] transition-colors ${i%2===0?"bg-white":"bg-[#FAFBFC]"} hover:bg-[#EEF5FF]`}>
                            {TABLE_COLS.map(col => {
                              const rawVal = String((row as Record<string,string|number>)[col.key as string] ?? "NA");
                              const key = String(col.key);

                              // Score column
                              if (key === "Access Score") {
                                return <td key={key} className="px-3 py-2.5 border-r border-[#F3F4F6] last:border-r-0"><ScorePill score={Number(rawVal)}/></td>;
                              }
                              // Brand column
                              if (key === "Brand") {
                                return <td key={key} className="px-3 py-2.5 border-r border-[#F3F4F6] font-bold text-[#1B2A4A]">{rawVal}</td>;
                              }
                              // Branded/Generic steps
                              if (key === "Number of Steps through Brands") {
                                return <td key={key} className="px-3 py-2.5 border-r border-[#F3F4F6] text-center font-mono font-semibold"
                                  style={{color:rawVal!=="NA"&&rawVal?"#B45309":"#9CA3AF"}}>{rawVal}</td>;
                              }
                              if (key === "Number of Steps through Generic") {
                                return <td key={key} className="px-3 py-2.5 border-r border-[#F3F4F6] text-center font-mono font-semibold"
                                  style={{color:rawVal!=="NA"&&rawVal?"#92630A":"#9CA3AF"}}>{rawVal}</td>;
                              }
                              // Reauth Required
                              if (key === "Reauthorization Required") {
                                return <td key={key} className="px-3 py-2.5 border-r border-[#F3F4F6] font-semibold"
                                  style={{color:rawVal==="Yes"?"#0066CC":"#9CA3AF"}}>{rawVal}</td>;
                              }
                              // TB Test
                              if (key === "TB Test required") {
                                return <td key={key} className="px-3 py-2.5 border-r border-[#F3F4F6] font-semibold"
                                  style={{color:rawVal==="Y"||rawVal==="Yes"?"#B45309":"#9CA3AF"}}>{rawVal}</td>;
                              }
                              // Phototherapy
                              if (key === "Step through-Phototherapy") {
                                return <td key={key} className="px-3 py-2.5 border-r border-[#F3F4F6] font-semibold"
                                  style={{color:rawVal==="Yes"?"#C0180C":"#9CA3AF"}}>{rawVal}</td>;
                              }
                              // Long text columns (step therapy, reauth req'ts, qty limits)
                              if (["Step Therapy Requirements Documented in Policy",
                                   "Reauthorization Requirements Documented in Policy",
                                   "Quantity Limits"].includes(key)) {
                                return (
                                  <td key={key} className="px-3 py-2.5 border-r border-[#F3F4F6] last:border-r-0 max-w-[200px]">
                                    <TruncCell value={rawVal} maxLen={50}/>
                                  </td>
                                );
                              }
                              // Filename
                              if (key === "Filename") {
                                return <td key={key} className="px-3 py-2.5 border-r border-[#F3F4F6] font-mono text-[10px] text-[#6B7280] max-w-[130px] truncate">{rawVal}</td>;
                              }
                              // Default
                              return (
                                <td key={key} className="px-3 py-2.5 border-r border-[#F3F4F6] last:border-r-0"
                                  style={{fontFamily:col.mono?"'IBM Plex Mono',monospace":"inherit",color:"#374151"}}>
                                  {rawVal==="NA" ? <span className="text-[#9CA3AF]">NA</span> : rawVal}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
