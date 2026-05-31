"use client";

export const BUSINESS_RULES = `[Age]
Output >=18 if policy says 'adults'/'adult patients' without a number. Output '>=N' if numeric threshold given. Output 'FDA labelled age' only if policy defers to FDA label without any number. Output 'NA' if no age criterion.

[Step Therapy Requirements Documented in Policy]
Extract ALL prior treatment requirements verbatim. Two layers: (1) Universal criteria — apply to all indications; (2) PsO-specific criteria. Exclude: TB test, severity-only criteria (≥10% BSA alone), documentation requirements, non-PsO indications (PsA, UC, CD). Moderate-to-severe PsO only if severity split exists. Output universal first, then indication-specific. Copy exact policy language. Output 'NA' if none.

[Number of Steps through Brands]
Count minimum mandatory branded/biologic/targeted synthetic steps. WHAT COUNTS: named biologics, targeted synthetics (Otezla/apremilast, Sotyktu/deucravacitinib), biosimilars, drug classes IF target drug belongs to that class. WHAT DOES NOT COUNT: topicals, MTX, cyclosporine, acitretin, DMARDs, phototherapy. TWO-LAYER ALGORITHM: (1) Universal branded steps → U; (2) Map PsO OR paths, fewest branded steps → B; (3) Final=U+B. Final=0 → 'NA'.

[Number of Steps through Generic]
Count minimum mandatory non-biologic conventional steps. WHAT COUNTS: topicals, MTX, cyclosporine, acitretin, leflunomide, sulfasalazine. WHAT DOES NOT COUNT: biologics (branded), phototherapy (SKIP). AND-CHAIN: Each '; AND' bullet is independent — 'topical; AND Phototherapy; AND systemic' = topical(1) + SKIP + systemic(1) = 2. Same OR path as branded. Final=0 → 'NA'.

[Step through-Phototherapy]
'Yes' if phototherapy is its own mandatory AND bullet. 'No' if in OR with other therapies or not mentioned. 'N/A' if no criteria at all.

[TB Test required]
'Y' if any TB screening required as condition of approval. 'No' if not mentioned. Output 'Y' not 'Yes'.

[Quantity Limits]
ONLY capture sections labeled 'Quantity Limit', 'Quantity Level Limit', 'QL', 'Maximum Quantity', 'Supply Limit'. DO NOT capture 'Dosage', 'Dosing', 'Dosage and Administration', 'Dosing Limit'. Output 'NA' if none.

[Specialist Types]
Prescriber specialty for PsO ONLY. Exclude PsA, UC, CD entries. Output 'Dermatologist' | 'Dermatologist or Rheumatologist' | 'NA'.

[Initial Authorization Duration(in-months)]
PsO-specific duration overrides general header. Convert to months. Output 'X Months' | 'Unspecified' | 'NA'.

[Reauthorization Duration(in-months)]
Duration of renewal. Convert to months. Output 'X Months' | 'Unspecified' | 'NA'.

[Reauthorization Required]
'Yes' if continuation/renewal criteria section exists. 'No' if explicitly not required. 'NA' if no info.

[Reauthorization Requirements Documented in Policy]
Verbatim PsO continuation criteria. May include BSA reduction, symptom improvement, prescriber attestation. Verbatim. 'NA' if none.`;

export const FEW_SHOT = `EXAMPLE (Commercial TREMFYA/Aetna — no step therapy, severity OR paths):
Age: >=18 | Brands: NA | Generic: NA | Phototherapy: No | TB: Y | QL: NA | Specialist: Dermatologist | InitAuth: 12 Months | ReauthDur: 12 Months | ReauthReq: Yes
Reason: 'adult members' = >=18. PsO has severity-only OR paths (crucial areas, ≥10% BSA) → 0 branded, 0 generic = NA. Dosing limits excluded. Specialist = PsO entry only.

EXAMPLE (State Medicaid TREMFYA/Alaska — mandatory TNF blocker + topical):
Age: FDA labelled age | Brands: 1 | Generic: 1 | Phototherapy: No | TB: Y | QL: NA | Specialist: NA | InitAuth: 3 Months | ReauthDur: 12 Months | ReauthReq: Yes
Reason: Policy says 'FDA labeled age'. TNF blocker = 1 branded. Topical agent = 1 generic. No phototherapy step. Very short 3-month initial auth.`;

