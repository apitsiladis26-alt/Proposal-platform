import type { ProposalStatus } from "@/lib/proposal-schema";

const styles: Record<ProposalStatus, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  published: "bg-sky-50 text-sky-700",
  viewed: "bg-amber-50 text-amber-700",
  signed: "bg-violet-50 text-violet-700",
  paid: "bg-accent-soft text-accent-hover",
  archived: "bg-neutral-100 text-neutral-400",
};

const labels: Record<ProposalStatus, string> = {
  draft: "Draft",
  published: "Published",
  viewed: "Viewed",
  signed: "Signed",
  paid: "Paid",
  archived: "Archived",
};

export function StatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
