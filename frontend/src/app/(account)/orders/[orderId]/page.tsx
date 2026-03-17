"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getStoredToken } from "../../../../services/api/auth-client";
import {
  getOrderDetail,
  getApprovalRequest,
  respondToApproval,
  createRevisionRequest,
  createReprintRequest,
  addWorkspaceComment
} from "../../../../services/api/account-client";

type OrderDetail = {
  id: string;
  orderNumber: string;
  lifecycleStage: string;
  paymentState: string;
  timeline?: { at: string; stage: string; label: string; source: string }[];
  approvalRequests?: { id: string; status: string; customerNotes?: string }[];
  revisionRequests?: unknown[];
  reprintRequests?: unknown[];
  projectWorkspaces?: { id: string; comments: { id: string; body: string; authorType: string; createdAt: string }[] }[];
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [approval, setApproval] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    Promise.all([
      getOrderDetail(orderId) as Promise<OrderDetail>,
      getApprovalRequest(orderId)
    ])
      .then(([detail, approvalReq]) => {
        setOrder(detail);
        setApproval(approvalReq);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [orderId, router]);

  async function handleApprovalResponse(approved: boolean) {
    if (!orderId) return;
    setApprovalSubmitting(true);
    setError(null);
    try {
      await respondToApproval(orderId, { approved, customerNotes: approvalNotes });
      setApproval(null);
      const detail = (await getOrderDetail(orderId)) as OrderDetail;
      setOrder(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setApprovalSubmitting(false);
    }
  }

  async function handleAddComment() {
    if (!orderId || !commentBody.trim()) return;
    setCommentSubmitting(true);
    setError(null);
    try {
      await addWorkspaceComment(orderId, { body: commentBody.trim() });
      setCommentBody("");
      const detail = (await getOrderDetail(orderId)) as OrderDetail;
      setOrder(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setCommentSubmitting(false);
    }
  }

  if (loading) return <section><h1 className="font-[var(--font-heading)] text-h1 text-white">Order</h1><p className="text-brand-muted">Loading…</p></section>;
  if (error && !order) return <section><p className="text-red-200">{error}</p><Link href="/orders" className="btn-secondary">My orders</Link></section>;
  if (!order) return null;

  const workspace = order.projectWorkspaces?.[0];
  const comments = workspace?.comments ?? [];

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-[var(--font-heading)] text-h1 text-white">Order {order.orderNumber}</h1>
        <Link href="/orders" className="btn-secondary">My orders</Link>
      </div>

      {error && <p className="text-sm text-red-200">{error}</p>}

      <div className="panel p-4">
        <p className="text-sm text-brand-muted">Status: {order.lifecycleStage} · Payment: {order.paymentState}</p>
      </div>

      {approval && typeof approval === "object" && "status" in approval && (approval as { status: string }).status === "pending" ? (
        <div className="rounded-panel border border-brand-accent/40 bg-brand-accent/10 p-4">
          <h2 className="font-medium text-brand-accent">Approval requested</h2>
          <p className="mt-1 text-sm text-brand-muted">Respond to this approval request.</p>
          <textarea
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="form-input mt-2"
            rows={2}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => handleApprovalResponse(true)}
              disabled={approvalSubmitting}
              className="btn-primary disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => handleApprovalResponse(false)}
              disabled={approvalSubmitting}
              className="btn-secondary disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ) : null}

      {order.timeline && order.timeline.length > 0 && (
        <div className="panel p-4">
          <h2 className="font-medium text-brand-text">Progress</h2>
          <ul className="mt-2 space-y-1 text-sm text-brand-muted">
            {order.timeline.map((event, i) => (
              <li key={i}>{event.label} — {new Date(event.at).toLocaleString()}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel-soft p-4">
        <h2 className="font-medium text-brand-text">Workspace & comments</h2>
        <ul className="mt-2 space-y-2 text-sm text-brand-muted">
          {comments.map((c: { id: string; body: string; authorType: string; createdAt: string }) => (
            <li key={c.id} className="rounded-lg border border-brand-border p-2">
              {c.body} <span className="text-brand-subtle">— {c.authorType}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Add a comment"
            className="form-input flex-1"
          />
          <button
            type="button"
            onClick={handleAddComment}
            disabled={commentSubmitting || !commentBody.trim()}
            className="btn-secondary disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={async () => {
            try {
              await createRevisionRequest(orderId, { customerNotes: "Requesting revision" });
              const detail = (await getOrderDetail(orderId)) as OrderDetail;
              setOrder(detail);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed");
            }
          }}
          className="btn-secondary"
        >
          Request revision
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              await createReprintRequest(orderId, { customerNotes: "Requesting reprint" });
              const detail = (await getOrderDetail(orderId)) as OrderDetail;
              setOrder(detail);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed");
            }
          }}
          className="btn-secondary"
        >
          Request reprint
        </button>
      </div>
    </section>
  );
}
