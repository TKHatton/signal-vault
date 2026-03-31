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

    const prompt = `You are an SEO and local business optimization expert at Signal & Structure AI.

A client has asked: "${state.userRequest}"

Their connected platform is: ${state.connection}

Based on this request, generate 2-3 specific, actionable proposed changes for their Google Business Profile. For each change, provide:
- field: The specific field being changed (e.g., "Business Description", "Business Hours", "Service Categories")
- current: What the current value likely is (use a realistic placeholder if unknown)
- proposed: The optimized value you'd recommend
- platform: "Google Business Profile"

Focus on changes that:
1. Improve AI discoverability (how AI assistants find and recommend the business)
2. Follow local SEO best practices
3. Are specific and actionable, not vague

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
