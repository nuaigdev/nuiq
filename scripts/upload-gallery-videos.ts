/**
 * Uploads the agent gallery's demo and launch videos, and points the client's
 * config document at them (CLAUDE.md §5 Tabs 3 and 4).
 *
 * Usage, with the four source files sitting in the repo root and their poster
 * frames in .video-posters/ (neither is committed — see .gitignore):
 *
 *   npm run upload-gallery-videos
 *
 * The config write is conditional on the etag the document was read at, so it
 * cannot discard a dashboard or agent an admin added through the portal in the
 * meantime. Re-running it replaces the videos in place: same pathnames, same
 * URLs, so the config does not need to change for the swap to take effect.
 *
 * Poster frames are pulled out of the videos themselves with ffmpeg, e.g.
 *   ffmpeg -ss 25 -i "<video>.mp4" -frames:v 1 -q:v 2 -vf scale=960:-1 out.jpg
 * Pick a frame that shows the product rather than a mid-transition blur — and
 * check what is on screen in it, since a demo recorded against real data can
 * put resident-level detail in a still that anyone with the link can load.
 */

import "server-only";
import { readFileSync } from "node:fs";
import { put } from "@vercel/blob";

import { getConfigStore } from "../src/lib/config-store";
import { getClientId, parseTenantConfig, type TenantConfig } from "../src/lib/tenant-config";

/**
 * Two stores, deliberately.
 *
 * The client's config document and its dashboard thumbnails live in the
 * private store (BLOB_READ_WRITE_TOKEN) — they show that client's own figures,
 * so they are streamed through a session-checked route, never served from a
 * public URL.
 *
 * The gallery videos go to a separate public store, because the gallery renders
 * them straight into <video src> / <iframe src> in the browser, which carries
 * no credential. The private store refuses `access: "public"` outright, which
 * is what forced the split.
 *
 * Only this one-off script needs the public store's token. The deployment never
 * does: the config document ends up holding plain https URLs.
 */
const token = process.env.PUBLIC_BLOB_READ_WRITE_TOKEN;
if (!token) {
  throw new Error(
    "PUBLIC_BLOB_READ_WRITE_TOKEN is not set. Create a Blob store with public " +
      "access in Vercel, then put its token in .env.local under that name. " +
      "(BLOB_READ_WRITE_TOKEN is the private store, and it refuses public uploads.)",
  );
}

type Item = {
  key: "dataAgents.demo" | "dataAgents.launch" | "aiAgents.demo" | "aiAgents.launch";
  videoFile: string;
  posterFile: string;
  slug: string;
};

const items: Item[] = [
  {
    key: "dataAgents.demo",
    videoFile: "Conversational Agents Demo Video.mp4",
    posterFile: ".video-posters/data-agents-demo-3.jpg",
    slug: "data-agents-demo",
  },
  {
    key: "dataAgents.launch",
    videoFile: "Conversational Agents Launch Video.mp4",
    posterFile: ".video-posters/data-agents-launch-3.jpg",
    slug: "data-agents-launch",
  },
  {
    key: "aiAgents.demo",
    videoFile: "Advanced AI Agents Demo Video.mp4",
    posterFile: ".video-posters/ai-agents-demo-1.jpg",
    slug: "ai-agents-demo",
  },
  {
    key: "aiAgents.launch",
    videoFile: "Advance AI Agents Launch Video.mp4",
    posterFile: ".video-posters/ai-agents-launch-2.jpg",
    slug: "ai-agents-launch",
  },
];

async function main() {
  const clientId = getClientId();
  const results: Record<string, { url: string; posterUrl: string }> = {};

  for (const item of items) {
    console.log(`Uploading ${item.videoFile} ...`);
    const videoBody = readFileSync(item.videoFile);
    const videoResult = await put(
      `clients/${clientId}/gallery-videos/${item.slug}.mp4`,
      videoBody,
      {
        access: "public",
        token,
        contentType: "video/mp4",
        addRandomSuffix: false,
        allowOverwrite: true,
      },
    );
    console.log(`  -> ${videoResult.url}`);

    console.log(`Uploading poster for ${item.slug} ...`);
    const posterBody = readFileSync(item.posterFile);
    const posterResult = await put(
      `clients/${clientId}/gallery-videos/${item.slug}-poster.jpg`,
      posterBody,
      {
        access: "public",
        token,
        contentType: "image/jpeg",
        addRandomSuffix: false,
        allowOverwrite: true,
      },
    );
    console.log(`  -> ${posterResult.url}`);

    results[item.key] = { url: videoResult.url, posterUrl: posterResult.url };
  }

  // Merge into the live config, conditional on the etag it was read at.
  const store = getConfigStore();
  const existing = await store.read(clientId);
  if (!existing) throw new Error("No existing config document to update.");

  const config = parseTenantConfig(existing.config, clientId, "the configuration store") as TenantConfig;

  const updated: TenantConfig = {
    ...config,
    videos: {
      dataAgents: {
        demo: { url: results["dataAgents.demo"].url, posterUrl: results["dataAgents.demo"].posterUrl },
        launch: { url: results["dataAgents.launch"].url, posterUrl: results["dataAgents.launch"].posterUrl },
      },
      aiAgents: {
        demo: { url: results["aiAgents.demo"].url, posterUrl: results["aiAgents.demo"].posterUrl },
        launch: { url: results["aiAgents.launch"].url, posterUrl: results["aiAgents.launch"].posterUrl },
      },
    },
  };

  await store.write(clientId, updated, existing.etag);
  console.log("Config updated with videos block.");
  console.log(JSON.stringify(updated.videos, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
