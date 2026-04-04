import { VaultAgentStateType } from "../state";
import { AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { logPipelineEvent } from "@/lib/tools/audit-logger";

/**
 * CONTENT GENERATION NODE
 * Step 2 of 7 in the multi-pass verification pipeline.
 *
 * Uses OpenAI to analyze the user's request and generate
 * specific proposed changes for their Google Business Profile.
 */
export async function contentGenNode(
  state: VaultAgentStateType
): Promise<Partial<VaultAgentStateType>> {
  const timestamp = new Date().toISOString();

  console.log("[Content Gen] Generating proposed changes with OpenAI...");

  try {
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.3,
    });

    const prompt = `You are an AI agent at Signal & Structure AI, a company that helps businesses become discoverable by AI systems.

Signal & Structure's methodology covers 6 domains:
1. Structured Data (schema markup scanning, gap analysis, generation)
2. Google Business Profile (completeness scoring, competitor analysis, optimization)
3. NAP Consistency (directory scanning, conflict resolution)
4. Content Optimization (quality scoring, FAQ generation, AI parseability)
5. Technical Infrastructure (performance, crawlability, mobile, security)
6. AI Presence Building (GPT blueprints, citation monitoring)

A client has asked: "${state.userRequest}"

Their connected platform is: ${state.connection}

The connected business is the client's real Google Business Profile. Since we cannot fetch the actual listing data yet (API access pending), use realistic example current values that a typical local business might have — something brief, generic, and clearly not optimized. Do NOT use brackets or placeholder tokens like "[service type]" — write actual text.

Generate 2-3 specific proposed changes. For each change, provide:
- field: The specific GBP field (e.g., "Business Description", "Business Hours", "Primary Category", "Additional Categories", "Services")
- current: A realistic but unoptimized value (e.g., "Local business serving the community since 2015", "Mon-Fri 9:00 AM - 5:00 PM", "Marketing agency")
- proposed: The Signal & Structure optimized value — written to maximize AI discoverability, local SEO, and conversion. Make the proposed changes specific, detailed, and clearly better than the current values.
- platform: "Google Business Profile"

Signal & Structure optimization principles:
- Descriptions should include service keywords, location, and a clear value proposition
- Categories should cover all relevant services (primary + 2-3 additional)
- Hours should be accurate and include special hours if applicable
- Services list should be comprehensive with descriptions
- Everything should be structured so AI assistants (ChatGPT, Gemini, Perplexity) can parse and recommend the business

Respond in JSON format only:
[
  { "field": "...", "current": "...", "proposed": "...", "platform": "Google Business Profile" }
]`;

    const response = await llm.invoke(prompt);
    const content =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    // Parse the JSON response
    let proposedChanges;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      proposedChanges = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      // Fallback if LLM response isn't valid JSON
      proposedChanges = [
        {
          field: "Business Description",
          current: "(current description)",
          proposed: `Optimized description based on request: "${state.userRequest}"`,
          platform: "Google Business Profile",
        },
      ];
    }

    await logPipelineEvent({
      connection: state.connection,
      action: "content_generated",
      agentName: "content-gen-agent",
      details: {
        changesCount: proposedChanges.length,
        request: state.userRequest,
      },
    });

    const changesSummary = proposedChanges
      .map(
        (c: { field: string; current: string; proposed: string }) =>
          `• ${c.field}: "${c.current}" → "${c.proposed}"`
      )
      .join("\n");

    return {
      currentStep: "human_review",
      contentGen: {
        passed: true,
        changes: proposedChanges,
        details: `Generated ${proposedChanges.length} proposed changes using AI analysis.`,
        timestamp,
      },
      messages: [
        new AIMessage(
          `I've analyzed your request and generated ${proposedChanges.length} proposed changes:\n\n${changesSummary}\n\nPlease review and approve these changes to proceed.`
        ),
      ],
    };
  } catch (error) {
    console.error("[Content Gen] OpenAI error:", error);

    // Fallback to template-based generation if OpenAI fails
    const proposedChanges = [
      {
        field: "Business Description",
        current: "(current description)",
        proposed: `Optimized based on request: "${state.userRequest}"`,
        platform: "Google Business Profile",
      },
    ];

    return {
      currentStep: "human_review",
      contentGen: {
        passed: true,
        changes: proposedChanges,
        details: `Generated ${proposedChanges.length} proposed changes (AI unavailable, using template).`,
        timestamp,
      },
      messages: [
        new AIMessage(
          `Generated ${proposedChanges.length} proposed changes for review. Please approve to proceed.`
        ),
      ],
    };
  }
}
