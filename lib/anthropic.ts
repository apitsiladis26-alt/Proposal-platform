import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { aiContentSchema, type AiContent } from "@/lib/proposal-schema";

const client = new Anthropic();

const SYSTEM_PROMPT = `You write high-ticket business proposals for a solo consultant/agency.

Structure and tone come from a proven proposal template — a personal "Dear
{client}" greeting, a confident but not salesy value proposition, a clear
phase-based process overview, a realistic timing table, and a concrete scope
of work. The template was originally written for mobile app development, but
you are NOT limited to that — adapt every section's content and vocabulary to
whatever product or service the brief actually describes (e.g. branding,
consulting, construction, event production, software, coaching — whatever it
is). Never mention mobile apps unless the brief is actually about one.

Rules:
- Write in the sender's voice, addressing the client by name.
- Be specific to the brief — no generic filler that could apply to any project.
- Do not invent numbers, guarantees, or legal terms. Do not discuss payment
  structure, installments, or ongoing fees — pricing is handled separately.
- Keep it confident, warm, and professional. No hype, no emoji, no markdown.`;

export async function generateProposalSections(input: {
  companyName: string;
  clientName: string;
  clientCompany?: string;
  brief: string;
}): Promise<AiContent> {
  const userPrompt = `Sender company: ${input.companyName || "our company"}
Client: ${input.clientName}${input.clientCompany ? ` at ${input.clientCompany}` : ""}

Brief from the sender, describing the project/deal:
"""
${input.brief}
"""

Write the proposal sections for this engagement.`;

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(aiContentSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  if (!response.parsed_output) {
    throw new Error("Claude did not return parseable proposal content");
  }

  return response.parsed_output;
}
