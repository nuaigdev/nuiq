# CLAUDE.md — NuIQ

This file is the source of truth for how Claude (and any human contributor) should work in this repository. Read it before writing code. If something in a task conflicts with this file, this file wins unless the user explicitly overrides it in the conversation.

---

## 1. What NuIQ is

**NuIQ** is a data intelligence portal for the **Senior Living / Long-Term Care (LTC)** industry, built by **NuAIg**. It sits as a higher-level layer on top of a client's existing Microsoft Fabric data warehouse and gives non-technical stakeholders (facility directors, regional VPs, quality/compliance teams) one place to:

1. **See the data model and how data flows** through the warehouse — visually, with animation — without needing to read a warehouse schema.
2. **Access Power BI dashboards** built on top of that warehouse, embedded directly in the app (not just links out).
3. **Ask questions of the warehouse directly** through the client's **Fabric data agents** — one or more, each scoped to its own slice of the data — embedded in the app.
4. **Access broader AI agents** built in Azure AI Foundry, Copilot Studio, or Power Platform, whose presentation varies per agent.

NuIQ is **not** a data warehouse, an ETL tool, or a BI tool. It is the presentation and orchestration layer that sits in front of infrastructure the client already owns (Fabric, Power BI, Microsoft agent tooling).

**Brand rule:** Every deployment of the app must show "**Powered by NuAIg**" in the footer, alongside the NuAIg logo (`/public/nuaig-logo.svg`, with `/public/nuaig-logo-white.svg` for dark backgrounds). This is non-negotiable — do not build layouts that omit or bury the footer credit.

The NuIQ mark is the faceted origami peak (`/public/nuiq-logo.png`) — this is the app's own logo — flat vector, no gradients in production use of the mark, deep indigo/blue facet tones. Don't regenerate or reinterpret the logo in code; treat the provided asset as final.

---

## 2. Industry context Claude must keep in mind

This is healthcare-adjacent software for **senior living and LTC operators**. This shapes technical decisions throughout the codebase:

- **Facility hierarchy is fundamental.** Data and access control are structured as `organization → region → community → unit`. Every data query, every RBAC check, every dashboard filter should assume this hierarchy exists and respect it. Do not build flat, single-tenant-shaped data models — a "community" is the base operating unit, not the client.
- **PHI/PII is present in the underlying data** (falls, medication errors, incidents, census, MDS-related clinical data). NuIQ itself should generally be working with **aggregated/operational metrics**, not raw clinical records — but treat every screen as if PHI could be one query away, and never log, cache client-side, or expose more granular data than the current user's role and facility scope allow.
- **Typical KPIs / domain vocabulary** you'll encounter and should model correctly: falls, elopements, medication errors, occupancy/census, staffing ratios, readmission rates, CMS Five-Star ratings, incident/adverse event tracking. Don't invent generic "business metrics" — use domain-correct terms.
- **Compliance posture:** design as if HIPAA applies, even before a formal compliance review happens. Secrets never in code, access always logged, least-privilege by default.

---

## 3. Multi-tenant model — read this before touching config or auth

**This repository is shared across multiple client organizations.** The architecture decision, already made, is:

> One shared codebase → **one isolated deployment per client**. No shared runtime, no domain-based tenant routing, no cross-client data path of any kind.

Concretely:

- Each client gets their own **Azure Container App** instance, built from the same container image, deployed separately.
- Each client has their **own Azure Key Vault** for secrets. Secrets never live in the repo, never in `.env` files that get committed, and are never shared across clients.
- Each client has their **own Entra ID app registration** (single-tenant, registered in *their* Entra ID tenant) — NuIQ is an app their staff sign into with accounts they already have. Do not build multi-tenant Entra ID logic (no "which tenant is this" resolution, no cross-tenant consent flows) — that complexity is explicitly out of scope.
- **No custom domain routing logic.** Each deployment gets its own default Azure Container Apps URL. Do not build hostname-based tenant detection, subdomain parsing, or multi-domain routing — this was explicitly decided against.
- The client identity for a given running instance is resolved from a single environment variable (`CLIENT_ID`) set at deploy time — not inferred at runtime from the request.

