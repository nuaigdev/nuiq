import "server-only";

import { ConfigStoreError, type ConfigStore } from "./types";
import { createVercelBlobStore } from "./vercel-blob";

export type { ConfigStore, StoredConfig } from "./types";
export { ConfigConflictError, ConfigStoreError } from "./types";

/**
 * Chooses the configuration store from the environment.
 *
 * The provider is a deployment decision, never a code decision — nothing
 * outside this folder names a storage vendor. Adding Azure Blob or S3 later
 * means adding an adapter and a case here; callers do not change.
 */

const PROVIDERS = ["vercel-blob"] as const;
type Provider = (typeof PROVIDERS)[number];

let cached: ConfigStore | undefined;

function resolveProvider(): Provider {
  const configured = process.env.CONFIG_STORE_PROVIDER?.trim();

  if (!configured) {
    throw new ConfigStoreError(
      "CONFIG_STORE_PROVIDER is not set. Set it to one of: " +
        `${PROVIDERS.join(", ")}. There is no default — a deployment must say ` +
        "where its configuration lives rather than having one guessed for it.",
    );
  }

  if (!(PROVIDERS as readonly string[]).includes(configured)) {
    throw new ConfigStoreError(
      `CONFIG_STORE_PROVIDER is "${configured}", which is not a known provider. ` +
        `Known providers: ${PROVIDERS.join(", ")}.`,
    );
  }

  return configured as Provider;
}

export function getConfigStore(): ConfigStore {
  if (cached) return cached;

  const provider = resolveProvider();

  switch (provider) {
    case "vercel-blob":
      cached = createVercelBlobStore();
      break;
  }

  return cached;
}

/** Test seam: drop the memoised store so the next call re-reads the env. */
export function resetConfigStore(): void {
  cached = undefined;
}
