export interface EstimateJobInput {
  pricingProfileId: string;
  materialId?: string;
  qualityId?: string;
  toleranceClassId?: string;
  quantity: number;
  turnaroundProfileId?: string;
}

export interface QuoteEstimateJob {
  unitPrice: number;
  totalPrice: number;
  feasibilityStatus: string;
  leadTimeDays: number;
  materialRecommendations: string | null;
  ruleId: string;
}

export interface QuoteEstimateResponse {
  jobs: QuoteEstimateJob[];
  totalPrice: number;
  currency: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api/v1";

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function uploadFiles(files: File[]): Promise<string[]> {
  const fileKeys: string[] = [];

  for (const file of files) {
    const contentBase64 = await fileToBase64(file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentBase64
      })
    });

    if (!res.ok) {
      throw new Error("Upload failed");
    }

    const data = (await res.json()) as { fileKey: string };
    fileKeys.push(data.fileKey);
  }

  return fileKeys;
}

export async function requestQuoteEstimate(params: {
  currency: string;
  jobs: EstimateJobInput[];
}): Promise<QuoteEstimateResponse> {
  const res = await fetch(`${API_BASE}/quote/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      currency: params.currency,
      jobs: params.jobs
    })
  });

  if (!res.ok) {
    throw new Error("Quote estimate failed");
  }

  return (await res.json()) as QuoteEstimateResponse;
}