### Config structure

Client configuration lives in **object storage, one document per client** — not
in the repo and not in a database:

```
<store>/clients/<CLIENT_ID>/tenant-config.json
```

It is read through the `ConfigStore` interface in `src/lib/config-store/`, whose
provider is chosen by `CONFIG_STORE_PROVIDER`. **No code outside that folder may
name a storage vendor.** The current adapter is `vercel-blob`; an `azure-blob`
adapter can be added later without touching a single caller.

Because the document is writable at runtime, admin edits (adding or removing a
dashboard) take effect without a redeploy. Writes are **conditional on the etag
the document was read at**, so two admins editing at once produce a conflict the
second one can act on rather than one silently losing their change.

The repo keeps `config/<client>/tenant.json` only as **seed input** for
`npm run seed-config`. It is not read at runtime, and editing it changes nothing
until it is seeded.

The shape of the document is unchanged — non-secret identifiers only:

```json
{
  "clientId": "client-a",
  "displayName": "Example Senior Living Group",
  "entraTenantId": "...",
  "entraClientId": "...",
  "fabricWorkspaceId": "...",
  "warehouseSqlEndpoint": "...",
  "powerBi": {
    "workspaceId": "...",
    "reports": [
      { "id": "...", "name": "Occupancy & Census", "facilityFilterField": "CommunityId" }
    ]
  },
  "fabricDataAgents": [
    {
      "id": "...",
      "name": "Census & Occupancy Agent",
      "workspaceId": "...",
      "description": "Natural-language questions over census and occupancy tables"
    },
    {
      "id": "...",
      "name": "Quality & Incidents Agent",
      "workspaceId": "...",
      "description": "Falls, elopements, and medication error trends"
    }
  ],
  "agents": [
    {
      "type": "foundry",
      "name": "Quality Insights Agent",
      "display": "chat-panel",
      "endpoint": "...",
      "agentId": "..."
    },
    {
      "type": "copilot-studio",
      "name": "Care Ops Assistant",
      "display": "chat-panel",
      "embedUrl": "..."
    },
    {
      "type": "power-platform",
      "name": "Incident Intake",
      "display": "iframe",
      "appUrl": "..."
    }
  ],
  "orgHierarchy": {
    "levels": ["organization", "region", "community", "unit"]
  },
  "branding": {
    "primaryColor": "#...",
    "clientLogoUrl": "..."
  }
}
```

Rules for Claude when working with this file:

- **Never** put a client secret, connection string, API key, or client secret value in the config document. Those are IDs and references only. A guard in `tenant-config.ts` refuses to load a document containing a secret-shaped key, and it runs on save as well as on load.
- The app resolves `CLIENT_ID` from the environment, fetches that client's document, and **fails loudly** if it is missing or malformed. There is deliberately **no fallback** to a file in the repo: a deployment with no config must stop, not quietly serve defaults or another client's settings.
- Config is cached in memory for `CONFIG_CACHE_TTL_SECONDS` (default 30). Each serving instance caches independently, so after an admin writes, other warm instances may serve the previous config until their window lapses. That staleness is bounded and accepted — do not build cross-instance invalidation for it.
- **Seeding is explicit and one-off** (`npm run seed-config`). It refuses to overwrite an existing document without `--force`, so it cannot silently discard what an admin changed through the portal.
- Code must never hardcode a specific client's ID, name, workspace ID, or any other client-specific value anywhere outside config. If you catch yourself writing a client name in a component, stop — that value belongs in config.

---

## 3a. Commands & local development

```bash
npm install
cp .env.example .env.local       # then fill AUTH_SECRET and ENTRA_CLIENT_SECRET
npm run dev                      # http://localhost:3000 (reads .env.local)
npm run build                    # production build (no CLIENT_ID needed — see below)
npm run start                    # serve the build; needs CLIENT_ID
npm run lint                     # eslint
npm run typecheck                # tsc --noEmit

npm run seed-config -- ./config/kestrelbrook/tenant.json   # seed the store
npm run seed-config -- ./config/kestrelbrook/tenant.json --force
```

