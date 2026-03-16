"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  uploadFiles,
  requestQuoteEstimate,
  type QuoteEstimateResponse
} from "../../../services/api/quote-client";

export default function QuotePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteEstimateResponse | null>(null);

  function onFilesChange(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) return;
    setFiles(Array.from(event.target.files));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!files.length) return;
    setSubmitting(true);
    setError(null);
    setQuote(null);

    try {
      const fileKeys = await uploadFiles(files);
      const estimate = await requestQuoteEstimate({
        fileKeys,
        options: {
          materialId: "pla",
          qualityId: "standard",
          toleranceClassId: "general",
          quantity: 1,
          turnaroundProfileId: "standard"
        }
      });
      setQuote(estimate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quote failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Instant quote</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Upload one or more 3D models (STL, OBJ, 3MF, AMF, PLY, WRL, VRML, GLB, GLTF, USD,
          USDZ, USDA, USDC, ZIP) and we&apos;ll estimate price, feasibility, and lead time.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-100">
            Upload files
            <input
              type="file"
              multiple
              onChange={onFilesChange}
              className="mt-2 block w-full text-sm text-slate-200"
            />
          </label>
          <p className="text-xs text-slate-400">
            Supported formats: STL, OBJ, 3MF, AMF, PLY, WRL, VRML, GLB, GLTF, USD, USDZ, USDA,
            USDC, ZIP
          </p>
        </div>

        {/* Placeholder for material/quality/tolerance/turnaround selectors */}
        <div className="rounded border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
          Material, quality, tolerance, quantity, and turnaround configuration UI will be
          wired here once option catalogs are implemented. For now, defaults are used.
        </div>

        <button
          type="submit"
          disabled={submitting || !files.length}
          className="inline-flex items-center rounded bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-800"
        >
          {submitting ? "Calculating..." : "Get estimate"}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>

      {quote && (
        <div className="space-y-3 rounded-lg border border-emerald-400/40 bg-slate-900/60 p-4">
          <h2 className="text-lg font-medium text-emerald-300">Estimate</h2>
          <p className="text-sm text-slate-200">
            Total: {quote.totalPrice} {quote.currency}
          </p>
          <ul className="space-y-2 text-sm text-slate-200">
            {quote.jobs.map((job) => (
              <li key={job.jobId} className="rounded border border-slate-800 bg-slate-900/40 p-2">
                <div>Job: {job.jobId}</div>
                <div>Unit price: {job.unitPrice} {quote.currency}</div>
                {job.leadTimeDays !== undefined && (
                  <div>Lead time: {job.leadTimeDays} days</div>
                )}
                {job.feasibility && <div>Feasibility: {job.feasibility}</div>}
                {job.materialRecommendations && (
                  <div>Materials: {job.materialRecommendations}</div>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-2 text-xs text-slate-400">
            Add-to-cart and account flows will be wired next; this page focuses on the instant
            quote experience.
          </div>
        </div>
      )}
    </section>
  );
}

