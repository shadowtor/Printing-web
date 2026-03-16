export interface QuoteOptions {
  materialId: string;
  qualityId: string;
  toleranceClassId: string;
  quantity: number;
  turnaroundProfileId: string;
}

export interface QuoteEstimateJob {
  jobId: string;
  unitPrice: number;
  feasibility?: string;
  leadTimeDays?: number;
  materialRecommendations?: string;
}

export interface QuoteEstimateResponse {
  quoteId: string;
  jobs: QuoteEstimateJob[];
  totalPrice: number;
  currency: string;
  validUntil?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api/v1";

export async function uploadFiles(files: File[]): Promise<string[]> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: form
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = (await res.json()) as { fileKeys: string[] };
  return data.fileKeys;
}

export async function requestQuoteEstimate(params: {
  fileKeys: string[];
  options: QuoteOptions;
}): Promise<QuoteEstimateResponse> {
  const res = await fetch(`${API_BASE}/quote/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileKeys: params.fileKeys,
      options: params.options
    })
  });

  if (!res.ok) {
    throw new Error("Quote estimate failed");
  }

  return (await res.json()) as QuoteEstimateResponse;
}

