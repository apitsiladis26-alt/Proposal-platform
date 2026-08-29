import Link from "next/link";
import { NewProposalForm } from "./NewProposalForm";

export default function NewProposalPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="mb-4 inline-block text-sm text-neutral-500 hover:text-neutral-700"
      >
        ← Back to proposals
      </Link>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-neutral-900">
        Create New Proposal
      </h1>
      <p className="mb-8 text-sm text-neutral-500">
        Fill in the client and price, then describe the project in a paragraph
        or two — Claude will draft the full proposal for you to review.
      </p>
      <NewProposalForm />
    </div>
  );
}
