"use client";
import Nav from "@/components/Nav";
import { useState, useRef, useCallback, useEffect } from "react";
import { extractFromText, downloadCSV, calculateAccessScore, type ExtractedRow } from "@/lib/extraction";
import { SCORE_COLORS, scoreLabel } from "@/lib/data";

const SUPPORTED_BRANDS = ["TREMFYA", "STELARA", "SKYRIZI", "COSENTYX", "OTEZLA", "HUMIRA", "ENBREL", "RINVOQ", "TALTZ", "ILUMYA", "BIMZELX", "SPEVIGO", "CIMZIA", "SYMPONI", "SIMPONI"];

const PARAMS = [
  "Age",
  "Step Therapy Requirements Documented in Policy",
  "Number of Steps through Brands",
  "Number of Steps through Generic",
  "Step through-Phototherapy",
  "TB Test required",
  "Quantity Limits",
  "Specialist Types",
  "Initial Authorization Duration(in-months)",
  "Reauthorization Duration(in-months)",
  "Reauthorization Required",
  "Reauthorization Requirements Documented in Policy",
];

type UploadedFile = {
  file: File;
  id: string;
  brand: string;
  status: "pending" | "extracting" | "done" | "error";
  result?: ExtractedRow;
  error?: string;
  text?: string;
};

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const texts: string[] = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    texts.push(content.items.map((item: { str?: string }) => item.str || "").join(" "));
  }
  return texts.join("\n\n");
}

function ScoreBadge({ score }: { score: number }) {
  const color = SCORE_COLORS[score] || "#64748b";
  return (
    <span className="border rounded px-2 py-0.5 text-xs font-mono font-bold" style={{ color, borderColor: `${color}40`, background: `${color}12` }}>
      {score}
    </span>
  );
}

function CellValue({ value, param }: { value: string; param: string }) {
  const isNA = !value || value === "NA" || value === "N/A";
  const isLong = value && value.length > 80;
  const [expanded, setExpanded] = useState(false);
  if (isNA) return <span className="text-slate-600 font-mono text-[10px]">NA</span>;
  if (isLong) {
    return (
      <div>
        <span className="text-slate-300 text-[11px] leading-relaxed">{expanded ? value : value.slice(0, 100) + "…"}</span>
        <button onClick={() => setExpanded(!expanded)} className="text-[#00d4b8] text-[10px] ml-1 hover:underline font-mono">
          {expanded ? "less" : "more"}
        </button>
      </div>
    );
  }
  return <span className="text-slate-200 font-mono text-[11px]">{value}</span>;
}

