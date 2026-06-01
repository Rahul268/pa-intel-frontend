"use client";

export interface ExtractedRow {
  Filename: string;
  Brand: string;
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
  "Access Score": number | string;
}

/**
 * Call the FastAPI backend to run the full pipeline:
 * parse → chunk → retrieve → context-reduce → extract → validate → normalise → score
 *
 * @param file     The PDF file to extract from
 * @param brand    Brand name (e.g. "TREMFYA")
 * @param apiUrl   Backend URL (e.g. "https://pa-intel-api.onrender.com")
 */
export async function extractFromBackend(
  file: File,
  brand: string,
  apiUrl: string
): Promise<ExtractedRow> {
  const url = `${apiUrl.replace(/\/$/, "")}/api/extract`;

  const form = new FormData();
  form.append("file", file);
  form.append("brand", brand);

  const response = await fetch(url, {
    method: "POST",
    body: form,
    // No Content-Type header — browser sets it automatically with the boundary
  });

  if (!response.ok) {
    let detail = `Backend returned ${response.status}`;
    try {
      const err = await response.json();
      detail = err.detail || detail;
    } catch {
      // ignore JSON parse error on error response
    }
    throw new Error(detail);
  }

  const data: Record<string, string | number> = await response.json();

  return {
    Filename: String(data.Filename ?? file.name),
    Brand: String(data.Brand ?? brand),
    Age: String(data.Age ?? "NA"),
    "Step Therapy Requirements Documented in Policy": String(
      data["Step Therapy Requirements Documented in Policy"] ?? "NA"
    ),
    "Number of Steps through Brands": String(
      data["Number of Steps through Brands"] ?? "NA"
    ),
    "Number of Steps through Generic": String(
      data["Number of Steps through Generic"] ?? "NA"
    ),
    "Step through-Phototherapy": String(
      data["Step through-Phototherapy"] ?? "NA"
    ),
    "TB Test required": String(data["TB Test required"] ?? "NA"),
    "Quantity Limits": String(data["Quantity Limits"] ?? "NA"),
    "Specialist Types": String(data["Specialist Types"] ?? "NA"),
    "Initial Authorization Duration(in-months)": String(
      data["Initial Authorization Duration(in-months)"] ?? "NA"
    ),
    "Reauthorization Duration(in-months)": String(
      data["Reauthorization Duration(in-months)"] ?? "NA"
    ),
    "Reauthorization Required": String(data["Reauthorization Required"] ?? "NA"),
    "Reauthorization Requirements Documented in Policy": String(
      data["Reauthorization Requirements Documented in Policy"] ?? "NA"
    ),
    "Access Score": Number(data["Access Score"] ?? 0),
  };
}

export function downloadCSV(rows: ExtractedRow[]) {
  const headers: (keyof ExtractedRow)[] = [
    "Filename", "Brand", "Age",
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
    "Access Score",
  ];
  const esc = (v: string | number) =>
    `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "extraction_results.csv";
  a.click();
  URL.revokeObjectURL(url);
}
