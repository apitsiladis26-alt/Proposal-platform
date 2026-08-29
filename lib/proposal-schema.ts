import { z } from "zod";

/**
 * Project-specific proposal sections. Team bios, testimonials, and pricing
 * are NOT here — they're static (sender_profile/team_members/testimonials)
 * or a plain user-set number (proposals.price), never AI output.
 */
export const aiContentSchema = z.object({
  greeting: z
    .string()
    .describe(
      "A short, warm, personal 'Dear {client}' letter introducing the sender and the engagement — 2-4 sentences.",
    ),
  valueProposition: z
    .string()
    .describe(
      "A 'why us' pitch adapted to the specific service/product in the brief — 2-3 short paragraphs.",
    ),
  processOverview: z
    .array(
      z.object({
        phase: z.string().describe("Short phase name, e.g. 'Discovery & Research'"),
        description: z.string().describe("2-4 sentences describing this phase."),
      }),
    )
    .min(2)
    .max(5),
  timingTable: z
    .array(
      z.object({
        phase: z.string().describe("Short phase name matching the process overview where relevant."),
        duration: z.string().describe("e.g. '2-3 weeks', '1 week'"),
      }),
    )
    .min(2)
    .max(6),
  scopeOfWork: z
    .string()
    .describe(
      "What's included in the engagement, in concrete terms — 2-3 short paragraphs or a tight bulleted-style description.",
    ),
});

export type AiContent = z.infer<typeof aiContentSchema>;

export const proposalStatuses = [
  "draft",
  "published",
  "viewed",
  "signed",
  "paid",
  "archived",
] as const;
export type ProposalStatus = (typeof proposalStatuses)[number];

export interface Proposal {
  id: string;
  slug: string | null;
  client_name: string;
  client_company: string | null;
  client_email: string | null;
  client_phone: string | null;
  brief: string;
  price: number;
  currency: string;
  status: ProposalStatus;
  ai_content: AiContent | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface SenderProfile {
  id: string;
  company_name: string | null;
  logo_url: string | null;
  bio: string | null;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  position: string | null;
  bio: string | null;
  photo_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface Testimonial {
  id: string;
  client_name: string;
  client_role: string | null;
  client_company: string | null;
  quote: string;
  sort_order: number;
  created_at: string;
}

export const newProposalInputSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  client_company: z.string().optional(),
  client_email: z.string().email().optional().or(z.literal("")),
  client_phone: z.string().optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  brief: z.string().min(20, "Give at least a sentence or two of detail"),
});

export type NewProposalInput = z.infer<typeof newProposalInputSchema>;
