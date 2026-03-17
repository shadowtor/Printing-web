"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  uploadFiles,
  requestQuoteEstimate,
  createQuote,
  lockQuote,
  type QuoteEstimateResponse,
  type EstimateJobInput
} from "../../../services/api/quote-client";
import {
  addCartLine,
  getSessionId
} from "../../../services/api/checkout-client";

const DEFAULT_JOB: EstimateJobInput = {
  pricingProfileId: "default-pricing-profile",
  materialId: "pla",
  qualityId: "standard",
  toleranceClassId: "general",
  quantity: 1,
  turnaroundProfileId: "standard"
};

export default function QuotePage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteEstimateResponse | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [nextStepMessage, setNextStepMessage] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

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
    setNextStepMessage(null);

    try {
      await uploadFiles(files); // For now we do not send fileKeys to the quote API.

      const job: EstimateJobInput = {
        ...DEFAULT_JOB,
        quantity
      };

      const estimate = await requestQuoteEstimate({
        currency: "AUD",
        jobs: [job]
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
        <h1 className="font-[var(--font-heading)] text-h1 text-white">Instant quote</h1>
        <p className="max-w-2xl text-body text-brand-muted">
          Upload one or more 3D models (STL, OBJ, 3MF, AMF, PLY, WRL, VRML, GLB, GLTF, USD,
          USDZ, USDA, USDC, ZIP) and we&apos;ll estimate price, feasibility, and lead time.
        </p>
      </div>

      <form onSubmit={onSubmit} className="panel space-y-6 p-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-brand-text">
            Upload files
            <input
              type="file"
              multiple
              onChange={onFilesChange}
              className="form-input mt-2 block"
            />
          </label>
          <p className="text-caption text-brand-subtle">
            Supported formats: STL, OBJ, 3MF, AMF, PLY, WRL, VRML, GLB, GLTF, USD, USDZ, USDA,
            USDC, ZIP
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-brand-text">
              Quantity
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value) || 1)}
                className="form-input mt-1 block w-24"
              />
            </label>
          </div>

          <div className="rounded-lg border border-brand-border bg-brand-bg/40 p-3 text-caption text-brand-subtle">
            Material, quality, tolerance, and turnaround are currently fixed to sensible
            defaults. Once admin-configured option catalogs are available, this section will
            render dynamic selectors.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting || !files.length}
            className="btn-primary"
          >
            {submitting ? "Calculating..." : "Get estimate"}
          </button>

          {quote && (
            <>
              <button
                type="button"
                disabled={addingToCart}
                onClick={async () => {
                  setAddingToCart(true);
                  setError(null);
                  setNextStepMessage(null);
                  try {
                    const sessionId = getSessionId();
                    const job: EstimateJobInput = { ...DEFAULT_JOB, quantity };
                    const created = await createQuote({
                      sessionId,
                      currency: quote.currency,
                      jobs: [job]
                    });
                    await lockQuote(created.quoteId);
                    const jobId = created.jobIds[0];
                    if (jobId) {
                      await addCartLine({
                        quoteId: created.quoteId,
                        jobId,
                        quantity
                      });
                      router.push("/cart");
                    } else {
                      setNextStepMessage("No job to add to cart.");
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Add to cart failed");
                  } finally {
                    setAddingToCart(false);
                  }
                }}
                className="btn-secondary border-brand-primary/50 text-brand-text disabled:opacity-50"
              >
                {addingToCart ? "Adding…" : "Add to cart"}
              </button>
              <Link
                href="/checkout"
                className="btn-secondary"
              >
                Continue to checkout
              </Link>
            </>
          )}
        </div>

        {error && <p className="text-sm text-brand-danger">{error}</p>}
        {nextStepMessage && !error && (
          <p className="text-caption text-brand-muted">{nextStepMessage}</p>
        )}
      </form>

      {quote && (
        <div className="panel space-y-3 p-4">
          <h2 className="font-[var(--font-heading)] text-h2 text-brand-accent">Estimate</h2>
          <p className="text-body text-brand-text">
            Total: {quote.totalPrice} {quote.currency}
          </p>
          <ul className="space-y-2 text-sm text-brand-text">
            {quote.jobs.map((job, index) => (
              <li
                key={(job as { id?: string }).id ?? `job-${index}`}
                className="rounded-lg border border-brand-border bg-brand-surfaceSoft p-3"
              >
                <div>Unit price: {job.unitPrice} {quote.currency}</div>
                <div>Line total: {job.totalPrice} {quote.currency}</div>
                <div>Lead time: {job.leadTimeDays} days</div>
                <div>Feasibility: {job.feasibilityStatus}</div>
                {job.materialRecommendations && (
                  <div>Materials: {job.materialRecommendations}</div>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-2 text-caption text-brand-subtle">
            Use &quot;Add to cart&quot; to add this quote to your cart, or continue to checkout.
          </div>
        </div>
      )}
    </section>
  );
}

