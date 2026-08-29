import type { AiContent, TeamMember, Testimonial } from "@/lib/proposal-schema";

export interface ProposalDocumentProps {
  companyName: string;
  logoUrl?: string | null;
  clientName: string;
  clientCompany?: string | null;
  content: AiContent;
  teamMembers: TeamMember[];
  testimonials: Testimonial[];
  price: number;
  currency: string;
  /** Interactive sign/pay UI on the public page; omitted (or a static
   *  placeholder) in the owner-only dashboard preview. */
  agreementSlot?: React.ReactNode;
}

const SECTIONS = [
  "Greeting",
  "Why Us",
  "What to Expect",
  "Timing",
  "Meet the Team",
  "Testimonials",
  "Scope of Work",
  "Investment",
  "Agreement",
];

export function ProposalDocument({
  companyName,
  clientName,
  clientCompany,
  content,
  teamMembers,
  testimonials,
  price,
  currency,
  agreementSlot,
}: ProposalDocumentProps) {
  const company = companyName || "Our Company";

  return (
    <div className="bg-[#fdf5f1] text-[#171717]">
      {/* Cover */}
      <section className="flex min-h-[70vh] flex-col justify-between px-8 py-16 sm:px-16">
        <div className="text-sm font-medium tracking-wide text-[#171717]/60">
          {company}
        </div>
        <div>
          <h1 className="max-w-2xl text-5xl font-black leading-tight tracking-tight sm:text-6xl">
            Proposal for {clientCompany || clientName}
          </h1>
        </div>
        <div className="flex flex-col gap-8 text-sm sm:flex-row sm:gap-24">
          <div>
            <p className="mb-1 font-semibold text-[#171717]/50">Prepared for</p>
            <p className="font-medium">{clientName}</p>
            {clientCompany && <p className="text-[#171717]/70">{clientCompany}</p>}
          </div>
          <div>
            <p className="mb-1 font-semibold text-[#171717]/50">Prepared by</p>
            <p className="font-medium">{company}</p>
          </div>
        </div>
      </section>

      {/* Table of contents */}
      <Section tint="#ffffff">
        <SectionHeading>Table of contents</SectionHeading>
        <ol className="mt-8 max-w-md space-y-4">
          {SECTIONS.map((s, i) => (
            <li key={s} className="flex items-center gap-4 text-lg">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-200 text-sm font-semibold text-sky-900">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </Section>

      {/* Greeting */}
      <Section tint="#f5d949" light>
        <SectionHeading>Greetings from {company}</SectionHeading>
        <p className="mt-6 max-w-2xl whitespace-pre-line text-lg leading-relaxed">
          {content.greeting}
        </p>
      </Section>

      {/* Value proposition */}
      <Section tint="#ffffff">
        <SectionHeading>Why {company}</SectionHeading>
        <p className="mt-6 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-[#171717]/80">
          {content.valueProposition}
        </p>
      </Section>

      {/* What to expect / process */}
      <Section tint="#2f7a6c" dark>
        <SectionHeading dark>What to Expect</SectionHeading>
        <div className="mt-8 divide-y divide-white/15">
          {content.processOverview.map((phase) => (
            <div key={phase.phase} className="grid gap-2 py-6 sm:grid-cols-[240px_1fr]">
              <h3 className="text-xl font-bold">{phase.phase}</h3>
              <p className="text-white/85">{phase.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Timing */}
      <Section tint="#ffffff">
        <SectionHeading>Timing</SectionHeading>
        <div className="mt-8 max-w-xl overflow-hidden rounded-2xl border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-5 py-3 font-semibold">Process</th>
                <th className="px-5 py-3 font-semibold">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {content.timingTable.map((row) => (
                <tr key={row.phase} className="border-b border-neutral-100 last:border-0">
                  <td className="px-5 py-3">{row.phase}</td>
                  <td className="px-5 py-3 text-neutral-600">{row.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Team */}
      {teamMembers.length > 0 && (
        <Section tint="#f9fafb">
          <SectionHeading>Meet the Team</SectionHeading>
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex gap-4">
                {member.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.photo_url}
                    alt={member.name}
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-pink-200 text-lg font-semibold text-pink-900">
                    {member.name.slice(0, 1)}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{member.name}</p>
                  {member.position && (
                    <p className="text-sm text-neutral-500">{member.position}</p>
                  )}
                  {member.bio && (
                    <p className="mt-1 text-sm text-neutral-600">{member.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <Section tint="#ffffff">
          <SectionHeading>Client Testimonials</SectionHeading>
          <div className="mt-8 space-y-8">
            {testimonials.map((t) => (
              <div key={t.id} className="border-l-4 border-sky-300 pl-6">
                <p className="font-semibold">
                  {t.client_name}
                  {t.client_role || t.client_company
                    ? ` — ${[t.client_role, t.client_company].filter(Boolean).join(", ")}`
                    : ""}
                </p>
                <p className="mt-2 max-w-2xl italic text-neutral-600">&ldquo;{t.quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Scope of work */}
      <Section tint="#f9fafb">
        <SectionHeading>Scope of Work</SectionHeading>
        <p className="mt-6 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-[#171717]/80">
          {content.scopeOfWork}
        </p>
      </Section>

      {/* Investment / pricing */}
      <Section tint="#171717" dark>
        <SectionHeading dark>Investment</SectionHeading>
        <div className="mt-8 flex items-baseline gap-3">
          <span className="text-6xl font-black">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: currency.toUpperCase(),
              maximumFractionDigits: 0,
            }).format(price)}
          </span>
          <span className="text-white/60">total, due on signing</span>
        </div>
      </Section>

      {/* Agreement */}
      <Section tint="#ffffff">
        <SectionHeading>Agreement</SectionHeading>
        <p className="mt-6 max-w-2xl text-neutral-600">
          By signing below, you agree to accept this proposal and its terms.
          Any confidential information shared between the parties during this
          engagement will be kept strictly private.
        </p>
        <div className="mt-10">{agreementSlot}</div>
      </Section>
    </div>
  );
}

function Section({
  tint,
  dark,
  light,
  children,
}: {
  tint: string;
  dark?: boolean;
  light?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{ backgroundColor: tint }}
      className={`px-8 py-20 sm:px-16 ${dark ? "text-white" : light ? "text-[#171717]" : ""}`}
    >
      <div className="mx-auto max-w-4xl">{children}</div>
    </section>
  );
}

function SectionHeading({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <h2
      className={`text-4xl font-black tracking-tight sm:text-5xl ${dark ? "text-white" : "text-[#171717]"}`}
    >
      {children}
    </h2>
  );
}
