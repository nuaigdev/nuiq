import "server-only";

import { get, put } from "@vercel/blob";

import { ConfigStoreError } from "./types";

/**
 * Per-client binary assets — today, the preview image on a dashboard tile.
 *
 * These live beside the client's config document, in the same store, for the
 * same reason: a picture of a client's report is that client's, not the repo's
 * (CLAUDE.md §3, §9), and it must not ship inside an image deployed for
 * everyone else.
 *
 * The store is private, so these are never served straight from a blob URL.
 * They are read back here and streamed through a route that checks the session
 * first — a dashboard screenshot shows census and pipeline figures, and a
 * public URL for it would be readable by anyone who guessed the link.
 *
 * This file is inside `config-store/` deliberately: it is the only folder
 * allowed to name a storage vendor (§3).
 */

export type ClientAsset = {
  stream: ReadableStream;
  contentType: string;
};

function tokenOrThrow(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new ConfigStoreError(
      "BLOB_READ_WRITE_TOKEN is not set, so client assets cannot be read.",
    );
  }
  return token;
}

/** Where one client's asset lives. The name is never caller-controlled. */
function pathnameFor(clientId: string, name: string): string {
  return `clients/${clientId}/assets/${name}`;
}

export async function readClientAsset(
  clientId: string,
  name: string,
): Promise<ClientAsset | null> {
  const result = await get(pathnameFor(clientId, name), {
    access: "private",
    token: tokenOrThrow(),
  });

  if (result === null || result.statusCode !== 200) return null;

  return {
    stream: result.stream,
    contentType: result.blob.contentType ?? "application/octet-stream",
  };
}

export async function writeClientAsset(
  clientId: string,
  name: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const result = await put(pathnameFor(clientId, name), body, {
    access: "private",
    token: tokenOrThrow(),
    contentType,
    // The pathname is the asset's identity; a random suffix would make it
    // unfindable on the next read.
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return result.pathname;
}
