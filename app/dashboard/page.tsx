import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DeleteProposalButton } from "@/components/dashboard/DeleteProposalButton";
import type { Proposal } from "@/lib/proposal-schema";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: proposals } = await supabase
    .from("proposals")
    .select()
    .order("created_at", { ascending: false })
    .returns<Proposal[]>();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Proposals
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {proposals?.length ?? 0} total
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          Create New Proposal
        </Link>
      </div>

      {!proposals || proposals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-16 text-center">
          <p className="text-sm text-neutral-500">
            No proposals yet. Create your first one to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <ul className="divide-y divide-neutral-100">
            {proposals.map((proposal) => (
              <li key={proposal.id} className="flex items-center gap-2 px-2 transition hover:bg-neutral-50">
                <Link
                  href={`/dashboard/${proposal.id}`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {proposal.client_name}
                      {proposal.client_company ? ` · ${proposal.client_company}` : ""}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-neutral-500">
                      {proposal.brief}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="text-sm font-medium text-neutral-700">
                      ${Number(proposal.price).toLocaleString()}
                    </span>
                    <StatusBadge status={proposal.status} />
                  </div>
                </Link>
                <DeleteProposalButton id={proposal.id} clientName={proposal.client_name} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
