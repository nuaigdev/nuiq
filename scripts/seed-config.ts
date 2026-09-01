/**
 * Seeds a client's configuration document into the store.
 *
 * Seeding is deliberately explicit and one-off. The app never falls back to a
 * file in the repo when the store has nothing — a deployment whose config is
 * missing must fail loudly rather than quietly serve defaults or, worse, another
 * client's settings (CLAUDE.md §3).
 *
 * Usage:
 *   npm run seed-config -- ./config/kestrelbrook/tenant.json
 *   npm run seed-config -- ./config/kestrelbrook/tenant.json --force
 *
 * Without --force this refuses to overwrite an existing document, so it cannot
 * silently discard changes an admin made through the portal.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { getConfigStore, ConfigConflictError } from "../src/lib/config-store";
import { getClientId, parseTenantConfig } from "../src/lib/tenant-config";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const file = args.find((arg) => !arg.startsWith("--"));

  if (!file) {
    throw new Error(
      "Usage: npm run seed-config -- <path-to-tenant.json> [--force]",
    );
  }

  const clientId = getClientId();
  const absolute = path.resolve(process.cwd(), file);
  const raw: unknown = JSON.parse(readFileSync(absolute, "utf8"));

  // Same validation the app runs at boot: config that would fail to load must
  // fail to seed, rather than being discovered as broken on first request.
  const config = parseTenantConfig(raw, clientId, absolute);

  const store = getConfigStore();
  const existing = await store.read(clientId);

  if (existing && !force) {
    throw new Error(
      `Configuration already exists for "${clientId}". Re-run with --force to ` +
        `overwrite it — but note this discards anything changed through the ` +
        `portal since it was seeded.`,
    );
  }

  try {
    await store.write(clientId, config, existing ? existing.etag : null);
  } catch (error) {
    if (error instanceof ConfigConflictError) {
      throw new Error(
        `Configuration for "${clientId}" changed while seeding. Re-run the ` +
          `command.`,
      );
    }
    throw error;
  }

  console.log(
    `Seeded configuration for "${clientId}" from ${absolute}` +
      `${existing ? " (overwrote existing)" : ""}.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