export default function ExtractionPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [dragging, setDragging] = useState(false);
  const [results, setResults] = useState<ExtractedRow[]>([]);
  const [activeTab, setActiveTab] = useState<"upload" | "results">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showKeyInput, setShowKeyInput] = useState(true);

  // Load API key from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("pa_api_key");
    if (saved) { setApiKey(saved); setShowKeyInput(false); }
  }, []);

  const saveKey = () => {
    localStorage.setItem("pa_api_key", apiKey);
    setShowKeyInput(false);
  };

  const addFiles = useCallback((newFiles: File[]) => {
    const pdfs = newFiles.filter(f => f.name.endsWith(".pdf"));
    const uploads: UploadedFile[] = pdfs.map(f => ({
      file: f, id: crypto.randomUUID(), brand: "TREMFYA", status: "pending"
    }));
    setFiles(prev => [...prev, ...uploads]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const runExtraction = async () => {
    if (!apiKey) { alert("Please enter your API key first."); return; }
    const pending = files.filter(f => f.status === "pending");
    if (pending.length === 0) return;

    for (const upFile of pending) {
      setFiles(prev => prev.map(f => f.id === upFile.id ? { ...f, status: "extracting" } : f));
      try {
        let text = upFile.text;
        if (!text) {
          text = await extractTextFromPDF(upFile.file);
          setFiles(prev => prev.map(f => f.id === upFile.id ? { ...f, text } : f));
        }
        const result = await extractFromText(text, upFile.file.name, upFile.brand, apiKey);
        setFiles(prev => prev.map(f => f.id === upFile.id ? { ...f, status: "done", result } : f));
        setResults(prev => {
          const filtered = prev.filter(r => !(r.filename === result.filename && r.brand === result.brand));
          return [...filtered, result];
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setFiles(prev => prev.map(f => f.id === upFile.id ? { ...f, status: "error", error: msg } : f));
      }
    }
    setActiveTab("results");
  };

  const doneCount = files.filter(f => f.status === "done").length;
  const hasResults = results.length > 0;

  return (
    <div className="min-h-screen grid-bg">
      <Nav />
      <main className="pt-20 pb-16 px-6 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="mb-8 fade-up">
          <p className="text-[10px] font-mono tracking-[4px] uppercase text-[#4f8ef7] mb-2">Extraction Engine</p>
          <h1 className="font-display text-3xl font-800 text-white mb-1">PA Parameter Extraction</h1>
          <p className="text-sm text-slate-400">Upload PDF policy documents · Extract 12 parameters + Access Score via AI</p>
        </div>

        {/* API Key */}
        <div className="bg-[#0e1520] border border-[#1e2d42] rounded-xl p-5 mb-6 fade-up">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-[#4f8ef7]" />
              <span className="text-xs font-mono text-slate-300 uppercase tracking-widest">API Configuration</span>
            </div>
            {!showKeyInput && (
              <button onClick={() => setShowKeyInput(true)} className="text-[10px] font-mono text-slate-500 hover:text-slate-300">Edit</button>
            )}
          </div>
          {showKeyInput ? (
            <div className="flex gap-3">
              <input
                type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-... (Anthropic API key)"
                className="flex-1 bg-[#131c2a] border border-[#1e2d42] rounded-lg px-4 py-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-[#4f8ef7] transition-colors"
              />
              <button onClick={saveKey} disabled={!apiKey}
                className="px-5 py-2.5 bg-[#4f8ef7]/10 border border-[#4f8ef7]/30 text-[#4f8ef7] rounded-lg text-xs font-mono hover:bg-[#4f8ef7]/20 transition-colors disabled:opacity-40">
                Save Key
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22c55e] pulse-dot" />
              <span className="text-xs font-mono text-slate-400">API key configured · {apiKey.slice(0, 12)}…</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5">
          {([["upload", "Upload & Configure"], ["results", `Results${hasResults ? ` (${results.length})` : ""}`]] as [string, string][]).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab as "upload" | "results")}
              className={`px-5 py-2 rounded-lg text-xs font-mono transition-all ${activeTab === tab ? "bg-[#131c2a] border border-[#1e2d42] text-slate-200" : "text-slate-500 hover:text-slate-300"}`}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === "upload" && (
          <div className="fade-up">
            {/* Drop Zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 mb-5 ${
                dragging ? "border-[#4f8ef7] bg-[#4f8ef7]/5" : "border-[#1e2d42] hover:border-[#4f8ef7]/40 hover:bg-white/[0.01]"
              }`}
            >
              <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={e => addFiles(Array.from(e.target.files || []))} />
              <div className="text-4xl mb-3">{dragging ? "📂" : "📄"}</div>
              <p className="font-display text-sm text-slate-300 mb-1">Drop PDF files here or click to browse</p>
              <p className="text-xs font-mono text-slate-600">Supports multiple files · Prior Authorization policy documents</p>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="bg-[#0e1520] border border-[#1e2d42] rounded-xl overflow-hidden mb-5">
                <div className="p-4 border-b border-[#1e2d42] flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">{files.length} file{files.length > 1 ? "s" : ""} queued · {doneCount} completed</span>
                  <button onClick={() => setFiles([])} className="text-[10px] font-mono text-slate-600 hover:text-slate-400">Clear all</button>
                </div>
                <div className="divide-y divide-[#131c2a]">
                  {files.map(f => (
                    <div key={f.id} className="px-5 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-slate-300 truncate">{f.file.name}</div>
                        <div className="text-[10px] font-mono text-slate-600 mt-0.5">{(f.file.size / 1024).toFixed(0)} KB</div>
                      </div>
                      <select
                        value={f.brand}
                        onChange={e => setFiles(prev => prev.map(p => p.id === f.id ? { ...p, brand: e.target.value } : p))}
                        disabled={f.status !== "pending"}
                        className="bg-[#131c2a] border border-[#1e2d42] rounded px-3 py-1.5 text-[11px] font-mono text-slate-300 outline-none"
                      >
                        {SUPPORTED_BRANDS.map(b => <option key={b}>{b}</option>)}
                      </select>
                      <div className="w-24 text-right">
                        {f.status === "pending" && <span className="text-[10px] font-mono text-slate-500">Pending</span>}
                        {f.status === "extracting" && (
                          <span className="flex items-center gap-1.5 justify-end">
                            <div className="w-2 h-2 rounded-full bg-[#4f8ef7] pulse-dot" />
                            <span className="text-[10px] font-mono text-[#4f8ef7]">Extracting</span>
                          </span>
                        )}
                        {f.status === "done" && <span className="text-[10px] font-mono text-[#22c55e]">✓ Done</span>}
                        {f.status === "error" && (
                          <span className="text-[10px] font-mono text-red-400" title={f.error}>✗ Error</span>
                        )}
                      </div>
                      <button
                        onClick={() => setFiles(prev => prev.filter(p => p.id !== f.id))}
                        className="text-slate-600 hover:text-slate-400 text-sm w-5"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Run button */}
            <div className="flex items-center gap-4">
              <button
                onClick={runExtraction}
                disabled={files.filter(f => f.status === "pending").length === 0 || !apiKey}
                className="px-8 py-3 bg-[#00d4b8]/10 border border-[#00d4b8]/30 text-[#00d4b8] rounded-xl text-sm font-mono font-medium hover:bg-[#00d4b8]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ▶ Run Extraction ({files.filter(f => f.status === "pending").length} pending)
              </button>
              {hasResults && (
                <button
                  onClick={() => downloadCSV(results)}
                  className="px-6 py-3 bg-[#4f8ef7]/10 border border-[#4f8ef7]/30 text-[#4f8ef7] rounded-xl text-sm font-mono hover:bg-[#4f8ef7]/20 transition-all"
                >
                  ↓ Export CSV
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === "results" && (
          <div className="fade-up">
            {!hasResults ? (
              <div className="text-center py-20 text-slate-500 font-mono text-sm">
                No results yet — upload and extract PDFs first.
              </div>
            ) : (
              <>
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                  <div className="bg-[#0e1520] border border-[#1e2d42] rounded-xl p-4">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Extracted</div>
                    <div className="font-display text-2xl font-700 text-[#00d4b8]">{results.length}</div>
                  </div>
                  <div className="bg-[#0e1520] border border-[#1e2d42] rounded-xl p-4">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Avg Score</div>
                    <div className="font-display text-2xl font-700 text-[#4f8ef7]">
                      {Math.round(results.reduce((s, r) => s + r["Access Score"], 0) / results.length)}
                    </div>
                  </div>
                  <div className="bg-[#0e1520] border border-[#1e2d42] rounded-xl p-4">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Has Step Therapy</div>
                    <div className="font-display text-2xl font-700 text-[#f97316]">
                      {results.filter(r => r["Number of Steps through Brands"] !== "NA" || r["Number of Steps through Generic"] !== "NA").length}
                    </div>
                  </div>
                  <div className="bg-[#0e1520] border border-[#1e2d42] rounded-xl p-4">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">TB Required</div>
                    <div className="font-display text-2xl font-700 text-[#f59e0b]">
                      {results.filter(r => r["TB Test required"] === "Y").length}
                    </div>
                  </div>
                </div>

                {/* Export button */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => downloadCSV(results)}
                    className="px-5 py-2.5 bg-[#4f8ef7]/10 border border-[#4f8ef7]/30 text-[#4f8ef7] rounded-lg text-xs font-mono hover:bg-[#4f8ef7]/20 transition-all"
                  >
                    ↓ Download CSV
                  </button>
                </div>

                {/* Results cards */}
                {results.map((row, i) => (
                  <div key={i} className="bg-[#0e1520] border border-[#1e2d42] rounded-xl overflow-hidden mb-4">
                    {/* Card header */}
                    <div className="p-4 border-b border-[#1e2d42] flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="font-mono text-[10px] text-slate-500 mb-0.5">{row.filename}</div>
                        <div className="font-display font-700 text-base text-white">{row.brand}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">Access Score</div>
                          <ScoreBadge score={row["Access Score"]} />
                          <div className="text-[9px] font-mono mt-0.5" style={{ color: SCORE_COLORS[row["Access Score"]] }}>
                            {scoreLabel(row["Access Score"])}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Parameters grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#131c2a]">
                      {/* Simple params */}
                      <div className="p-4 space-y-3">
                        {["Age", "Step through-Phototherapy", "TB Test required", "Specialist Types", "Initial Authorization Duration(in-months)", "Reauthorization Duration(in-months)", "Reauthorization Required"].map(p => (
                          <div key={p} className="flex justify-between items-start gap-2">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide shrink-0">{p.replace(/\(in-months\)/,"").slice(0,28)}</span>
                            <CellValue value={(row as Record<string,string|number>)[p] as string} param={p} />
                          </div>
                        ))}
                      </div>

                      {/* Step counts */}
                      <div className="p-4 space-y-3">
                        {["Number of Steps through Brands", "Number of Steps through Generic", "Quantity Limits"].map(p => (
                          <div key={p} className="flex justify-between items-start gap-2">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide shrink-0">{p.slice(0, 26)}</span>
                            <CellValue value={(row as Record<string,string|number>)[p] as string} param={p} />
                          </div>
                        ))}
                        <div>
                          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wide mb-2">Reauth Requirements</div>
                          <CellValue value={row["Reauthorization Requirements Documented in Policy"]} param="reauth" />
                        </div>
                      </div>

                      {/* Step therapy text */}
                      <div className="p-4">
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wide mb-2">Step Therapy Requirements</div>
                        <CellValue value={row["Step Therapy Requirements Documented in Policy"]} param="step" />
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