export const SCHEMA_PROMPTS: Record<string, string> = {
  "Age": "STEP 1: Numeric threshold (e.g., '>=18', '6 years and older') → output '>=N'. STEP 2: 'adults'/'adult patients' without number → '>=18'. STEP 3: FDA label reference only → 'FDA labelled age'. STEP 4: No age criterion → 'NA'.",
  "Step Therapy Requirements Documented in Policy": "STEP 1: Find universal criteria ('For all indications:'). STEP 2: Find PsO-specific prior treatment requirements. STEP 3: EXCLUDE: TB test, severity-only criteria, non-PsO indications, documentation requirements. STEP 4: PsO scope only. STEP 5: Verbatim. Output universal first, then PsO-specific. 'NA' if none.",
  "Number of Steps through Brands": "STEP 1: Universal branded steps → U (0 if none). STEP 2: Map PsO OR paths, count branded per path. STEP 3: No connector = OR. STEP 4: Fewest branded path → B. STEP 5: Final=U+B. Final=0 → 'NA'. NOTE: TREMFYA IS a biologic — 'a biologic' class counts. TREMFYA is NOT a TNF inhibitor.",
  "Number of Steps through Generic": "STEP 1: Universal generic → U. STEP 2: SAME OR path as branded → B (skip phototherapy bullets). STEP 3: Final=U+B. 0 → 'NA'.",
  "Step through-Phototherapy": "STEP 1: Find phototherapy/UVB/PUVA. STEP 2: Own AND bullet (cannot bypass) → 'Yes'. In OR statement → 'No'. Not mentioned → 'No'. No criteria → 'N/A'.",
  "TB Test required": "Search for tuberculosis/TB test/TST/IGRA. Found + applies → 'Y'. Not found → 'No'. Output 'Y' not 'Yes'.",
  "Quantity Limits": "Search for 'Quantity Limit', 'Quantity Level Limit', 'QL'. Must be labeled as such. DO NOT capture 'dosing limits'. Copy verbatim or 'NA'.",
  "Specialist Types": "Find PsO prescriber specialty ONLY (exclude PsA, UC, CD). Output 'Dermatologist' | 'Dermatologist or Rheumatologist' | 'NA'.",
  "Initial Authorization Duration(in-months)": "PsO coverage criteria approval outcome. PsO-specific overrides general header. Convert to months. Output 'X Months' | 'Unspecified' | 'NA'.",
  "Reauthorization Duration(in-months)": "Continuation/renewal section approval outcome. Convert to months. Output 'X Months' | 'Unspecified' | 'NA'.",
  "Reauthorization Required": "Renewal/continuation criteria section exists → 'Yes'. Explicitly not required → 'No'. No info → 'NA'.",
  "Reauthorization Requirements Documented in Policy": "PsO continuation section criteria verbatim (exclude PsA/UC/CD). 'NA' if none.",
};

export interface ExtractedRow {
  filename: string;
  brand: string;
  Age: string;
  "Step Therapy Requirements Documented in Policy": string;
  "Number of Steps through Brands": string;
  "Number of Steps through Generic": string;
  "Step through-Phototherapy": string;
  "TB Test required": string;
  "Quantity Limits": string;
  "Specialist Types": string;
  "Initial Authorization Duration(in-months)": string;
  "Reauthorization Duration(in-months)": string;
  "Reauthorization Required": string;
  "Reauthorization Requirements Documented in Policy": string;
  "Access Score": number;
}

export function calculateAccessScore(row: Partial<ExtractedRow>): number {
  let penalty = 0;
  const v = (k: string) => String((row as Record<string,string>)[k] || "NA").toLowerCase().trim();
  const parseMonths = (s: string) => { const m = s.match(/(\d+)/); return m ? parseInt(m[1]) : null; };
  const parseInt = (s: string) => { if (["na","n/a","none",""].includes(s)) return null; const m = s.match(/(\d+)/); return m ? parseInt(m[1]) : null; };

  // Branded steps
  const b = parseInt(v("Number of Steps through Brands"));
  if (b) penalty += b === 1 ? 15 : b === 2 ? 25 : 35;

  // Generic steps
  const g = parseInt(v("Number of Steps through Generic"));
  if (g) penalty += g === 1 ? 8 : g === 2 ? 15 : 20;

  // Phototherapy
  if (v("Step through-Phototherapy") === "yes") penalty += 10;

  // TB test
  if (v("TB Test required") === "y" || v("TB Test required") === "yes") penalty += 5;

  // Specialist
  if (!["na","n/a","","none"].includes(v("Specialist Types"))) penalty += 5;

  // Initial auth duration
  const initMonths = parseMonths(v("Initial Authorization Duration(in-months)"));
  if (initMonths !== null) { if (initMonths < 6) penalty += 10; else if (initMonths === 6) penalty += 5; }

  // Reauth required
  if (v("Reauthorization Required") === "yes") penalty += 5;

  // Reauth duration
  if (v("Reauthorization Required") === "yes") {
    const rm = parseMonths(v("Reauthorization Duration(in-months)"));
    if (rm !== null && rm < 12) penalty += 5;
  }

  // Quantity limits
  if (!["na","n/a","","none"].includes(v("Quantity Limits"))) penalty += 5;

  const raw = Math.max(0, Math.min(100, 100 - penalty));
  if (raw <= 10) return 0;
  if (raw <= 35) return 25;
  if (raw <= 60) return 50;
  if (raw <= 85) return 75;
  return 100;
}

