"use client";
// v: 2026-06-01-v3
import Nav from "@/components/Nav";
import { useState, useRef, useCallback, useEffect } from "react";
import { extractFromBackend, downloadCSV, type ExtractedRow } from "@/lib/extraction";
import { SCORE_COLORS, SCORE_BG } from "@/lib/data";

const BRANDS = ["TREMFYA","STELARA","SKYRIZI","COSENTYX","OTEZLA","HUMIRA","ENBREL","RINVOQ","TALTZ","ILUMYA","BIMZELX","SPEVIGO","CIMZIA","SYMPONI","SIMPONI","AMJEVITA","YESINTEK","REMICADE","ACITRETIN","SILIQ"];
const DEFAULT_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://pa-intel-api.onrender.com";

const T = {
  bg: "#F4F5F7", white: "#FFFFFF", border: "#E2E6EC",
  navy: "#1B2A4A", blue: "#0066CC", text: "#374151",
  muted: "#6B7280", light: "#9CA3AF",
  shadow: "0 2px 8px rgba(27,42,74,0.07)",
};

function scoreLabel(s: number) {
  if (s <= 0) return "Restricted"; if (s <= 25) return "Highly Restricted";
  if (s <= 50) return "Moderate"; if (s <= 75) return "Standard Access"; return "Open Access";
}
function scoreBucket(s: number) {
  if (s <= 0) return 0; if (s <= 25) return 25; if (s <= 50) return 50; if (s <= 75) return 75; return 100;
}

type UpFile = { file: File; id: string; brand: string; status: "pending"|"uploading"|"done"|"error"; result?: ExtractedRow; error?: string; };

const TABLE_COLS: { key: string; label: string; mono?: boolean }[] = [
  { key: "Filename",                                               label: "File",        mono: true },
  { key: "Brand",                                                  label: "Brand"                  },
  { key: "Age",                                                    label: "Age",         mono: true },
  { key: "Number of Steps through Brands",                         label: "B Steps",     mono: true },
  { key: "Number of Steps through Generic",                        label: "G Steps",     mono: true },
  { key: "Step through-Phototherapy",                              label: "Photo"                  },
  { key: "TB Test required",                                       label: "TB"                     },
  { key: "Quantity Limits",                                        label: "Qty Limits"             },
  { key: "Specialist Types",                                       label: "Specialist"             },
  { key: "Initial Authorization Duration(in-months)",              label: "Init Auth",   mono: true },
  { key: "Reauthorization Duration(in-months)",                    label: "Reauth Dur",  mono: true },
  { key: "Reauthorization Required",                               label: "Reauth Req"             },
  { key: "Step Therapy Requirements Documented in Policy",         label: "Step Therapy"           },
  { key: "Reauthorization Requirements Documented in Policy",      label: "Reauth Req'ts"          },
  { key: "Access Score",                                           label: "Score"                  },
];

