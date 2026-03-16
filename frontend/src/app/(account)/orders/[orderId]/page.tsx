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
  getWorkspace,
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
      router.replace("/auth/login");
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

  if (loading) return <section><h1 className="text-2xl font-semibold">Order</h1><p className="text-slate-400">Loading…</p></section>;
  if (error && !order) return <section><p className="text-amber-300">{error}</p><Link href="/account/orders">← My orders</Link></section>;
  if (!order) return null;

  const workspace = order.projectWorkspaces?.[0];
  const comments = workspace?.comments ?? [];

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Order {order.orderNumber}</h1>
        <Link href="/account/orders" className="text-sm text-slate-400 hover:text-slate-200">← My orders</Link>
      </div>

      {error && <p className="text-sm text-amber-300">{error}</p>}

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-sm text-slate-400">Status: {order.lifecycleStage} · Payment: {order.paymentState}</p>
      </div>

      {approval && typeof approval === "object" && "status" in approval && (approval as { status: string }).status === "pending" ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <h2 className="font-medium text-amber-200">Approval requested</h2>
          <p className="mt-1 text-sm text-slate-300">Respond to this approval request.</p>
          <textarea
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="mt-2 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            rows={2}
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => handleApprovalResponse(true)}
              disabled={approvalSubmitting}
              className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => handleApprovalResponse(false)}
              disabled={approvalSubmitting}
              className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ) : null}

      {order.timeline && order.timeline.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="font-medium text-slate-200">Progress</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {order.timeline.map((event, i) => (
              <li key={i}>{event.label} — {new Date(event.at).toLocaleString()}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="font-medium text-slate-200">Workspace & comments</h2>
        <ul className="mt-2 space-y-2 text-sm text-slate-300">
          {comments.map((c: { id: string; body: string; authorType: string; createdAt: string }) => (
            <li key={c.id} className="rounded border border-slate-800 p-2">
              {c.body} <span className="text-slate-500">— {c.authorType}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Add a comment"
            className="flex-1 rounded border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
          />
          <button
            type="button"
            onClick={handleAddComment}
            disabled={commentSubmitting || !commentBody.trim()}
            className="rounded bg-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-50"
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
          className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
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
          className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
        >
          Request reprint
        </button>
      </div>
    </section>
  );
}