The app will not start until its client config has been seeded and the store is
reachable — that is the fail-loud behaviour working, not a bug. Locally that
means `BLOB_READ_WRITE_TOKEN` in `.env.local` (`vercel env pull .env.local`).

- **`CLIENT_ID` is required to run, not to build.** The app fails loudly at startup
  without it (§3). `config/kestrelbrook/` is a placeholder client for local development —
  it is not a real client, and no real client config belongs in the repo.
- **Every route is `force-dynamic`, set in the root layout — do not remove it.** One
  container image is built once and deployed per client, each with its own
  `CLIENT_ID`. If routes were statically prerendered, the config of whichever client
  was set at build time would be baked into the HTML every other deployment serves.
  This is why `npm run build` must succeed with no `CLIENT_ID` present.
- **`tenant.json` is re-read on every request in development, cached once in
  production.** Editing config in dev takes effect immediately; in a deployment
  the config is immutable for the life of the container.
- **TypeScript is pinned to 6.x.** `eslint-config-next` pulls `typescript-eslint`,
  which does not yet support TypeScript 7. Bumping TS to 7 breaks `npm run lint`
  entirely — revisit only once typescript-eslint ships TS 7 support.

### Where things live

```
config/{CLIENT_ID}/tenant.json   non-secret client config (§3)
public/                          nuiq-logo.png, nuaig-logo.svg, nuaig-logo-white.svg (§8)
src/app/page.tsx                 Home hub (Tab 1) — animated hero + section cards
src/app/                         root layout = the shell; one folder per tab (§5)
src/components/                  TopNav, Footer, PageShell
src/lib/tenant-config.ts         CLIENT_ID -> config document, validation, fail-loud
src/lib/navigation.ts            the four tabs, fixed order, config-driven visibility
src/lib/session.ts               signed-in user + delegated Power BI token
src/lib/config-store/            ConfigStore interface + provider adapters (§3)
src/lib/dashboard-store.ts       dashboards derived from config (see §5 Tab 2)
src/lib/admin.ts                 who may administer this deployment (§6)
src/app/dashboards/manage/       admin add/remove screen, role-gated
scripts/seed-config.ts           one-off seeding of a client's config document
```

---

## 3b. Hosting: where this actually runs today

**Vercel is the current host, for the demo phase.** Azure Container Apps + Key
Vault + Managed Identity (§4, §7) remains the target for real production client
deployments — that decision is not reversed, it is deferred.

Accepted departures while on Vercel, all deliberate:

- **Secrets are Vercel project environment variables**, not Key Vault via
  Managed Identity. Vercel has no managed identity, so `AUTH_SECRET`,
  `ENTRA_CLIENT_SECRET` and the store token are static env vars. This is an
  accepted trade for the demo phase, **not** a new standard: a production client
  deployment goes back to Key Vault. Secrets still never enter the repo.
- **No storage versioning.** Vercel Blob does not support it natively, and the
  demo does not need it. Revisit when a production client moves to Azure Blob,
  where container-level versioning would make a bad config edit recoverable.
- **Preview deployments are unauthenticated.** Each preview gets a unique URL and
  Entra will not have it registered, so sign-in cannot work there. Do not build
  anything to work around this; use the stable production URL to test auth.

