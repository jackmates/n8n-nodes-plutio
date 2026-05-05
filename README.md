# @matesincorporated/n8n-nodes-plutio

[![npm version](https://img.shields.io/npm/v/@matesincorporated/n8n-nodes-plutio.svg)](https://www.npmjs.com/package/@matesincorporated/n8n-nodes-plutio)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.md)

An n8n community node for [Plutio](https://plutio.com) — full coverage of the Plutio public API v1.11.

This is a hard fork of [Chykalophia/n8n-nodes-plutio](https://git.cklph.dev/Chykalophia/n8n-nodes-plutio), extended by [MATES Incorporated](https://matesincorporated.com) to cover every documented Plutio v1.11 resource. The original repo covered Tasks, Projects, Comments, Invoices, Companies and People; this fork brings it up to ~40 resources.

## Features

- **Bumped to API v1.11** (was v1.10)
- **Per-execution OAuth2 token caching** — avoids burning rate limit on duplicate `/oauth/token` calls
- **Pagination helper** — `Return All` toggle on every list operation, automatic `skip`/`limit` paging
- **MongoDB-style filtering** — pass `q` JSON to use Plutio's `$regex`, `$or`, `$and`, `$elemMatch`, `$gte`, `$lte`, `$in`, `$size` operators
- **Full coverage** of every documented Plutio v1.11 resource

### Resources

| Group | Resources |
|---|---|
| Workspace | Workspace, Custom Field, Profile, Role |
| People & Companies | Person, Company |
| Projects & Tasks | Project, Task Board, Task Group, Task, Status |
| Tracking | Time Entry, Category |
| Scheduling | Scheduler, Event |
| Finance | Invoice, Invoice Subscription, Transaction, Proposal |
| Documents | Contract, Form, Form Response, Template, Section, Block |
| Content | Snippet, Note, Item, Wiki, Wiki Page |
| Files | Folder, File |
| Messaging | Conversation, Messenger, Comment |
| Dashboards | Dashboard, Dashboard Page, Dashboard Data |
| System | Archive, Trash |

### Operations

For each resource, the node exposes the verbs supported by that resource's endpoint:

`Get Many`, `Get`, `Create`, `Update`, `Delete`, `Archive`, `Move`, `Copy`, `Bulk Update`, `Bulk Delete`, `Bulk Archive`

Plus an "Additional Fields (JSON)" escape hatch on Create/Update so you can send any field the Plutio API accepts that's not already exposed in the form UI.

## Install

### n8n Cloud / Desktop UI

Settings → Community Nodes → Install → enter:

```
@matesincorporated/n8n-nodes-plutio
```

### Self-hosted (Docker)

```dockerfile
FROM n8nio/n8n
USER root
RUN npm install -g @matesincorporated/n8n-nodes-plutio
USER node
```

Or set `N8N_NODES_INCLUDE` to `["@matesincorporated/n8n-nodes-plutio"]`.

### Self-hosted (npm)

```bash
cd ~/.n8n
npm install @matesincorporated/n8n-nodes-plutio
```

Then restart n8n.

### Self-hosted (direct from GitHub — no npm account needed)

```bash
cd ~/.n8n
npm install github:jackmates/n8n-nodes-plutio
```

Then restart n8n. Use this if you haven't published to npm yet.

## Credentials

In Plutio: **Settings → API → Create Application**. You'll get a Client ID and Client Secret.

In n8n, create a new "Plutio API" credential with:

- **Business (Subdomain)** — e.g. `matesincorporated` for `matesincorporated.plutio.com`
- **Client ID**
- **Client Secret**

The node uses the OAuth 2 client_credentials grant. Tokens are cached per-execution and refreshed automatically.

## Filtering with `q`

Plutio's GET endpoints accept a MongoDB-style query in the `q` param. This node exposes that as the **Filter (q, JSON)** field on every Get Many operation.

Examples:

```json
// All incomplete tasks assigned to a person
{"$and":[{"status":"incomplete"},{"assignedTo":"PERSON_ID"}]}

// Tasks containing "website" in the title (case-insensitive)
{"title":{"$regex":"website","$options":"i"}}

// Records matching a custom field value
{"customFields":{"$elemMatch":{"_id":"FIELD_ID","value":"your value"}}}

// Date range
{"dueDate":{"$gte":"2026-01-01T00:00:00.000Z","$lte":"2026-12-31T23:59:59.000Z"}}
```

## Custom fields

Custom field values live in a `customFields` array on each record. Pass them as JSON when creating/updating:

```json
[
  { "_id": "EN5secC9M8FNcGF2f", "type": "text", "value": "PT123456789" }
]
```

The custom field `_id`s are visible in the Plutio admin UI, and you can list them via the **Custom Field → Get Many** operation in this node.

## Rate limits

Plutio limits each API key to 1000 requests/hour. This node:

- caches the access token per execution (one `/oauth/token` per workflow run, not per call)
- exposes a `Return All` toggle so you only page when you need to
- bubbles up 429 errors as `NodeApiError` so n8n's retry/backoff settings apply

## Development

```bash
git clone https://github.com/jackmates/n8n-nodes-plutio.git
cd n8n-nodes-plutio
npm install
npm run build       # tsc + gulp build:icons
npm run dev         # tsc --watch
npm run lint
```

To test inside a local n8n install:

```bash
# In this repo
npm run build
npm link

# In your n8n install (e.g. ~/.n8n)
npm link @matesincorporated/n8n-nodes-plutio
```

Then restart n8n. The Plutio node will appear in the node palette.

## Releasing

Tag a commit with `vX.Y.Z` and push to GitHub. The release workflow publishes to npm:

```bash
npm version patch -m "Release v%s"
git push --follow-tags
```

The `NPM_TOKEN` secret must be set in the GitHub repo settings.

## Architecture

The node uses a **runtime resource registry** instead of per-resource description files:

- `nodes/Plutio/resources.ts` — single source of truth for every resource (path, capabilities, fields)
- `nodes/Plutio/resourceFactory.ts` — generates n8n `INodeProperties[]` from the registry at module-load
- `nodes/Plutio/executeOperation.ts` — generic CRUD dispatcher that maps capability → HTTP call
- `nodes/Plutio/Plutio.node.ts` — thin shell that wires it all together
- `nodes/Plutio/GenericFunctions.ts` — auth + pagination helpers

To add a resource, edit `resources.ts`. Adding a new endpoint to an existing resource means adding a capability there too — usually nothing else.

## License

MIT — same as the original. See [LICENSE.md](LICENSE.md).

## Credits

- **Original repo:** [Chykalophia/n8n-nodes-plutio](https://git.cklph.dev/Chykalophia/n8n-nodes-plutio) by Peter Krzyzek and Joel Sanguenza
- **This fork:** [MATES Incorporated](https://matesincorporated.com)
- **Plutio API docs:** https://docs.plutio.com