function TruncCell({ value }: { value: string }) {
  const [exp, setExp] = useState(false);
  const na = !value || value === "NA" || value === "N/A";
  if (na) return <span style={{ color: T.light, fontFamily: "IBM Plex Mono, monospace", fontSize: 10 }}>NA</span>;
  if (value.length <= 55) return <span style={{ color: T.text, fontSize: 11 }}>{value}</span>;
  return (
    <span>
      <span style={{ color: T.text, fontSize: 11 }}>{exp ? value : value.slice(0, 55) + "…"}</span>
      <button onClick={e => { e.stopPropagation(); setExp(!exp); }}
        style={{ background: "none", border: "none", cursor: "pointer", color: T.blue, fontSize: 10, fontWeight: 600, marginLeft: 4, padding: 0 }}>
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
    setConn("unknown");
    try {
      const r = await fetch(`${backendUrl.replace(/\/$/,"")}/health`, { signal: AbortSignal.timeout(8000) });
      setConn(r.ok ? "ok" : "error");
    } catch { setConn("error"); }
  }, [backendUrl]);

  useEffect(() => { ping(); }, [ping]);

  const saveUrl = (u: string) => { setBackendUrl(u); localStorage.setItem("pa_backend_url", u); };

  const addFiles = useCallback((newFiles: File[]) => {
    const pdfs = newFiles.filter(f => f.name.toLowerCase().endsWith(".pdf"));
    setFiles(prev => [...prev, ...pdfs.map(f => ({ file: f, id: crypto.randomUUID(), brand: "TREMFYA", status: "pending" as const }))]);
  }, []);

  const run = async () => {
    for (const uf of files.filter(f => f.status === "pending")) {
      setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: "uploading" } : f));
      try {
        const result = await extractFromBackend(uf.file, uf.brand, backendUrl);
        setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: "done", result } : f));
        setResults(prev => [...prev.filter(r => !(r.Filename === result.Filename && r.Brand === result.Brand)), result]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: "error", error: msg } : f));
      }
    }
    setTab("results");
  };

  const doneCount  = files.filter(f => f.status === "done").length;
  const hasResults = results.length > 0;
  const pending    = files.filter(f => f.status === "pending").length;

  const connDot = { ok: "#22C55E", unknown: "#F59E0B", error: "#C0180C" }[conn];
  const connLabel = { ok: "Connected", unknown: "Checking…", error: "Unreachable" }[conn];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Inter, system-ui, sans-serif" }}>
      <Nav />
      <main style={{ paddingTop: 68, paddingBottom: 64, paddingLeft: 32, paddingRight: 32, maxWidth: 1440, margin: "0 auto" }}>

        {/* Page header */}
        <div style={{ padding: "28px 0 24px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase" as const, color: T.blue, marginBottom: 4 }}>Extraction Engine</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, marginBottom: 4, letterSpacing: -0.3 }}>PA Parameter Extraction</h1>
          <p style={{ fontSize: 13, color: T.muted }}>Upload PA policy PDFs · Full pipeline: parse → chunk → BM25 retrieve → LLM extract → normalize → score</p>
        </div>

        {/* Backend connection card */}
        <div style={{ background: T.white, borderRadius: 12, border: `1.5px solid ${T.border}`, boxShadow: T.shadow, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: connDot, boxShadow: `0 0 0 3px ${connDot}30`, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: connDot }}>{connLabel}</span>
          </div>
          <input type="text" value={backendUrl} onChange={e => saveUrl(e.target.value)}
            style={{ flex: 1, minWidth: 240, background: "#F8F9FB", border: `1.5px solid ${T.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, fontFamily: "IBM Plex Mono, monospace", color: T.navy, outline: "none" }}
          />
          <button onClick={ping}
            style={{ padding: "8px 18px", background: T.white, border: `1.5px solid ${T.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: T.text, cursor: "pointer", flexShrink: 0 }}>
            Test Connection
          </button>
          {conn === "error" && (
            <p style={{ width: "100%", fontSize: 11, color: "#B45309", background: "#FEF4E6", border: "1px solid #FDD9A0", borderRadius: 8, padding: "8px 12px", margin: 0 }}>
              ⚠ Backend may be sleeping (Render free tier) — wait ~30s and retry.
            </p>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ display: "flex", background: T.white, border: `1.5px solid ${T.border}`, borderRadius: 8, padding: 4, boxShadow: T.shadow }}>
            {(["upload", "results"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  padding: "7px 22px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: tab === t ? T.blue : "transparent",
                  color: tab === t ? "#fff" : T.muted,
                  boxShadow: tab === t ? "0 2px 6px rgba(0,102,204,0.3)" : "none",
                  transition: "all 0.15s",
                }}>
                {t === "upload" ? "Upload & Configure" : `Results${hasResults ? ` (${results.length})` : ""}`}
              </button>
            ))}
          </div>
          {hasResults && tab === "results" && (
            <button onClick={() => downloadCSV(results)}
              style={{ padding: "8px 20px", background: T.white, border: `2px solid ${T.blue}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: T.blue, cursor: "pointer" }}>
              ↓ Download CSV
            </button>
          )}
        </div>

        {/* ── UPLOAD TAB ─────────────────────────────────────────────────── */}
        {tab === "upload" && (
          <>
            {/* Drop zone — large and prominent */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? T.blue : "#BDD5F5"}`,
                borderRadius: 16,
                background: dragging ? "#EEF5FF" : T.white,
                padding: "64px 24px",
                textAlign: "center" as const,
                cursor: "pointer",
                transition: "all 0.2s",
                marginBottom: 24,
              }}>
              <input ref={fileRef} type="file" accept=".pdf" multiple style={{ display: "none" }} onChange={e => addFiles(Array.from(e.target.files || []))} />
              <div style={{ fontSize: 48, marginBottom: 16 }}>{dragging ? "📂" : "📄"}</div>
              <p style={{ fontSize: 16, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Drop PDF files here or click to browse</p>
              <p style={{ fontSize: 13, color: T.light }}>Multiple files supported · Prior Authorization policy documents</p>
            </div>

            {/* File queue */}
            {files.length > 0 && (
              <div style={{ background: T.white, borderRadius: 12, border: `1.5px solid ${T.border}`, boxShadow: T.shadow, overflow: "hidden", marginBottom: 28 }}>
                <div style={{ padding: "12px 20px", background: "#F8F9FB", borderBottom: `1.5px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{files.length} file{files.length > 1 ? "s" : ""} · {doneCount} completed</span>
                  <button onClick={() => setFiles([])} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: T.light, fontWeight: 600 }}>Remove all</button>
                </div>
                {files.map(f => (
                  <div key={f.id} style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 14, borderBottom: `1px solid #F3F4F6`, flexWrap: "wrap" as const }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: T.navy, marginBottom: 2 }}>{f.file.name}</p>
                      <p style={{ fontSize: 10, fontFamily: "IBM Plex Mono, monospace", color: T.light }}>{(f.file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <select value={f.brand} onChange={e => setFiles(p => p.map(x => x.id === f.id ? { ...x, brand: e.target.value } : x))}
                      disabled={f.status !== "pending"}
                      style={{ background: "#F8F9FB", border: `1.5px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 500, color: T.text, outline: "none" }}>
                      {BRANDS.map(b => <option key={b}>{b}</option>)}
                    </select>
                    <div style={{ width: 110, textAlign: "right" as const }}>
                      {f.status === "pending"   && <span style={{ fontSize: 11, color: T.light }}>Pending</span>}
                      {f.status === "uploading" && <span style={{ fontSize: 11, color: T.blue, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>⏳ Processing…</span>}
                      {f.status === "done"      && <span style={{ fontSize: 11, color: "#0A7A45", fontWeight: 600 }}>✓ Done</span>}
                      {f.status === "error"     && <span style={{ fontSize: 11, color: "#C0180C", fontWeight: 600 }} title={f.error}>✗ Error</span>}
                    </div>
                    {f.status === "error" && f.error && (
                      <p style={{ width: "100%", fontSize: 11, color: "#C0180C", background: "#FEF0EF", borderRadius: 6, padding: "6px 10px", border: "1px solid #FBCCC9" }}>{f.error}</p>
                    )}
                    <button onClick={() => setFiles(p => p.filter(x => x.id !== f.id))}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: T.light, padding: "0 4px", lineHeight: 1 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button onClick={run} disabled={pending === 0 || conn !== "ok"}
                style={{
                  padding: "12px 36px", borderRadius: 12, border: "none", cursor: pending === 0 || conn !== "ok" ? "not-allowed" : "pointer",
                  background: pending === 0 || conn !== "ok" ? "#E5E7EB" : T.blue,
                  color: pending === 0 || conn !== "ok" ? T.light : "#fff",
                  fontSize: 14, fontWeight: 700,
                  boxShadow: pending > 0 && conn === "ok" ? "0 2px 10px rgba(0,102,204,0.35)" : "none",
                  transition: "all 0.15s",
                }}>
                ▶ Run Extraction{pending > 0 ? ` (${pending} pending)` : ""}
              </button>
              {hasResults && (
                <button onClick={() => downloadCSV(results)}
                  style={{ padding: "12px 28px", borderRadius: 12, background: T.white, border: `2px solid ${T.blue}`, color: T.blue, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  ↓ Export CSV
                </button>
              )}
            </div>

            {/* Empty state */}
            {files.length === 0 && (
              <div style={{ marginTop: 40, background: T.white, borderRadius: 16, border: `1.5px solid ${T.border}`, padding: "56px 24px", textAlign: "center" as const, boxShadow: T.shadow }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>📋</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>No files queued yet</p>
                <p style={{ fontSize: 13, color: T.light }}>Drag PDF files into the area above or click to browse</p>
              </div>
            )}
          </>
        )}

        {/* ── RESULTS TAB ────────────────────────────────────────────────── */}
        {tab === "results" && (
          <>
            {!hasResults ? (
              <div style={{ background: T.white, borderRadius: 16, border: `1.5px solid ${T.border}`, padding: "80px 24px", textAlign: "center" as const, boxShadow: T.shadow }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>🔍</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>No extraction results yet</p>
                <p style={{ fontSize: 13, color: T.light }}>Upload PDFs and run extraction to see results here</p>
              </div>
            ) : (
              <>
                {/* Summary KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                  {[
                    ["Extracted",      results.length,                                                                                                   "#0066CC"],
                    ["Avg Score",      Math.round(results.reduce((s,r) => s+Number(r["Access Score"]),0)/results.length),                               "#0A7A45"],
                    ["Has Step Therapy",results.filter(r => r["Number of Steps through Brands"]!=="NA"||r["Number of Steps through Generic"]!=="NA").length, "#B45309"],
                    ["TB Required",    results.filter(r => r["TB Test required"]==="Y"||r["TB Test required"]==="Yes").length,                          "#92630A"],
                  ].map(([lbl,val,color]) => (
                    <div key={String(lbl)} style={{ background: T.white, borderRadius: 12, border: `1.5px solid ${T.border}`, borderTop: `3px solid ${color}`, boxShadow: T.shadow, padding: 20 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: T.muted, marginBottom: 8 }}>{lbl}</p>
                      <p style={{ fontSize: 30, fontWeight: 700, fontFamily: "IBM Plex Mono, monospace", color: String(color), lineHeight: 1 }}>{val}</p>
                    </div>
                  ))}
                </div>

                {/* Results table */}
                <div style={{ background: T.white, borderRadius: 12, border: `1.5px solid ${T.border}`, boxShadow: T.shadow, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", background: "#F8F9FB", borderBottom: `1.5px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: T.text }}>
                      Extraction Results — {results.length} document{results.length > 1 ? "s" : ""}
                    </p>
                    <button onClick={() => downloadCSV(results)}
                      style={{ padding: "6px 16px", background: T.white, border: `1.5px solid ${T.blue}`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: T.blue, cursor: "pointer" }}>
                      ↓ Download CSV
                    </button>
                  </div>
                  <div style={{ overflowX: "auto" as const }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12, minWidth: 1400 }}>
                      <thead>
                        <tr style={{ background: "#F8F9FB", borderBottom: `1.5px solid ${T.border}` }}>
                          {TABLE_COLS.map(col => (
                            <th key={col.key} style={{ padding: "10px 12px", textAlign: "left" as const, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: T.muted, whiteSpace: "nowrap" as const, borderRight: `1px solid #F3F4F6` }}>
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((row, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid #F3F4F6`, background: i % 2 === 0 ? T.white : "#FAFBFC" }}>
                            {TABLE_COLS.map(col => {
                              const v = String((row as Record<string,string|number>)[col.key] ?? "NA");
                              const isNA = v === "NA" || v === "N/A" || !v;

                              if (col.key === "Access Score") {
                                const n = Number(v);
                                const color = SCORE_COLORS[n] || T.muted;
                                const bg = SCORE_BG[n] || "#F8F9FA";
                                return <td key={col.key} style={{ padding: "10px 12px", borderRight: `1px solid #F3F4F6` }}>
                                  <span style={{ background: bg, color, border: `1.5px solid ${color}40`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: "IBM Plex Mono, monospace" }}>{n}</span>
                                </td>;
                              }
                              if (col.key === "Brand") return <td key={col.key} style={{ padding: "10px 12px", fontWeight: 700, fontSize: 13, color: T.navy, borderRight: `1px solid #F3F4F6`, whiteSpace: "nowrap" as const }}>{v}</td>;
                              if (col.key === "Number of Steps through Brands") return <td key={col.key} style={{ padding: "10px 12px", textAlign: "center" as const, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 600, color: isNA ? T.light : "#B45309", borderRight: `1px solid #F3F4F6` }}>{v}</td>;
                              if (col.key === "Number of Steps through Generic") return <td key={col.key} style={{ padding: "10px 12px", textAlign: "center" as const, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 600, color: isNA ? T.light : "#92630A", borderRight: `1px solid #F3F4F6` }}>{v}</td>;
                              if (col.key === "Reauthorization Required") return <td key={col.key} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 600, color: v === "Yes" ? T.blue : T.light, borderRight: `1px solid #F3F4F6` }}>{v}</td>;
                              if (col.key === "TB Test required") return <td key={col.key} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 600, color: v === "Y" || v === "Yes" ? "#B45309" : T.light, borderRight: `1px solid #F3F4F6` }}>{v}</td>;
                              if (col.key === "Step through-Phototherapy") return <td key={col.key} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 600, color: v === "Yes" ? "#C0180C" : T.light, borderRight: `1px solid #F3F4F6` }}>{v}</td>;
                              if (col.key === "Filename") return <td key={col.key} style={{ padding: "10px 12px", fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: T.light, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, borderRight: `1px solid #F3F4F6` }}>{v}</td>;
                              if (["Step Therapy Requirements Documented in Policy", "Reauthorization Requirements Documented in Policy", "Quantity Limits"].includes(col.key)) {
                                return <td key={col.key} style={{ padding: "10px 12px", maxWidth: 220, borderRight: `1px solid #F3F4F6` }}><TruncCell value={v} /></td>;
                              }
                              return <td key={col.key} style={{ padding: "10px 12px", fontFamily: col.mono ? "IBM Plex Mono, monospace" : "inherit", fontSize: 11, color: isNA ? T.light : T.text, borderRight: `1px solid #F3F4F6`, whiteSpace: "nowrap" as const }}>{v}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
