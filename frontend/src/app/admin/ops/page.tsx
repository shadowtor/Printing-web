"use client";

import { useEffect, useState } from "react";
import {
  adminGetOpsEnv,
  adminTriggerBackup,
  type AdminOpsEnv
} from "../../../services/api/admin-client";

export default function AdminOpsPage() {
  const [env, setEnv] = useState<AdminOpsEnv | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  useEffect(() => {
    adminGetOpsEnv()
      .then(setEnv)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  async function handleBackup() {
    setBackupMessage(null);
    try {
      const result = await adminTriggerBackup();
      setBackupMessage(result.message ?? (result.accepted ? "Accepted." : "Failed."));
    } catch (e) {
      setBackupMessage(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Ops</h1>
      {error && <p className="text-amber-300">{error}</p>}
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-4">
        <h2 className="font-medium text-slate-200">Environment</h2>
        {env ? (
          <>
            <p className="text-sm">
              Valid: <span className={env.valid ? "text-emerald-400" : "text-amber-400"}>{String(env.valid)}</span>
            </p>
            {env.missing.length > 0 && (
              <p className="text-sm text-amber-300">Missing: {env.missing.join(", ")}</p>
            )}
            <p className="text-sm text-slate-400">Present: {env.present.join(", ") || "—"}</p>
          </>
        ) : (
          <p className="text-slate-400">Loading…</p>
        )}
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-4">
        <h2 className="font-medium text-slate-200">Backup</h2>
        <button
          type="button"
          onClick={handleBackup}
          className="rounded bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-600"
        >
          Trigger backup (stub)
        </button>
        {backupMessage && <p className="text-sm text-slate-400">{backupMessage}</p>}
      </div>
    </section>
  );
}
