import { Settings2 } from "lucide-react";
import Link from "next/link";

import { AgentGallery } from "@/components/gallery/AgentGallery";
import { EmptyGallery } from "@/components/gallery/EmptyGallery";
import { GalleryHeader, HEADER_ACTION_CLASS } from "@/components/gallery/GalleryHeader";
import { getDataAgents } from "@/lib/data-agent-store";
import { getTenantConfig } from "@/lib/tenant-config";

export const metadata = { title: "Conversational Data Agent" };

/**
 * Tab 3 (CLAUDE.md §5): the client's Fabric data agents, beside one demo video
 * and one launch video for the page. Each agent opens its own conversation at
 * /data-agents/[agentId].
 */
export default async function DataAgentsPage() {
  const config = await getTenantConfig();
  const agents = getDataAgents(config);
  const videos = config.videos.dataAgents;

  return (
    <>
      <GalleryHeader
        logo="/logos/microsoft-fabric.png"
        eyebrow="Microsoft Fabric"
        title="Conversational Data Agent"
        intro="Ask the warehouse a question in plain language and get an answer from your own data. Each agent covers one subject area, and questions run as you, so an answer never reaches past your own access."
        count={agents.length ? `${agents.length} ${agents.length === 1 ? "agent" : "agents"}` : undefined}
        action={
          <Link href="/data-agents/manage" className={HEADER_ACTION_CLASS}>
            <Settings2 aria-hidden className="h-4 w-4" />
            Manage agents
          </Link>
        }
      />

      {agents.length === 0 ? (
        <EmptyGallery
          message="No data agents are configured yet. Publish one in Fabric, then add it here with its workspace and agent IDs."
          actionHref="/data-agents/manage"
          actionLabel="Add a data agent"
        />
      ) : (
        <AgentGallery
          listLabel="Data agents"
          agents={agents.map((agent) => ({
            href: `/data-agents/${agent.id}`,
            name: agent.name,
            description: agent.description,
            cta: "Ask",
          }))}
          videos={[
            {
              kind: "demo",
              heading: "See a data agent answer",
              blurb:
                "A short walkthrough: asking a question, reading the answer, and checking the query behind it.",
              video: videos.demo,
            },
            {
              kind: "launch",
              heading: "Introducing the data agents",
              blurb:
                "What these agents are for, what they can see, and how they fit alongside your dashboards.",
              video: videos.launch,
            },
          ]}
        />
      )}
    </>
  );
}