**Open — decide before any production client goes live: HIPAA / BAA posture.**
No PHI flows through NuIQ today (Power BI embedding happens in the browser under
the user's own identity, and the config document holds only identifiers), so
this is not blocking now. It is also not resolved: Vercel offers a BAA only on
its Enterprise tier, and §2 says design as if HIPAA applies. Answer this
deliberately rather than discovering it during a compliance review.

---

## 4. Tech stack (decided)

- **Frontend/App**: Next.js (App Router), TypeScript. SSR/API routes required (not a static export) — needed for Power BI embed token minting and server-side data calls.
- **Hosting**: Azure Container Apps, Consumption plan, one Container App per client. Containerized via a standard Next.js `output: 'standalone'` Dockerfile.
- **Auth**: NextAuth.js (Auth.js) with the Microsoft Entra ID provider. Single-tenant app registration per client deployment.
- **Data warehouse**: Microsoft Fabric (Warehouse/Lakehouse), already owned by clients — NuIQ does not provision or manage this.
- **BI**: Power BI, embedded via `powerbi-client-react` and server-minted embed tokens (Power BI REST API) — not plain iframe links, so row-level security and interactivity work.
- **Fabric data agents**: the client's own data agents published in their Fabric workspace, queried over the Fabric data agent API with Entra ID auth. These are distinct from the agent platforms below — they answer over the warehouse itself, and get their own tab. See §5 Tab 3.
- **Agent platforms**: Azure AI Foundry (custom chat UI calling the Agent Service REST API/SDK), Copilot Studio (web chat embed via Direct Line/Bot Framework Web Chat), Power Platform / Power Apps (iframe embed of the canvas app player URL). Support all three as pluggable agent "types" per client config — don't hardcode assumptions about which platform a given client uses. See §5 Tab 4.
- **Secrets**: Azure Key Vault per client, Managed Identity, no secrets in repo or in plain env files.

### Explicitly not using

- **No Microsoft Purview.** Lineage/catalog is built and owned by this app, not licensed. See §5.
- **No custom domain routing.** See §3.
- **No shared/multi-tenant runtime.** See §3.

---

## 5. The four core tabs

### App shell & top-level navigation

Every page renders inside one persistent shell: **top-level navigation panel** above, content below, **NuAIg footer credit** always present (§8). The shell is built once, in the App Router root layout — tabs render inside it, never alongside or in place of it.

- **Top nav only — no side nav.** The navigation menu is a horizontal bar across the top of the shell. Do not build a left sidebar, a collapsible rail, a hamburger drawer on desktop, or a split top+side arrangement. Four destinations fit comfortably in a top bar; a sidebar would spend horizontal space that Tabs 1 and 2 need — the React Flow canvas and embedded Power BI reports both want the full width.
- The nav panel is **always visible on every page**, including error, loading, and empty states. A user must never land somewhere with no way back to the other three tabs.
- It carries exactly the four top-level destinations, in the order given below (Home → Dashboards → Data Agents → AI Agents). Order is fixed; Home is the hub, then the reporting on the data, then the two ways of asking questions of it.
- The NuIQ mark sits in the nav panel as the app's identity and links to the default tab. The client's own logo/name (`branding.clientLogoUrl`, `displayName`) may appear alongside it, read from config — never hardcoded, and never replacing the NuIQ mark (§8).
- **Tabs are real routes, not client-side state.** Each is its own App Router segment with a deep-linkable URL, so a user can link a colleague to a specific dashboard or agent and browser back/forward behave correctly. Don't build a single page that swaps panels in local state.
- **Tabs a client hasn't configured hide themselves.** If `tenant.json` lists no `fabricDataAgents` or no `agents`, that tab does not render in the nav (Home and Dashboards always render — Dashboards because an admin adds the first dashboard from inside it) — driven by config, not by a hardcoded per-client check. Prefer hiding over rendering an empty tab.
- **The nav is presentation, not access control.** Hiding or omitting a nav item is never a substitute for the server-side checks in §6 — if a user shouldn't reach a route, the route itself must refuse them, not merely lack a link.
- Surface the signed-in user's current **facility scope** (§2) in the shell, so it's always clear which organization/region/community the numbers on screen represent. A user with scope over multiple communities viewing a census figure must be able to tell what it covers without leaving the page.

### Secondary routes

Not everything is a tab. `/about` (NuIQ and NuAIg background) is reached from the
footer, deliberately **not** from the top nav — the nav carries exactly the four
core destinations and adding a fifth would dilute it. Future secondary pages
(help, release notes, support) belong in the footer too.

Anything stated about NuAIg on `/about` must be sourced from nuaig.ai. Do not add
claims, metrics, leadership names, or client names that are not verifiable there.

### Tab 1 — Home (hub)

Route: `/`. The landing surface and the orientation point for someone who has
not used the portal before.

- **Hero: an animated picture of the data flow** — source systems (EHR,
  financial, staffing) → the Fabric warehouse → what NuIQ puts in front of it,
  with particles travelling the edges on a loop. Built as inline SVG, not a GIF:
  it stays sharp at any width, weighs kilobytes rather than megabytes, inherits
  the theme, and honours `prefers-reduced-motion`.
- **This hero is illustrative, not live lineage.** It draws the same shape for
  every client and reads nothing from the warehouse. Do not present it as, or
  quietly grow it into, real lineage.
- **Below the hero, the hub lists what is in the portal**: dashboards, Fabric
  data agents, and AI agents, each as a card naming the real configured items and
  linking through. These read from config and the dashboard store — never
  hardcode the counts or names.

**Open question — the lineage explorer has no home.** §1 still names "see the
data model and how data flows" as a core purpose, and the design below (schema
introspection, Fabric pipeline lineage, the hand-maintained fallback, React Flow
with clickable nodes) was Tab 1's job before it became the hub. That work is now
unplaced: it is too deep to live inside the hub hero, and there is no longer a
tab for it. Decide where it goes before building it — a sub-route of Home
(`/lineage`) is the obvious candidate — rather than assuming it was dropped.

