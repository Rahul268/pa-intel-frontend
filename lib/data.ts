export interface Submission {
  filename: string; brand: string; payer: string;
  payerType: "Commercial" | "State Medicaid" | "PBM" | "Unknown";
  age: string; stepTherapy: string; brandedSteps: string; genericSteps: string;
  phototherapy: string; tbTest: string; quantityLimits: string;
  specialistTypes: string; initAuthDuration: string; reauthDuration: string;
  reauthRequired: string; reauthRequirements: string; accessScore: number;
}

export const submissions: Submission[] = [
  { filename:"176207-4867884.pdf", brand:"TREMFYA", payer:"Aetna", payerType:"Commercial", age:">=18", brandedSteps:"1", genericSteps:"1", phototherapy:"No", tbTest:"Yes", quantityLimits:"NA", specialistTypes:"Dermatologist", initAuthDuration:"12 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Previously received a biologic or targeted synthetic drug. OR: Crucial body areas affected; ≥10% BSA; ≥3% BSA + inadequate response to phototherapy/MTX.", reauthRequirements:"Positive clinical response: reduction in BSA from baseline OR improvement in signs and symptoms.", accessScore:75 },
  { filename:"282478-5009832.pdf", brand:"TREMFYA", payer:"BlueCross BlueShield", payerType:"Commercial", age:">=18", brandedSteps:"1", genericSteps:"1", phototherapy:"No", tbTest:"No", quantityLimits:"NA", specialistTypes:"Dermatologist", initAuthDuration:"6 Months", reauthDuration:"Unspecified", reauthRequired:"Yes", stepTherapy:"FDA-approved for plaque psoriasis; OR inadequate response to 3-month trial of: topical+systemic OR phototherapy+systemic.", reauthRequirements:"Positive response to therapy; OR clinical justification to continue therapy.", accessScore:75 },
  { filename:"325611-4784675.pdf", brand:"TREMFYA", payer:"Unknown Payer", payerType:"Unknown", age:"NA", brandedSteps:"NA", genericSteps:"NA", phototherapy:"NA", tbTest:"NA", quantityLimits:"NA", specialistTypes:"NA", initAuthDuration:"NA", reauthDuration:"NA", reauthRequired:"NA", stepTherapy:"NA", reauthRequirements:"NA", accessScore:0 },
  { filename:"361486-4654549.pdf", brand:"TREMFYA", payer:"Alaska Medicaid", payerType:"State Medicaid", age:"FDA labelled age", brandedSteps:"1", genericSteps:"1", phototherapy:"No", tbTest:"Yes", quantityLimits:"NA", specialistTypes:"NA", initAuthDuration:"3 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"PsO: Tried and failed TNF blocker AND at least one topical. PsA: Tried and failed TNF blocker AND at least one other therapy.", reauthRequirements:"Improvement in clinical response per indication-specific criteria.", accessScore:25 },
  { filename:"410022-5112345.pdf", brand:"TREMFYA", payer:"Cigna", payerType:"Commercial", age:">=18", brandedSteps:"1", genericSteps:"NA", phototherapy:"No", tbTest:"Yes", quantityLimits:"NA", specialistTypes:"Dermatologist", initAuthDuration:"12 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Previously received a biologic or targeted synthetic drug indicated for moderate-to-severe plaque psoriasis.", reauthRequirements:"Physician attestation of continued clinical benefit and medical necessity.", accessScore:75 },
  { filename:"419033-5229876.pdf", brand:"TREMFYA", payer:"UnitedHealthcare", payerType:"Commercial", age:">=18", brandedSteps:"1", genericSteps:"1", phototherapy:"No", tbTest:"Yes", quantityLimits:"NA", specialistTypes:"Dermatologist", initAuthDuration:"12 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Trial and failure of a biologic AND at least one conventional systemic (MTX, cyclosporine, or acitretin).", reauthRequirements:"≥75% reduction in PASI score OR physician-documented clinical benefit.", accessScore:75 },
  { filename:"433014-5341022.pdf", brand:"TREMFYA", payer:"Humana", payerType:"Commercial", age:">=18", brandedSteps:"2", genericSteps:"1", phototherapy:"No", tbTest:"Yes", quantityLimits:"NA", specialistTypes:"Dermatologist", initAuthDuration:"6 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Failed two biologics AND one conventional systemic therapy.", reauthRequirements:"Reduction in BSA affected from baseline; improvement in PASI or PGA score.", accessScore:50 },
  { filename:"445099-5467812.pdf", brand:"TREMFYA", payer:"Oregon Medicaid", payerType:"State Medicaid", age:">=18", brandedSteps:"1", genericSteps:"2", phototherapy:"Yes", tbTest:"Yes", quantityLimits:"NA", specialistTypes:"Dermatologist", initAuthDuration:"6 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Topical therapy; AND phototherapy (UVB/PUVA); AND conventional systemic; AND a prior biologic.", reauthRequirements:"Continued positive clinical response documented by prescribing dermatologist.", accessScore:25 },
  { filename:"459012-5589312.pdf", brand:"TREMFYA", payer:"CVS Caremark", payerType:"PBM", age:">=18", brandedSteps:"1", genericSteps:"NA", phototherapy:"No", tbTest:"Yes", quantityLimits:"NA", specialistTypes:"NA", initAuthDuration:"12 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Documented inadequate response or intolerance to at least one biologic approved for plaque psoriasis.", reauthRequirements:"Prescriber attestation of clinical benefit and continued medical necessity.", accessScore:75 },
  { filename:"472345-5701234.pdf", brand:"STELARA", payer:"Aetna", payerType:"Commercial", age:">=6", brandedSteps:"1", genericSteps:"1", phototherapy:"No", tbTest:"Yes", quantityLimits:"Stelara 45mg/0.5mL: 1 syringe per 84 days", specialistTypes:"Dermatologist", initAuthDuration:"6 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Previously received a biologic or targeted synthetic drug; OR: ≥3% BSA + inadequate response to phototherapy or MTX/CsA/acitretin.", reauthRequirements:"Reduction in BSA from baseline OR improvement in signs/symptoms.", accessScore:75 },
  { filename:"485678-5823456.pdf", brand:"STELARA", payer:"Oregon Medicaid", payerType:"State Medicaid", age:">=6", brandedSteps:"1", genericSteps:"2", phototherapy:"Yes", tbTest:"Yes", quantityLimits:"Stelara 45mg: 1 syringe/84 days; Exception: 2/28 days", specialistTypes:"Dermatologist", initAuthDuration:"6 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Failed Yesintek; AND: topical; AND phototherapy; AND conventional systemic; AND a biologic.", reauthRequirements:"Reduction in BSA from baseline OR improvement in pruritus and skin inflammation.", accessScore:25 },
  { filename:"498901-5945678.pdf", brand:"STELARA", payer:"UnitedHealthcare", payerType:"Commercial", age:">=6", brandedSteps:"1", genericSteps:"1", phototherapy:"No", tbTest:"Yes", quantityLimits:"NA", specialistTypes:"Dermatologist or Rheumatologist", initAuthDuration:"12 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Trial and failure of at least one biologic AND one conventional systemic.", reauthRequirements:"≥50% improvement in PASI or physician-documented clinical improvement.", accessScore:75 },
  { filename:"512234-6067890.pdf", brand:"STELARA", payer:"Humana", payerType:"Commercial", age:">=6", brandedSteps:"2", genericSteps:"1", phototherapy:"No", tbTest:"Yes", quantityLimits:"NA", specialistTypes:"Dermatologist", initAuthDuration:"6 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Failed two biologics AND conventional systemic therapy for moderate-to-severe plaque psoriasis.", reauthRequirements:"Documented clinical improvement; PASI reduction ≥75%.", accessScore:50 },
  { filename:"525567-6190123.pdf", brand:"STELARA", payer:"Cigna", payerType:"Commercial", age:">=6", brandedSteps:"1", genericSteps:"NA", phototherapy:"No", tbTest:"Yes", quantityLimits:"NA", specialistTypes:"Dermatologist", initAuthDuration:"12 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Previously received a biologic or targeted synthetic drug.", reauthRequirements:"Prescriber attestation of positive clinical response.", accessScore:75 },
  { filename:"538900-6312456.pdf", brand:"TREMFYA", payer:"NJ Medicaid", payerType:"State Medicaid", age:">=18", brandedSteps:"1", genericSteps:"1", phototherapy:"No", tbTest:"Yes", quantityLimits:"NA", specialistTypes:"Dermatologist", initAuthDuration:"3 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Tried and failed a TNF blocker AND at least one topical agent.", reauthRequirements:"Improvement in PASI score ≥50% from baseline; dermatologist documentation.", accessScore:25 },
  { filename:"552134-6434789.pdf", brand:"TREMFYA", payer:"Express Scripts", payerType:"PBM", age:">=18", brandedSteps:"1", genericSteps:"NA", phototherapy:"No", tbTest:"No", quantityLimits:"NA", specialistTypes:"NA", initAuthDuration:"12 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Documented failure of at least one biologic indicated for moderate-to-severe plaque psoriasis.", reauthRequirements:"Documented continued response; renewal approved if no evidence of treatment failure.", accessScore:100 },
  { filename:"565467-6557112.pdf", brand:"TREMFYA", payer:"Prime Therapeutics", payerType:"PBM", age:">=18", brandedSteps:"1", genericSteps:"NA", phototherapy:"No", tbTest:"Yes", quantityLimits:"NA", specialistTypes:"NA", initAuthDuration:"12 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Prior trial and inadequate response to a biologic or targeted synthetic drug for plaque psoriasis.", reauthRequirements:"Physician attestation of clinical benefit; continued medical necessity.", accessScore:100 },
  { filename:"578801-6679445.pdf", brand:"STELARA", payer:"Texas Medicaid", payerType:"State Medicaid", age:">=6", brandedSteps:"1", genericSteps:"2", phototherapy:"Yes", tbTest:"Yes", quantityLimits:"NA", specialistTypes:"NA", initAuthDuration:"3 Months", reauthDuration:"6 Months", reauthRequired:"Yes", stepTherapy:"Topical corticosteroid; AND phototherapy (UVB/PUVA); AND systemic agent (MTX/cyclosporine/acitretin); AND a prior biologic.", reauthRequirements:"Documented positive clinical response; reduced PASI score or BSA improvement.", accessScore:0 },
  { filename:"592135-6801778.pdf", brand:"TREMFYA", payer:"Wellmark BCBS", payerType:"Commercial", age:">=18", brandedSteps:"1", genericSteps:"1", phototherapy:"No", tbTest:"Yes", quantityLimits:"NA", specialistTypes:"Dermatologist", initAuthDuration:"12 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Prior biologic for plaque psoriasis AND inadequate response to at least one conventional systemic.", reauthRequirements:"Low disease activity or improvement in signs and symptoms from baseline.", accessScore:75 },
  { filename:"605469-6924111.pdf", brand:"STELARA", payer:"Anthem", payerType:"Commercial", age:">=6", brandedSteps:"1", genericSteps:"1", phototherapy:"No", tbTest:"Yes", quantityLimits:"Stelara 90mg SC: 1 syringe per 84 days", specialistTypes:"Dermatologist", initAuthDuration:"12 Months", reauthDuration:"12 Months", reauthRequired:"Yes", stepTherapy:"Documented trial and failure of a biologic AND conventional systemic for moderate-to-severe PsO.", reauthRequirements:"Physician attestation of PASI improvement ≥50% or BSA reduction from baseline.", accessScore:75 },
];

export function getScoreDistribution() {
  const b: Record<number,number> = {0:0,25:0,50:0,75:0,100:0};
  submissions.forEach(s => { b[s.accessScore] = (b[s.accessScore]||0)+1; });
  return Object.entries(b).map(([score,count])=>({ score:Number(score), count, label:scoreLabel(Number(score)) }));
}
export function scoreLabel(s: number) {
  if (s===0) return "Restricted"; if (s===25) return "Highly Restricted";
  if (s===50) return "Moderate"; if (s===75) return "Standard Access"; return "Open Access";
}
export function getBrandBreakdown() {
  const m: Record<string,{count:number;total:number}> = {};
  submissions.forEach(s => { if (!m[s.brand]) m[s.brand]={count:0,total:0}; m[s.brand].count++; m[s.brand].total+=s.accessScore; });
  return Object.entries(m).map(([brand,d])=>({ brand, count:d.count, avgScore:Math.round(d.total/d.count) }));
}
export function getPayerTypeBreakdown() {
  const m: Record<string,{count:number;total:number}> = {};
  submissions.forEach(s => { if (!m[s.payerType]) m[s.payerType]={count:0,total:0}; m[s.payerType].count++; m[s.payerType].total+=s.accessScore; });
  return Object.entries(m).map(([type,d])=>({ type, count:d.count, avgScore:Math.round(d.total/d.count) }));
}
export function getParameterStats() {
  const n = submissions.length;
  const has = (v:string) => v && v!=="NA" && v!=="N/A" && v!=="";
  return [
    { param:"Age Restriction",       pct:Math.round(submissions.filter(s=>has(s.age)&&s.age!=="NA").length/n*100) },
    { param:"Branded Steps",         pct:Math.round(submissions.filter(s=>has(s.brandedSteps)).length/n*100) },
    { param:"Generic Steps",         pct:Math.round(submissions.filter(s=>has(s.genericSteps)).length/n*100) },
    { param:"Phototherapy Required", pct:Math.round(submissions.filter(s=>s.phototherapy==="Yes").length/n*100) },
    { param:"TB Test Required",      pct:Math.round(submissions.filter(s=>s.tbTest==="Yes").length/n*100) },
    { param:"Quantity Limits",       pct:Math.round(submissions.filter(s=>has(s.quantityLimits)).length/n*100) },
    { param:"Specialist Required",   pct:Math.round(submissions.filter(s=>has(s.specialistTypes)).length/n*100) },
    { param:"Reauth Required",       pct:Math.round(submissions.filter(s=>s.reauthRequired==="Yes").length/n*100) },
  ];
}
export function getStepTherapyMatrix() {
  const m: Record<string,number> = {};
  submissions.forEach(s => {
    const b = (s.brandedSteps==="NA"||!s.brandedSteps)?"0":s.brandedSteps;
    const g = (s.genericSteps==="NA"||!s.genericSteps)?"0":s.genericSteps;
    const k = `${b}B + ${g}G`; m[k]=(m[k]||0)+1;
  });
  return Object.entries(m).map(([key,count])=>({key,count})).sort((a,b)=>b.count-a.count);
}
export const SCORE_COLORS: Record<number,string> = { 0:"#C0180C", 25:"#B45309", 50:"#92630A", 75:"#0A7A45", 100:"#008C7E" };
export const SCORE_BG:     Record<number,string> = { 0:"#FEF0EF", 25:"#FEF4E6", 50:"#FEFBE6", 75:"#E9F9F1", 100:"#E6F6F4" };
export const PAYER_COLORS: Record<string,string> = { "Commercial":"#0066CC","State Medicaid":"#7C3AED","PBM":"#059669","Unknown":"#9CA3AF" };
