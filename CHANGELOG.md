# Changelog

All notable changes to `n8n-nodes-plutio-mates`.

## 0.4.0 — 2026-05-06

Mark the node as `usableAsTool: true` so n8n AI Agents can call it directly without needing the `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true` environment variable.

### Added

- `usableAsTool: true` on the Plutio (MATES) node description. With this flag, an n8n AI Agent can wire the node as an `ai_tool` subnode and call any Plutio operation (search People, create Contracts, list Tasks, etc.) using the agent's `$fromAI()` parameter mechanism — no extra env config required on the host.

### Why

n8n's AI Agent + Tool pattern only allows community nodes to be used as tools when either (a) the host has set `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true`, or (b) the node opts in via `usableAsTool: true` in its description. Adding the flag makes the node "AI-ready" out of the box, removing a sharp edge for self-hosted users.

### Usage

In an n8n workflow with an AI Agent, drag in the **Plutio (MATES)** node and connect it to the agent's `Tool` slot. Configure the resource + operation as normal. Use `$fromAI('paramName', 'description', 'string')` in any field where the agent should fill in a value at runtime — for example, a regex search query on the `q` field, or an `_id` to update a specific record.

## 0.3.0 — 2026-05-05

Renamed for side-by-side install with the original `n8n-nodes-plutio`.

### Breaking

- **Node internal name:** `plutio` → `plutioMates`
- **Node display name:** `Plutio` → `Plutio (MATES)`
- **Credential internal name:** `plutioApi` → `plutioMatesApi`
- **Credential display name:** `Plutio API` → `Plutio (MATES) API`

### Why

The original Chykalophia `n8n-nodes-plutio` and this fork both registered a node identifier of `plutio` and credential of `plutioApi`. Installing both side-by-side caused n8n to refuse the second install with "There is already an entry with this name". Renaming this fork lets the two coexist so existing workflows that reference the original keep working untouched, and new workflows can use the expanded coverage here.

### Migration

If you already had `@matesincorporated/n8n-nodes-plutio` or `n8n-nodes-plutio-mates@0.2.0` installed:

1. Uninstall it (Settings → Community Nodes → uninstall)
2. Install `n8n-nodes-plutio-mates@0.3.0`
3. Recreate the credential as **Plutio (MATES) API** (same fields: Business, Client ID, Client Secret)
4. Update any existing workflows: open each Plutio (MATES) node and re-pick the renamed credential

The original `n8n-nodes-plutio` and any workflows depending on it are unaffected.

## 0.2.0 — 2026-05-05

Hard fork from `n8n-nodes-plutio@0.1.1` by Chykalophia. Major restructure to support full Plutio v1.11 API surface.

### Added

- **Full v1.11 resource coverage** (~40 resources, was 6):
  Workspace, Custom Field, Person, Company, Profile, Role, Project, Task Board, Task Group, Task, Status, Time Entry, Category, Scheduler, Event, Invoice, Invoice Subscription, Transaction, Proposal, Contract, Form, Form Response, Template, Section, Block, Snippet, Note, Item, Wiki, Wiki Page, Folder, File, Conversation, Messenger, Comment, Dashboard, Dashboard Page, Dashboard Data, Archive, Trash.
- **Per-execution OAuth2 token caching** — token is fetched once per execution and reused, with automatic refresh on 401.
- **`Return All` pagination** on every list operation (uses `skip`/`limit`, stops when a page is short).
- **MongoDB-style filtering** via the `q` parameter (exposed as "Filter (q, JSON)" on every Get Many).
- **`Additional Fields (JSON)` escape hatch** on Create/Update so any Plutio field can be set without waiting for an explicit form mapping.
- **New operations** beyond the original CRUD: `Archive`, `Move`, `Copy`, `Bulk Update`, `Bulk Delete`, `Bulk Archive` — wherever the Plutio endpoint supports them.

### Changed

- **API base URL** bumped from `api.plutio.com/v1.10` to `api.plutio.com/v1.11`.
- **Architecture:** per-resource description files replaced by a runtime resource registry. `Plutio.node.ts` shrunk from 1602 → 67 lines; net ~1100 lines for full coverage instead of the ~12k+ that hand-written description files would require.
- **Credential schema:** `Client Secret` is now a password field. Documentation URL added.

### Fixed

- Filename casing bug in `descriptions/index.ts` (`peopleDescription.ts` was imported as `./PeopleDescription`, broken on case-sensitive filesystems).
- Token was re-fetched on every API call. Caching reduces this to one fetch per execution, freeing rate-limit budget for actual work.

### Migration

If you used `n8n-nodes-plutio@0.1.x`, update your existing nodes:

1. Uninstall: `npm uninstall n8n-nodes-plutio`
2. Install: `npm install n8n-nodes-plutio-mates`
3. Existing workflow nodes will need the credential reconnected (same fields, new credential type name = `plutioApi` — should auto-match by name).
4. The Resource dropdown's option labels are unchanged for the 6 original resources, but new options are now available.

## 0.1.1 and earlier

See the [original repo](https://git.cklph.dev/Chykalophia/n8n-nodes-plutio).
