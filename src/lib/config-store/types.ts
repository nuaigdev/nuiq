/**
 * Per-client configuration storage (CLAUDE.md §3).
 *
 * One document per client, holding that client's non-secret settings. Secrets
 * never live here — they stay in the platform's secret store.
 *
 * The interface is deliberately provider-agnostic: no caller should know or care
 * whether the document sits in Vercel Blob, Azure Blob, or S3. Adding a provider
 * means adding an adapter and a case in the factory, and touching nothing else.
 */

export type StoredConfig = {
  /** Parsed JSON document. Validation is the loader's job, not the store's. */
  config: unknown;
  /** Opaque version tag, passed back to `write` for conditional updates. */
  etag: string;
};

export interface ConfigStore {
  /** Returns null when this client has no configuration document yet. */
  read(clientId: string): Promise<StoredConfig | null>;

  /**
   * Persists configuration.
   *
   * @param etag `null` creates the document and fails if one already exists.
   *             A string performs a conditional overwrite and fails if the
   *             stored document has changed since it was read.
   * @returns the new etag.
   */
  write(clientId: string, config: unknown, etag: string | null): Promise<string>;
}

/**
 * Someone else wrote to this client's configuration between our read and our
 * write. The caller should re-read and ask the operator to redo their change
 * rather than silently overwriting whatever landed in between.
 */
export class ConfigConflictError extends Error {
  constructor(clientId: string) {
    super(
      `[NuIQ config] Configuration for "${clientId}" changed since it was loaded. ` +
        `Reload the page and reapply your change — writing now would discard ` +
        `someone else's edit.`,
    );
    this.name = "ConfigConflictError";
  }
}

/** The store itself failed: misconfigured, unreachable, or refused the request. */
export class ConfigStoreError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(`[NuIQ config] ${message}`, options);
    this.name = "ConfigStoreError";
  }
}