Retained design for whenever it is built. Since Purview isn't available, lineage
is sourced by **one or both** of:

1. **Live schema introspection**: query `INFORMATION_SCHEMA.TABLES` / `INFORMATION_SCHEMA.COLUMNS` against the client's Fabric Warehouse SQL endpoint at request time or on a cache-refresh schedule. This is free — no additional licensing.
2. **Pipeline lineage via Fabric REST API**: pull pipeline definitions (Data Pipelines / Dataflows Gen2) and parse Copy/transform activities to derive `source → sink` edges. Store the resulting graph in a small first-party metadata store rather than recomputing it on every page load.
3. **Fallback / early-stage option**: a hand-maintained lineage config (YAML/JSON) per client describing the flow manually. A first-class, supported mode — not a hack — since some clients may launch on this before automation is built.

Rendering, when built: **React Flow**, animating data movement along edges, with
clickable nodes surfacing table detail (row counts, last refresh, description).
Do not attempt a general-purpose lineage crawler comparable to Purview.

### Tab 2 — Power BI Dashboards

**Identity model: user-owns-data.** Reports are embedded with the *signed-in
user's own* Entra token (`powerbi-client-react`, `tokenType: Aad`). Power BI
applies that person's permissions and row-level security directly. NuIQ holds no
service principal for Power BI and never asserts an identity on a user's behalf.

- **A user who lacks Power BI access sees nothing.** That is the intended
  behaviour, not a bug to work around: access is administered in Power BI, not in
  NuIQ. Every viewer therefore needs Power BI access and a licence (Free works
  only on an F64+ capacity; otherwise Pro or PPU).
- **Do not reintroduce a service principal / app-owns-data flow** to avoid those
  licences. It was considered and rejected: it means NuIQ mints tokens asserting
  who the user is, holds a secret that can read every community's data, and
  requires the RLS roles to be correct for that assertion to be safe.
- **Do not use "Publish to web".** It produces an embed URL that needs no
  authentication at all and is readable by anyone with the link — an outright
  exposure of census, falls, and incident data.
- Report list and workspace ID come from `tenant.json`; never hardcoded. A report
  id arriving in a URL must be matched against that config before it is passed to
  Power BI (`findReport`), so a user cannot request arbitrary reports.