export async function extractFromText(
  policyText: string,
  filename: string,
  brand: string,
  apiKey: string
): Promise<ExtractedRow> {
  const paramInstructions = Object.entries(SCHEMA_PROMPTS)
    .map(([param, prompt]) => `### ${param} ###\n${prompt}`)
    .join("\n\n");

  const systemPrompt = `You are a prior authorization policy extraction specialist.\n\n=== BUSINESS RULES ===\n${BUSINESS_RULES}\n\n=== FEW-SHOT EXAMPLES ===\n${FEW_SHOT}\n\nSCOPE: Extract for Plaque Psoriasis (PsO) ONLY. Do not use PsA, UC, CD criteria.`;

  const userPrompt = `Extract all 12 parameters for ${brand} for Plaque Psoriasis (PsO) only.\n\n=== POLICY TEXT ===\n${policyText.slice(0, 12000)}\n\n=== EXTRACTION INSTRUCTIONS ===\n${paramInstructions}\n\nReturn ONLY valid JSON with these exact keys (no markdown):\n{"Age":"","Step Therapy Requirements Documented in Policy":"","Number of Steps through Brands":"","Number of Steps through Generic":"","Step through-Phototherapy":"","TB Test required":"","Quantity Limits":"","Specialist Types":"","Initial Authorization Duration(in-months)":"","Reauthorization Duration(in-months)":"","Reauthorization Required":"","Reauthorization Requirements Documented in Policy":""}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.filter((b: {type:string}) => b.type === "text").map((b: {text:string}) => b.text).join("") || "";
  const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const start = clean.indexOf("{"); const end = clean.lastIndexOf("}");
  if (start === -1) throw new Error("No JSON in response");
  const parsed = JSON.parse(clean.slice(start, end + 1));

  const row: ExtractedRow = {
    filename, brand,
    Age: parsed.Age || "NA",
    "Step Therapy Requirements Documented in Policy": parsed["Step Therapy Requirements Documented in Policy"] || "NA",
    "Number of Steps through Brands": parsed["Number of Steps through Brands"] || "NA",
    "Number of Steps through Generic": parsed["Number of Steps through Generic"] || "NA",
    "Step through-Phototherapy": parsed["Step through-Phototherapy"] || "NA",
    "TB Test required": parsed["TB Test required"] || "NA",
    "Quantity Limits": parsed["Quantity Limits"] || "NA",
    "Specialist Types": parsed["Specialist Types"] || "NA",
    "Initial Authorization Duration(in-months)": parsed["Initial Authorization Duration(in-months)"] || "NA",
    "Reauthorization Duration(in-months)": parsed["Reauthorization Duration(in-months)"] || "NA",
    "Reauthorization Required": parsed["Reauthorization Required"] || "NA",
    "Reauthorization Requirements Documented in Policy": parsed["Reauthorization Requirements Documented in Policy"] || "NA",
    "Access Score": 0,
  };
  row["Access Score"] = calculateAccessScore(row);
  return row;
}

export function downloadCSV(rows: ExtractedRow[]) {
  const headers = ["Filename","Brand","Age","Step Therapy Requirements Documented in Policy","Number of Steps through Brands","Number of Steps through Generic","Step through-Phototherapy","TB Test required","Quantity Limits","Specialist Types","Initial Authorization Duration(in-months)","Reauthorization Duration(in-months)","Reauthorization Required","Reauthorization Requirements Documented in Policy","Access Score"];
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csvRows = [headers.join(","), ...rows.map(r => headers.map(h => escape((r as Record<string,string|number>)[h] ?? "")).join(","))];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "extraction_results.csv"; a.click();
  URL.revokeObjectURL(url);
}
