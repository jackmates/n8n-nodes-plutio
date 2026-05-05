# Changelog

All notable changes to `@matesincorporated/n8n-nodes-plutio`.

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
2. Install: `npm install @matesincorporated/n8n-nodes-plutio`
3. Existing workflow nodes will need the credential reconnected (same fields, new credential type name = `plutioApi` — should auto-match by name).
4. The Resource dropdown's option labels are unchanged for the 6 original resources, but new options are now available.

## 0.1.1 and earlier

See the [original repo](https://git.cklph.dev/Chykalophia/n8n-nodes-plutio).
