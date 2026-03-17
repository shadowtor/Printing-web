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
      <h1 className="font-[var(--font-heading)] text-h1 text-white">Ops</h1>
      {error && <p className="text-red-200">{error}</p>}
      <div className="panel space-y-4 p-4">
        <h2 className="font-medium text-brand-text">Environment</h2>
        {env ? (
          <>
            <p className="text-sm">
              Valid: <span className={env.valid ? "text-brand-accent" : "text-red-200"}>{String(env.valid)}</span>
            </p>
            {env.missing.length > 0 && (
              <p className="text-sm text-red-200">Missing: {env.missing.join(", ")}</p>
            )}
            <p className="text-sm text-brand-muted">Present: {env.present.join(", ") || "—"}</p>
          </>
        ) : (
          <p className="text-brand-muted">Loading…</p>
        )}
      </div>
      <div className="panel-soft space-y-4 p-4">
        <h2 className="font-medium text-brand-text">Backup</h2>
        <button
          type="button"
          onClick={handleBackup}
          className="btn-secondary"
        >
          Trigger backup (stub)
        </button>
        {backupMessage && <p className="text-sm text-brand-muted">{backupMessage}</p>}
      </div>
    </section>
  );
}
