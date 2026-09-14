import { AgentGallery } from "@/components/gallery/AgentGallery";
import { EmptyGallery } from "@/components/gallery/EmptyGallery";
import { GalleryHeader } from "@/components/gallery/GalleryHeader";
import {
  agentSlug,
  getPlatformAgents,
  PLATFORM_LABELS,
} from "@/lib/ai-agent-store";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Advanced AI Agents" };

/** Agents come from the client's configuration document, never from the build. */
export const dynamic = "force-dynamic";

/**
 * Tab 4 (CLAUDE.md §5).
 *
 * The same three-column shape as Conversational Data Agents — agents, a demo
 * video, a launch video — so the two agent tabs read as one product. Each agent
 * opens at its own URL, so a colleague can be linked straight to one.
 *
 * There is deliberately no explanatory preamble here. The agent's own context
 * panel says what it is and what to ask it, which is the same information at
 * the point it is useful.
 */
export default async function AiAgentsPage() {
  const config = await getTenantConfig();
  const agents = getPlatformAgents(config);
  const videos = config.videos.aiAgents;

  return (
    <>
      <GalleryHeader
        logo="/logos/azure-ai-foundry.png"
        eyebrow="Agent platforms"
        title="Advanced AI Agents"
        count={agents.length ? `${agents.length} ${agents.length === 1 ? "agent" : "agents"}` : undefined}
      />

      {agents.length === 0 ? (
        <EmptyGallery message="No AI agents are configured for this portal yet." />
      ) : (
        <AgentGallery
          listLabel="AI agents"
          agents={agents.map((agent) => ({
            href: `/ai-agents/${agentSlug(agent)}`,
            name: agent.name,
            description: agent.description,
            eyebrow: PLATFORM_LABELS[agent.type] ?? agent.type,
            cta: agent.display === "chat-panel" ? "Ask" : "Open",
          }))}
          videos={[
            {
              kind: "demo",
              heading: "See the agents at work",
              blurb:
                "A short walkthrough of an agent taking on a real piece of work, from the first request to the result.",
              video: videos.demo,
            },
            {
              kind: "launch",
              heading: "Introducing Advanced AI Agents",
              blurb:
                "What these agents are built to do, and where they go beyond questions of the warehouse.",
              video: videos.launch,
            },
          ]}
        />
      )}
    </>
  );
}