- **`/dashboards` is a gallery of still-preview tiles, not a live report.**
  Opening a tile loads the real interactive report at `/dashboards/[reportId]`.
  Never embed on the index: N dashboards would mean N Power BI iframes loading
  at once, for reports nobody is reading yet.
- **Tile previews are supplied, not fetched.** Power BI publishes no public
  report-thumbnail API, so a tile uses `thumbnailUrl` when set and otherwise
  draws a deterministic facet placeholder. The placeholder is abstract on
  purpose — a fake mini chart would be a dashboard-template cliché (§8) and
  would imply data that is not really there. If real auto-generated thumbnails
  are wanted, the only supported route is the Power BI `exportToFile` API, which
  needs a capacity and runs asynchronously — it cannot be called per page load.
- **The Power BI token is refreshed, not just stored.** Entra access tokens last
  about an hour. `auth.ts` requests `offline_access`, keeps the refresh token on
  the JWT, and renews five minutes before expiry. Without this, returning to the
  portal after a break means Power BI rejects a stale token and the UI reports it
  as "no access" — wrong, and impossible for the user to act on. When renewal
  fails the session is marked expired and the UI says so, which is a different
  message from a genuine permission problem. Keep those two states distinct.
- **The Power BI embed must never be server-rendered.** `powerbi-client` is a
  browser bundle that touches `self` at import time, so evaluating it in Node
  kills the render worker — Next reports this as *"Jest worker encountered N
  child process exceptions"*, which names neither the module nor the cause.
  `"use client"` alone is not enough, because client components are still
  server-rendered. Two guards are needed and both must stay: `next/dynamic` with
  `ssr: false`, **and** a `useSyncExternalStore` browser gate in
  `PowerBiEmbed.tsx`. `ssr: false` alone left the import reachable from the
  module graph, which Next evaluates in a Node worker during route compilation —
  so the crash returned on hard refresh (which forces a recompile) while ordinary
  navigation was fine. The route also sets `dynamic = "force-dynamic"` at page
  level to stop static-path collection. Never add `generateStaticParams` here: it
  flips the route to SSG. Never import `PowerBiReportView` directly.
- **Dashboards live in the client's config document** (§3), which is editable at
  runtime — so there is one list, not a shipped baseline plus an overlay. Adding
  or removing a dashboard edits that document and takes effect without a
  redeploy.
- **Each dashboard carries its own `workspaceId`**, so one portal can show
  reports from several Fabric/Power BI workspaces. It falls back to
  `powerBi.workspaceId` when absent.
- **Writes are conditional.** `saveTenantConfig` passes the etag the document was
  read at; a concurrent edit raises `ConfigConflictError`, which the UI surfaces
  so the admin can reload and reapply. Never write unconditionally to "fix" a
  conflict — that discards someone else's change.
- **`/dashboards/manage` is gated on `ADMIN_EMAILS`**, enforced server-side in
  the actions (§6). Do not rely on the page hiding its controls.
- `facilityFilterField` is informational only. The filtering is enforced by RLS in
  the semantic model, not by anything NuIQ sends.

### Tab 3 — Fabric Data Agents

Purpose: let a user ask questions in natural language of the warehouse itself, through the data agents the client has already published in their Fabric workspace.

- **Assume more than one.** `tenant.json` carries a `fabricDataAgents` array, and a client will typically publish several — each scoped to a subject area (census, quality/incidents, staffing). The tab must render a list/switcher and support N agents; never build a UI that assumes a single agent and gets retrofitted later.
- Each entry names the agent's Fabric item `id`, its `workspaceId`, a display `name`, and a short `description`. All of it comes from config — no agent ids, names, or workspace ids in components.
- **Query on behalf of the signed-in user**, not via a service principal with blanket warehouse access. The user's own Entra ID identity is what makes the agent's answers respect their warehouse permissions and facility scope (§2). A shared high-privilege identity here would silently defeat the RLS posture Tab 2 enforces — if the on-behalf-of flow is hard to wire, flag it rather than falling back to a service principal.
- Chat UI is first-party (our own React chat surface calling the data agent endpoint server-side), not a vendor iframe — Fabric data agents do not ship a drop-in web-chat widget the way Copilot Studio does. Do not go looking for one.
- Where the agent returns the SQL or the tables it consulted, surface that as inspectable detail alongside the answer. Users acting on a census or falls number need to see where it came from; an unexplained number in this domain is worse than no number.
- Conversation state is per-user and per-session. Do not persist agent transcripts server-side without an explicit decision — see the PHI note under Tab 4, which applies here too.

