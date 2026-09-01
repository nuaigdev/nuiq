import "server-only";

import {
  BlobNotFoundError,
  BlobPreconditionFailedError,
  get,
  put,
} from "@vercel/blob";

import {
  ConfigConflictError,
  ConfigStoreError,
  type ConfigStore,
  type StoredConfig,
} from "./types";

/**
 * Vercel Blob adapter.
 *
 * Blobs are written with `access: "private"`. The document holds no secrets, but
 * it does carry tenant, workspace and report identifiers, and there is no reason
 * for those to be readable by anyone with the URL.
 *
 * Reads pass `useCache: false`. A config read that returns CDN-cached bytes
 * would make an admin's change appear not to have taken, and would undermine the
 * conditional write below by handing out a stale etag.
 *
 * Authentication is the store's own token (BLOB_READ_WRITE_TOKEN), injected by
 * Vercel. It is passed to every call explicitly rather than left to the SDK's
 * ambient lookup: when VERCEL_OIDC_TOKEN is also present — `vercel link` writes
 * one into .env.local — the SDK prefers OIDC, which fails with 403 in any
 * environment where OIDC is not enabled. Passing `token` takes priority over
 * both and makes the credential deterministic.
 */

const DEFAULT_PREFIX = "clients";

function pathnameFor(clientId: string): string {
  const prefix = process.env.CONFIG_STORE_PREFIX?.trim() || DEFAULT_PREFIX;
  return `${prefix}/${clientId}/tenant-config.json`;
}

export function createVercelBlobStore(): ConfigStore {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new ConfigStoreError(
      'CONFIG_STORE_PROVIDER is "vercel-blob" but BLOB_READ_WRITE_TOKEN is not ' +
        "set. Link a Blob store to this project (Vercel injects the token), or " +
        "pull it locally with `vercel env pull .env.local`.",
    );
  }

  return {
    async read(clientId: string): Promise<StoredConfig | null> {
      const pathname = pathnameFor(clientId);

      let result;
      try {
        result = await get(pathname, {
          access: "private",
          useCache: false,
          token,
        });
      } catch (error) {
        if (error instanceof BlobNotFoundError) return null;
        throw new ConfigStoreError(
          `Could not read configuration for "${clientId}" from ${pathname}.`,
          { cause: error },
        );
      }

      // get() resolves null when the blob does not exist.
      if (result === null) return null;

      // 304 is only reachable with ifNoneMatch, which we do not use — but the
      // result is a discriminated union, so narrow rather than assume.
      if (result.statusCode !== 200) {
        throw new ConfigStoreError(
          `Unexpected ${result.statusCode} response reading configuration for ` +
            `"${clientId}".`,
        );
      }

      const raw = await new Response(result.stream).text();

      let config: unknown;
      try {
        config = JSON.parse(raw);
      } catch (error) {
        throw new ConfigStoreError(
          `Configuration for "${clientId}" at ${pathname} is not valid JSON.`,
          { cause: error },
        );
      }

      return { config, etag: result.blob.etag };
    },

    async write(
      clientId: string,
      config: unknown,
      etag: string | null,
    ): Promise<string> {
      const pathname = pathnameFor(clientId);
      const body = `${JSON.stringify(config, null, 2)}\n`;

      try {
        const result = await put(pathname, body, {
          access: "private",
          token,
          contentType: "application/json",
          // The pathname is the identity of the document; a random suffix would
          // make it unfindable on the next read.
          addRandomSuffix: false,
          ...(etag === null
            ? // Create only. Seeding must never clobber an existing document.
              { allowOverwrite: false }
            : // Conditional overwrite: fails if the stored copy moved on.
              { ifMatch: etag }),
        });

        return result.etag;
      } catch (error) {
        if (error instanceof BlobPreconditionFailedError) {
          throw new ConfigConflictError(clientId);
        }
        // allowOverwrite:false on an existing blob surfaces as a plain blob
        // error; treat it as a conflict too, since that is what it means.
        if (etag === null && error instanceof Error && /exists/i.test(error.message)) {
          throw new ConfigConflictError(clientId);
        }
        throw new ConfigStoreError(
          `Could not write configuration for "${clientId}" to ${pathname}.`,
          { cause: error },
        );
      }
    },
  };
}
