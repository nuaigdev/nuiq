/**
 * Uploads the agent gallery's videos, and points the client's config document
 * at them (CLAUDE.md §5 Tabs 3 and 4).
 *
 * Usage, with the source files sitting in the repo root and any poster frames
 * in .video-posters/ (neither is committed — see .gitignore):
 *
 *   npm run upload-gallery-videos
 *
 * The config write is conditional on the etag the document was read at, so it
 * cannot discard a dashboard or agent an admin added through the portal in the
 * meantime. Re-running it replaces the videos in place: same pathnames, same
 * URLs, so the config does not need to change for the swap to take effect.
 *
 * Data agents have one demo video each, so their demo blobs are keyed by agent
 * (`data-agents-demo-<agent>`). Demos removed from the list are deleted from the
 * store, and the config's demo list is rewritten to match.
 *
 * Poster frames are optional. When one is set, it is pulled out of the video
 * with ffmpeg, e.g.
 *   ffmpeg -ss 25 -i "<video>.mp4" -frames:v 1 -q:v 2 -vf scale=960:-1 out.jpg
 * Pick a frame that shows the product rather than a mid-transition blur — and
 * check what is on screen in it, since a demo recorded against real data can
 * put resident-level detail in a still that anyone with the link can load.
 */

import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { del, put } from "@vercel/blob";

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
  key: string;
  videoFile: string;
  posterFile?: string;
  slug: string;
  title?: string;
};

const dataAgentDemos: Item[] = [
  {
    key: "dataAgents.demos.marketing",
    videoFile: "Conversational Agents Sales-Marketing Agent Final Video.mp4",
    slug: "data-agents-demo-marketing",
    title: "Marketing and Enquiries Agent",
  },
  {
    key: "dataAgents.demos.finance",
    videoFile: "Conversational Agents Finance Agent Final Video.mp4",
    slug: "data-agents-demo-finance",
    title: "Finance Agent",
  },
];

const items: Item[] = [
  ...dataAgentDemos,
  {
    key: "dataAgents.launch",
    videoFile: "Conversational Agents Launch Video.mp4",
    posterFile: ".video-posters/data-agents-launch-3.jpg",
    slug: "data-agents-launch",
  },
  {
    key: "aiAgents.demo",
    videoFile: "Advanced AI Agent Agent Final Demo Video.mp4",
    posterFile: ".video-posters/data-agents-demo-3.jpg",
    slug: "ai-agents-demo",
  },
  {
    key: "aiAgents.launch",
    videoFile: "Advance AI Agents Launch Video.mp4",
    posterFile: ".video-posters/ai-agents-launch-2.jpg",
    slug: "ai-agents-launch",
  },
];

/** Blobs from the single data-agent demo that the per-agent demos replace. */
const RETIRED_DATA_AGENT_DEMO_SLUG = "data-agents-demo";

type Uploaded = { url: string; posterUrl?: string; title?: string };

async function uploadVideo(clientId: string, item: Item): Promise<Uploaded> {
  console.log(`Uploading ${item.videoFile} ...`);
  const video = await put(
    `clients/${clientId}/gallery-videos/${item.slug}.mp4`,
    readFileSync(item.videoFile),
    {
      access: "public",
      token,
      contentType: "video/mp4",
      addRandomSuffix: false,
      allowOverwrite: true,
    },
  );
  console.log(`  -> ${video.url}`);

  let posterUrl: string | undefined;
  if (item.posterFile && existsSync(item.posterFile)) {
    console.log(`Uploading poster for ${item.slug} ...`);
    const poster = await put(
      `clients/${clientId}/gallery-videos/${item.slug}-poster.jpg`,
      readFileSync(item.posterFile),
      {
        access: "public",
        token,
        contentType: "image/jpeg",
        addRandomSuffix: false,
        allowOverwrite: true,
      },
    );
    console.log(`  -> ${poster.url}`);
    posterUrl = poster.url;
  }

  return { url: video.url, posterUrl, title: item.title };
}

async function main() {
  const clientId = getClientId();
  const results = new Map<string, Uploaded>();

  for (const item of items) {
    results.set(item.key, await uploadVideo(clientId, item));
  }

  const retiredPaths = [
    `clients/${clientId}/gallery-videos/${RETIRED_DATA_AGENT_DEMO_SLUG}.mp4`,
    `clients/${clientId}/gallery-videos/${RETIRED_DATA_AGENT_DEMO_SLUG}-poster.jpg`,
  ];
  console.log("Removing the retired single data-agent demo ...");
  for (const pathname of retiredPaths) {
    await del(pathname, { token }).catch((e) => console.log(`  (skipped ${pathname}: ${e.message})`));
  }

  const store = getConfigStore();
  const existing = await store.read(clientId);
  if (!existing) throw new Error("No existing config document to update.");

  const config = parseTenantConfig(existing.config, clientId, "the configuration store") as TenantConfig;
  const pick = (key: string): Uploaded => {
    const found = results.get(key);
    if (!found) throw new Error(`No upload recorded for ${key}`);
    return found;
  };

  const updated: TenantConfig = {
    ...config,
    videos: {
      dataAgents: {
        demos: dataAgentDemos.map((item) => pick(item.key)),
        launch: pick("dataAgents.launch"),
      },
      aiAgents: {
        demo: pick("aiAgents.demo"),
        launch: pick("aiAgents.launch"),
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