### Tab 4 — AI Agents (Foundry / Copilot)

Purpose: surface the client's broader AI agents — the ones built on agent *platforms* rather than directly over the warehouse.

- Each client's `tenant.json` lists these under `agents`, each with a `type` field (`foundry`, `copilot-studio`, `power-platform`).
- **Presentation varies per agent, and that is the point of this tab.** Unlike Tab 3, these agents do not share one visual treatment: a Foundry agent renders in our own chat UI against the Agent Service API, a Copilot Studio agent renders as a Direct Line / Bot Framework Web Chat embed, a Power Platform agent is an iframe of the canvas app player URL. Drive this from a per-agent `display` field in config plus the `type`, and build one component per rendering mode — do not force all agents into one chat frame, and do not switch on `type` inline inside a single mega-component.
- New agent types and display modes should be addable by adding a component and a config entry, without touching the tab's own layout code.
- Agents not yet ready for full embed can render as a linked card instead of a live embed — this should be a graceful per-agent fallback, not a special-cased hack.
- Never route PHI-bearing free text into an agent platform without confirming that platform's data handling posture is appropriate for this client's compliance requirements — flag this rather than assuming it's fine. This matters more here than in Tab 3: a Fabric data agent stays inside the client's own Fabric tenant, whereas these platforms may carry data across a boundary the client has not reviewed.

---

## 6. Auth & access control

- NextAuth.js + Entra ID provider, single-tenant app registration per deployment.
- On sign-in, resolve the user's facility scope (organization/region/community/unit) from their Entra ID group membership or a mapping table — this scope must be attached to the session and checked on every data-fetching call, not just used to filter the UI. **Not yet built** (`src/lib/session.ts`): Tab 2 does not need it, because Power BI scopes against the user's own identity, but Tabs 1 and 3 read the warehouse and must not ship without it.
- Sign-in requests delegated Power BI scopes (`Report.Read.All`, `Dataset.Read.All`, `Workspace.Read.All`) alongside the OIDC scopes, so the same session can load dashboards as the user. These need admin consent on the app registration.
- Missing auth environment values degrade to a signed-out app with a visible notice, never a 500 on every page. See `isAuthConfigured()`.
- **Administration is gated on `ADMIN_EMAILS`** (comma-separated, per deployment) and checked server-side in every mutating action, not just in the page. It **fails closed**: an empty list means nobody is an admin. This is a deployment-time list, not a directory role — the production form is an Entra app role or group claim resolved at sign-in. Replace it, do not extend it.
- No client-side-only access control. Any RBAC check that matters must also be enforced server-side (API routes, Power BI RLS, warehouse query scoping).

---

## 7. Deployment notes (for context — CI/CD pipeline itself is a later task)

- Azure Container Apps, Consumption plan. Free tier: 180,000 vCPU-seconds, 360,000 GiB-seconds, and 2 million requests per month, per subscription. Configure scale-to-zero where traffic patterns allow it.
- One deployment = one client = one `CLIENT_ID` env var + one Key Vault + one Entra ID app registration + one default `*.azurecontainerapps.io` URL. No custom domains at this stage.
- CI/CD pipeline design (single build, multi-target deploy) is intentionally deferred — do not build pipeline YAML/workflows yet unless explicitly asked.

---

## 8. Branding & footer requirements

