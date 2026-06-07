import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canReview } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import { AUDIT_LABELS, type AuditAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

const ACTION_COLOR: Record<string, string> = {
  approved: "var(--grass-deep)",
  requested_changes: "var(--account)",
  disputed: "var(--disputed)",
  undisputed: "var(--text-muted)",
  rolled_back: "var(--record)",
  deleted_entry: "var(--disputed)",
  deleted_event: "var(--disputed)",
  deleted_server: "var(--disputed)",
};

export default async function AuditLogPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/review/log");
  if (!canReview(user)) redirect("/");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <nav className="breadcrumbs">
        <Link href="/review">Review queue</Link> / Activity log
      </nav>
      <h1 className="page-title">Activity log</h1>
      <p className="lede">
        A durable record of every review and moderation action: what happened,
        who did it, and when. Kept even if the underlying entry is later deleted.
      </p>

      {logs.length === 0 ? (
        <div className="empty-state">No actions logged yet.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Target</th>
                <th>Submitted by</th>
                <th>By archivist</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {formatDateTime(l.createdAt)}
                  </td>
                  <td>
                    <strong style={{ color: ACTION_COLOR[l.action] ?? "inherit" }}>
                      {AUDIT_LABELS[l.action as AuditAction] ?? l.action}
                    </strong>
                  </td>
                  <td>
                    {l.targetId && l.targetType === "entry" ? (
                      <Link href={`/entries/${l.targetId}`}>{l.targetName}</Link>
                    ) : (
                      l.targetName
                    )}
                    <span className="muted"> ({l.targetType})</span>
                  </td>
                  <td>{l.authorName ?? "—"}</td>
                  <td>{l.actorName}</td>
                  <td className="muted">{l.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