- Footer must always read **"Powered by NuAIg"** with the NuAIg logo (`/public/nuaig-logo.svg`, or `/public/nuaig-logo-white.svg` on a dark footer), on every page, in every client deployment. This is client-agnostic and must not be configurable away via `tenant.json`.
- **The NuAIg logos are footer-only.** `nuaig-logo.svg` / `nuaig-logo-white.svg` appear in the footer credit and nowhere else — not in the header/nav, not as the favicon, not as a loading or watermark graphic, not in the browser tab title bar. NuAIg is the builder's credit, not the product's identity.
- The NuIQ mark (`/public/nuiq-logo.png`, the origami peak) is the app's logo and the only logo used for the app itself — header/nav, favicon, loading/empty states, social preview. Per-client branding (`branding.primaryColor`, `branding.clientLogoUrl` in `tenant.json`) may customize accent color and optionally show a client logo alongside NuIQ's — but never replace the NuIQ mark or the NuAIg footer credit.
- **Asset placement is fixed.** All three logos live in `/public` and are referenced by absolute path (`/nuiq-logo.png`, `/nuaig-logo.svg`, `/nuaig-logo-white.svg`) — do not copy them into `src/`, inline them as base64, or import them as modules.
- The NuAIg wordmark's accent color is `#069BDF` (the only color that differs from the wordmark fill between the light and dark logo variants). It belongs to the NuAIg mark itself and stays in the footer with it — do not adopt it as a NuIQ accent. NuIQ's own palette stays in the deep indigo/blue facet family of `/public/nuiq-logo.png`.
- **Gradients belong to the app chrome, not to content.** The header, footer, and
  Home hero use one indigo gradient family (`.chrome-header` / `.chrome-footer`
  in `globals.css`) so the page is bracketed by the same material instead of two
  flat slabs. Content surfaces stay flat — data should never compete with
  decoration. No glows, no gradient text beyond the wordmark, no gradient on
  cards or charts.
- **The NuIQ wordmark carries a gradient; the mark never does.** The word "NuIQ" in the header and footer is rendered with a restrained white -> light blue -> indigo gradient (`bg-clip-text`). This is a deliberate, approved exception to the "no gradients" rule below, and applies to the *text* only — the origami mark PNG stays flat and untouched. Do not extend gradients to the mark, to backgrounds, or to UI chrome.
- Keep the visual language consistent with the origami mark's aesthetic: flat, precise, geometric, restrained color palette (deep indigo/blue family). Avoid generic dashboard-template visual clichés (bar-chart iconography, glowing gradients, stock "AI brain" imagery) anywhere in the product UI, not just the logo.

---

## 9. Working conventions for Claude in this repo

- **Never hardcode client-specific values** (names, IDs, colors, URLs) in components, API routes, or scripts. If a value could differ between clients, it belongs in `tenant.json` and must be read from config.
- **Never commit secrets.** If a task seems to require a secret in code or `.env` committed to the repo, stop and flag it — the answer is Key Vault + Managed Identity, not a checked-in key.
- **Respect the facility hierarchy** in every data model, query, and RBAC check touched — don't build flat/single-org assumptions "for now" that would need to be retrofitted later.
- **Prefer the config-as-code lineage fallback over blocking on automation** — if live Fabric metadata extraction isn't wired up yet for a feature, build against the YAML/JSON fallback so the feature still ships, rather than stalling.
- **Domain terminology matters** — use senior living/LTC-correct terms (community, not "location"; census, not "occupancy count" unless that's genuinely the client's term; falls/elopements/med errors as named metrics) rather than generic SaaS dashboard language.
- **Don't reintroduce Purview, domain-based routing, or a shared multi-tenant runtime** — these were explicitly decided against; if a task seems to push in that direction, flag it rather than silently building it.

---

## 10. Open / deferred (do not build yet unless asked)

- CI/CD pipeline (multi-deploy from one build)
- dbt adoption for lineage (possible future upgrade path if the client's transformation layer moves to dbt)
- Custom domains per client
- Automated Fabric pipeline lineage extraction (start with schema introspection + config fallback; automate pipeline-JSON parsing once the manual approach is validated)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
