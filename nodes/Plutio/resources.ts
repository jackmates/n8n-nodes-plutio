/**
 * Plutio API v1.11 — resource registry
 *
 * Single source of truth for every resource this node exposes.
 * Add a new resource here and it automatically appears in the n8n UI
 * with the right Operations dropdown.
 *
 * Capabilities are CRUD-style verbs that map onto Plutio API endpoints:
 *
 *   list         → GET    /<path>
 *   get          → GET    /<path>?_id=<id>   (filter on _id)
 *   create       → POST   /<path>
 *   update       → PUT    /<path>
 *   delete       → DELETE /<path>
 *   archive      → POST   /<path>/archive
 *   move         → POST   /<path>/move
 *   copy         → POST   /<path>/copy
 *   bulkUpdate   → PUT    /<path>/bulk
 *   bulkDelete   → DELETE /<path>/bulk
 *   bulkArchive  → POST   /<path>/bulk/archive
 *
 * Field hints below drive the form UI for create/update — they're a
 * curated subset of each resource's most-edited fields. For the long
 * tail of design/layout fields the `additionalFields` JSON parameter
 * on each operation lets users send anything the API accepts.
 */

import { INodePropertyOptions } from 'n8n-workflow';

export type Capability =
	| 'list'
	| 'get'
	| 'create'
	| 'update'
	| 'delete'
	| 'archive'
	| 'move'
	| 'copy'
	| 'bulkUpdate'
	| 'bulkDelete'
	| 'bulkArchive';

export interface PlutioField {
	name: string;
	displayName: string;
	type: 'string' | 'number' | 'boolean' | 'dateTime' | 'options' | 'json' | 'multiOptions';
	default?: any;
	description?: string;
	required?: boolean;
	options?: INodePropertyOptions[];
	placeholder?: string;
}

export interface PlutioResource {
	/** Internal name used in dropdowns. Lowercase, no spaces. */
	name: string;
	/** Display name (singular). */
	displayName: string;
	/** Display name (plural), used in 'Get Many <plural>'. */
	pluralName: string;
	/** REST path, e.g. '/tasks'. No trailing slash. */
	path: string;
	/** Operations to expose for this resource. */
	capabilities: Capability[];
	/** Curated writable fields shown in the create/update form. */
	fields?: PlutioField[];
	/** Required fields when creating. Defaults to []. */
	createRequired?: string[];
	/** Short doc shown next to the Resource option. */
	description?: string;
}

// Reusable field templates -------------------------------------------------

const F = {
	id: { name: '_id', displayName: 'ID', type: 'string', default: '', required: true } as PlutioField,
	ids: { name: '_ids', displayName: 'IDs (comma separated)', type: 'string', default: '', required: true, description: 'Comma-separated list of IDs for bulk operations' } as PlutioField,
	title: { name: 'title', displayName: 'Title', type: 'string', default: '' } as PlutioField,
	name: { name: 'name', displayName: 'Name', type: 'string', default: '' } as PlutioField,
	descriptionHTML: { name: 'descriptionHTML', displayName: 'Description (HTML)', type: 'string', default: '' } as PlutioField,
	descriptionPlain: { name: 'descriptionPlain', displayName: 'Description (plain)', type: 'string', default: '' } as PlutioField,
	isArchived: { name: 'isArchived', displayName: 'Is Archived', type: 'boolean', default: false } as PlutioField,
	currency: { name: 'currency', displayName: 'Currency (ISO)', type: 'string', default: 'USD', placeholder: 'USD, EUR, GBP…' } as PlutioField,
	startDate: { name: 'startDate', displayName: 'Start Date', type: 'dateTime', default: '' } as PlutioField,
	endDate: { name: 'endDate', displayName: 'End Date', type: 'dateTime', default: '' } as PlutioField,
	dueDate: { name: 'dueDate', displayName: 'Due Date', type: 'dateTime', default: '' } as PlutioField,
	projectId: { name: 'projectId', displayName: 'Project ID', type: 'string', default: '' } as PlutioField,
	taskBoardId: { name: 'taskBoardId', displayName: 'Task Board ID', type: 'string', default: '' } as PlutioField,
	taskGroupId: { name: 'taskGroupId', displayName: 'Task Group ID', type: 'string', default: '' } as PlutioField,
	customFields: { name: 'customFields', displayName: 'Custom Fields (JSON array)', type: 'json', default: '[]', description: 'Array of {_id, type, value} objects.' } as PlutioField,
	clientObj: { name: 'client', displayName: 'Client (JSON)', type: 'json', default: '{}', description: '{ "_id": "<personOrCompanyId>", "entityType": "person" | "company" }' } as PlutioField,
};

const STD_OPS_FOR_FINANCIAL: Capability[] = ['list', 'get', 'create', 'update', 'delete', 'archive', 'bulkUpdate', 'bulkDelete', 'bulkArchive'];
const STD_OPS_FULL_CRUD: Capability[] = ['list', 'get', 'create', 'update', 'delete'];
const STD_OPS_FULL_CRUD_BULK: Capability[] = ['list', 'get', 'create', 'update', 'delete', 'bulkUpdate', 'bulkDelete'];

// The registry ------------------------------------------------------------

export const RESOURCES: PlutioResource[] = [
	{
		name: 'workspace',
		displayName: 'Workspace',
		pluralName: 'Workspaces',
		path: '/businesses',
		capabilities: ['list', 'update'],
		description: 'Your Plutio workspace (a.k.a. business).',
	},
	{
		name: 'customField',
		displayName: 'Custom Field',
		pluralName: 'Custom Fields',
		path: '/custom-fields',
		capabilities: STD_OPS_FULL_CRUD,
		createRequired: ['entityType', 'title'],
		fields: [
			F.title,
			{ name: 'entityType', displayName: 'Entity Type', type: 'options', default: 'person', required: true,
				options: [
					{ name: 'Business', value: 'business' }, { name: 'Company', value: 'company' },
					{ name: 'Contract', value: 'contract' }, { name: 'Conversation', value: 'conversation' },
					{ name: 'File', value: 'file' }, { name: 'Form', value: 'form' },
					{ name: 'Invoice', value: 'invoice' }, { name: 'Invoice Subscription', value: 'invoice-subscription' },
					{ name: 'Person', value: 'person' }, { name: 'Project', value: 'project' },
					{ name: 'Proposal', value: 'proposal' }, { name: 'Scheduler', value: 'scheduler' },
					{ name: 'Task', value: 'task' }, { name: 'Transaction', value: 'transaction' },
				] },
			{ name: 'inputType', displayName: 'Input Type', type: 'options', default: 'text', options: [
				{ name: 'Checkbox', value: 'checkbox' }, { name: 'Contact', value: 'contact' },
				{ name: 'Currency', value: 'currency' }, { name: 'Date', value: 'date' },
				{ name: 'Link', value: 'link' }, { name: 'Multi-select', value: 'multi' },
				{ name: 'Multirange', value: 'multirange' }, { name: 'Rating', value: 'rating' },
				{ name: 'Select', value: 'select' }, { name: 'Slider', value: 'slider' },
				{ name: 'Text', value: 'text' },
			] },
			{ name: 'options', displayName: 'Options (JSON array)', type: 'json', default: '[]', description: 'For select/multi: array of { name, color, textColor, index }.' },
		],
		description: 'Plutio custom fields. Pin "Budget" on projects, "Priority" on tasks, etc.',
	},
	{
		name: 'person',
		displayName: 'Person',
		pluralName: 'People',
		path: '/people',
		capabilities: ['list', 'get', 'create', 'update', 'delete', 'archive', 'bulkUpdate', 'bulkDelete', 'bulkArchive'],
		createRequired: ['name', 'role'],
		fields: [
			{ name: 'name', displayName: 'Name (JSON)', type: 'json', default: '{"first":"","last":""}', description: '{ "first": "Jane", "last": "Doe" }', required: true },
			{ name: 'role', displayName: 'Role Slug', type: 'string', default: '', required: true, description: 'Role slug (e.g. "client", "contributor"). Get from Roles resource.' },
			{ name: 'contactEmails', displayName: 'Contact Emails (JSON array)', type: 'json', default: '[]', description: '[{ "address": "x@y", "type": "work" }]' },
			{ name: 'contactPhones', displayName: 'Contact Phones (JSON array)', type: 'json', default: '[]' },
			{ name: 'address', displayName: 'Address (JSON)', type: 'json', default: '{}', description: '{ street, city, country, zipCode }' },
			F.customFields,
		],
		description: 'Contacts: clients, leads, freelancers, vendors.',
	},
	{
		name: 'company',
		displayName: 'Company',
		pluralName: 'Companies',
		path: '/companies',
		capabilities: STD_OPS_FULL_CRUD_BULK,
		createRequired: ['title'],
		fields: [
			F.title,
			{ name: 'industry', displayName: 'Industry', type: 'string', default: '' },
			{ name: 'contactEmails', displayName: 'Contact Emails (JSON array)', type: 'json', default: '[]' },
			{ name: 'contactPhones', displayName: 'Contact Phones (JSON array)', type: 'json', default: '[]' },
			{ name: 'address', displayName: 'Address (JSON)', type: 'json', default: '{}' },
			{ name: 'people', displayName: 'People Links (JSON array)', type: 'json', default: '[]', description: '[{ "_id": "<personId>", "isManager": true, "role": "..." }]' },
			F.customFields,
		],
	},
	{
		name: 'profile',
		displayName: 'Profile',
		pluralName: 'Profiles',
		path: '/profiles',
		capabilities: ['list'],
		description: 'Workspace login accounts (read-only).',
	},
	{
		name: 'role',
		displayName: 'Role',
		pluralName: 'Roles',
		path: '/roles',
		capabilities: STD_OPS_FULL_CRUD,
		createRequired: ['title'],
		fields: [
			F.title,
			{ name: 'permissions', displayName: 'Permissions (JSON array)', type: 'json', default: '[]', description: 'Array of permission slugs. See API docs for full list.' },
		],
	},
	{
		name: 'project',
		displayName: 'Project',
		pluralName: 'Projects',
		path: '/projects',
		capabilities: ['list', 'get', 'create', 'update', 'delete', 'archive', 'move', 'copy', 'bulkUpdate', 'bulkDelete', 'bulkArchive'],
		fields: [
			F.name,
			{ name: 'description', displayName: 'Description (plain)', type: 'string', default: '' },
			F.startDate, F.dueDate, F.currency,
			{ name: 'budget', displayName: 'Budget (JSON)', type: 'json', default: '{}', description: '{ "amount": 5000 }' },
			{ name: 'isBillable', displayName: 'Is Billable', type: 'boolean', default: true },
			{ name: 'billingRate', displayName: 'Billing Rate', type: 'number', default: 0 },
			{ name: 'clients', displayName: 'Clients (JSON array)', type: 'json', default: '[]', description: '[{ "_id": "...", "entityType": "person"|"company" }]' },
			{ name: 'contributors', displayName: 'Contributor Profile IDs (JSON array)', type: 'json', default: '[]' },
			F.customFields,
		],
	},
	{
		name: 'taskBoard',
		displayName: 'Task Board',
		pluralName: 'Task Boards',
		path: '/task-boards',
		capabilities: ['list', 'get', 'create', 'update', 'delete', 'archive', 'move', 'copy'],
		createRequired: ['title'],
		fields: [F.title, F.projectId],
	},
	{
		name: 'taskGroup',
		displayName: 'Task Group',
		pluralName: 'Task Groups',
		path: '/task-groups',
		capabilities: ['list', 'get', 'create', 'update', 'delete', 'archive', 'move', 'copy'],
		createRequired: ['taskBoardId'],
		fields: [F.title, F.taskBoardId, F.projectId, { name: 'color', displayName: 'Color (hex)', type: 'string', default: '' }],
	},
	{
		name: 'task',
		displayName: 'Task',
		pluralName: 'Tasks',
		path: '/tasks',
		capabilities: ['list', 'get', 'create', 'update', 'delete', 'archive', 'move', 'copy', 'bulkUpdate', 'bulkDelete', 'bulkArchive'],
		fields: [
			F.title, F.descriptionHTML, F.projectId, F.taskBoardId, F.taskGroupId,
			F.startDate, F.dueDate,
			{ name: 'assignedTo', displayName: 'Assigned To (Profile IDs JSON array)', type: 'json', default: '[]' },
			{ name: 'status', displayName: 'Status', type: 'options', default: 'incomplete', options: [
				{ name: 'Incomplete', value: 'incomplete' }, { name: 'Completed', value: 'completed' }, { name: 'Overdue', value: 'overdue' },
			] },
			{ name: 'parentTaskId', displayName: 'Parent Task ID (for subtasks)', type: 'string', default: '' },
			F.customFields,
		],
	},
	{
		name: 'status',
		displayName: 'Status',
		pluralName: 'Statuses',
		path: '/statuses',
		capabilities: ['list', 'get', 'create', 'update', 'delete', 'move'],
		createRequired: ['entityType', 'title'],
		fields: [
			F.title,
			{ name: 'entityType', displayName: 'Entity Type', type: 'options', default: 'project', required: true, options: [
				{ name: 'Conversation', value: 'conversation' }, { name: 'Project', value: 'project' },
			] },
			{ name: 'color', displayName: 'Color (hex)', type: 'string', default: '' },
			{ name: 'type', displayName: 'Type', type: 'options', default: 'open', options: [
				{ name: 'Active', value: 'active' }, { name: 'Closed', value: 'closed' },
				{ name: 'Completed', value: 'completed' }, { name: 'Open', value: 'open' },
			] },
		],
	},
	{
		name: 'timeTrack',
		displayName: 'Time Entry',
		pluralName: 'Time Entries',
		path: '/time-tracks',
		capabilities: STD_OPS_FULL_CRUD_BULK,
		fields: [
			F.title, F.descriptionPlain, F.projectId,
			{ name: 'taskId', displayName: 'Task ID', type: 'string', default: '' },
			{ name: 'personId', displayName: 'Person ID (the contractor)', type: 'string', default: '' },
			{ name: 'startedAt', displayName: 'Started At', type: 'dateTime', default: '' },
			{ name: 'stoppedAt', displayName: 'Stopped At', type: 'dateTime', default: '' },
			{ name: 'time', displayName: 'Duration (minutes)', type: 'number', default: 0 },
			{ name: 'billingRate', displayName: 'Billing Rate', type: 'number', default: 0 },
			{ name: 'billingStatus', displayName: 'Billing Status', type: 'options', default: 'unpaid', options: [
				{ name: 'Invoiced', value: 'invoiced' }, { name: 'Non-billable', value: 'non-billable' },
				{ name: 'Paid', value: 'paid' }, { name: 'Unpaid', value: 'unpaid' },
			] },
			{ name: 'isManualTime', displayName: 'Is Manual Entry', type: 'boolean', default: true },
			F.customFields,
		],
	},
	{
		name: 'category',
		displayName: 'Category',
		pluralName: 'Categories',
		path: '/categories',
		capabilities: STD_OPS_FULL_CRUD,
		createRequired: ['entityType', 'title'],
		fields: [
			F.title,
			{ name: 'entityType', displayName: 'Entity Type', type: 'options', default: 'canned-response', required: true, options: [
				{ name: 'Canned Response', value: 'canned-response' },
			] },
			F.descriptionPlain,
		],
	},
	{
		name: 'scheduler',
		displayName: 'Scheduler',
		pluralName: 'Schedulers',
		path: '/scheduler',
		capabilities: ['list', 'get', 'create', 'update', 'delete', 'archive', 'copy', 'bulkUpdate', 'bulkDelete', 'bulkArchive'],
		fields: [
			F.name, F.title, F.descriptionPlain,
			{ name: 'durations', displayName: 'Durations (JSON array)', type: 'json', default: '[{"duration":30}]', description: '[{ "duration": 30, "costRate": 0 }]' },
			{ name: 'locationType', displayName: 'Location Type', type: 'options', default: 'google-meet', options: [
				{ name: 'Google Meet', value: 'google-meet' }, { name: 'Zoom', value: 'zoom' },
				{ name: 'Address', value: 'address' }, { name: 'Manual Link', value: 'manual-link' },
			] },
			{ name: 'isCollectPayment', displayName: 'Collect Payment on Booking', type: 'boolean', default: false },
		],
	},
	{
		name: 'event',
		displayName: 'Event',
		pluralName: 'Events',
		path: '/events',
		capabilities: STD_OPS_FULL_CRUD,
		createRequired: ['startDate', 'title'],
		fields: [
			F.title, F.descriptionPlain, F.startDate, F.endDate,
			{ name: 'isAllDay', displayName: 'All Day', type: 'boolean', default: false },
			{ name: 'participants', displayName: 'Participants (Profile IDs JSON array)', type: 'json', default: '[]' },
			F.projectId,
		],
	},
	{
		name: 'invoice',
		displayName: 'Invoice',
		pluralName: 'Invoices',
		path: '/invoices',
		capabilities: STD_OPS_FOR_FINANCIAL,
		fields: [
			F.name, F.currency, F.clientObj, F.projectId,
			{ name: 'amount', displayName: 'Amount', type: 'number', default: 0 },
			{ name: 'subTotal', displayName: 'Subtotal', type: 'number', default: 0 },
			{ name: 'tax', displayName: 'Tax (JSON array)', type: 'json', default: '[]', description: '[{ "title": "VAT", "value": 20 }]' },
			{ name: 'discount', displayName: 'Discount', type: 'string', default: '' },
			F.dueDate,
			{ name: 'issueDate', displayName: 'Issue Date', type: 'dateTime', default: '' },
			{ name: 'reference', displayName: 'Reference', type: 'string', default: '' },
			F.customFields,
		],
	},
	{
		name: 'subscription',
		displayName: 'Invoice Subscription',
		pluralName: 'Invoice Subscriptions',
		path: '/invoice-subscriptions',
		capabilities: STD_OPS_FULL_CRUD_BULK,
		fields: [
			F.title, F.currency, F.clientObj,
			{ name: 'amount', displayName: 'Amount per Cycle', type: 'number', default: 0 },
			F.startDate, F.endDate,
			{ name: 'repeat', displayName: 'Repeat (JSON)', type: 'json', default: '{"intervalType":"month","interval":1}', description: '{ intervalType: day|week|month|year, interval: <n> }' },
			{ name: 'status', displayName: 'Status', type: 'options', default: 'active', options: [
				{ name: 'Active', value: 'active' }, { name: 'Cancelled', value: 'cancelled' },
				{ name: 'Draft', value: 'draft' }, { name: 'Failed', value: 'failed' },
				{ name: 'Past Due', value: 'past_due' }, { name: 'Paused', value: 'paused' },
			] },
			F.customFields,
		],
	},
	{
		name: 'transaction',
		displayName: 'Transaction',
		pluralName: 'Transactions',
		path: '/transactions',
		capabilities: ['list', 'get', 'create', 'update', 'delete', 'archive', 'copy', 'bulkUpdate', 'bulkDelete', 'bulkArchive'],
		fields: [
			F.title, F.currency, F.clientObj,
			{ name: 'amount', displayName: 'Amount', type: 'number', default: 0 },
			{ name: 'invoiceId', displayName: 'Invoice ID', type: 'string', default: '' },
			{ name: 'type', displayName: 'Direction', type: 'options', default: 'in', options: [
				{ name: 'In (Money received)', value: 'in' }, { name: 'Out (Money sent)', value: 'out' },
			] },
			{ name: 'manualPaymentMethod', displayName: 'Manual Payment Method', type: 'options', default: 'wire-transfer', options: [
				{ name: 'Cash', value: 'cash' }, { name: 'Check', value: 'check' },
				{ name: 'Credit', value: 'credit' }, { name: 'Debit', value: 'debit' },
				{ name: 'Wire Transfer', value: 'wire-transfer' },
			] },
			{ name: 'issueDate', displayName: 'Issue Date', type: 'dateTime', default: '' },
		],
	},
	{
		name: 'proposal',
		displayName: 'Proposal',
		pluralName: 'Proposals',
		path: '/proposals',
		capabilities: STD_OPS_FOR_FINANCIAL,
		fields: [
			F.name, F.currency, F.clientObj, F.projectId,
			{ name: 'amount', displayName: 'Amount', type: 'number', default: 0 },
			{ name: 'autoInvoice', displayName: 'Auto-create Invoice on Accept', type: 'boolean', default: false },
			{ name: 'autoProject', displayName: 'Auto-create Project on Accept', type: 'boolean', default: false },
			{ name: 'autoInvoiceTemplateId', displayName: 'Auto Invoice Template ID', type: 'string', default: '' },
			{ name: 'contractTemplateId', displayName: 'Contract Template ID (chained)', type: 'string', default: '' },
			{ name: 'templateId', displayName: 'Template ID', type: 'string', default: '' },
			F.customFields,
		],
	},
	{
		name: 'contract',
		displayName: 'Contract',
		pluralName: 'Contracts',
		path: '/contracts',
		capabilities: STD_OPS_FOR_FINANCIAL,
		fields: [
			F.name, F.projectId,
			{ name: 'templateId', displayName: 'Template ID', type: 'string', default: '' },
			{ name: 'signees', displayName: 'Signees (JSON array)', type: 'json', default: '[]', description: '[{ "_id": "<personOrCompanyId>", "entityType": "person"|"company" }]' },
			{ name: 'entityId', displayName: 'Linked Entity ID (e.g. proposal)', type: 'string', default: '' },
			{ name: 'entityType', displayName: 'Linked Entity Type', type: 'options', default: 'proposal', options: [{ name: 'Proposal', value: 'proposal' }] },
			F.customFields,
		],
		description: 'Multi-signee electronic agreements.',
	},
	{
		name: 'form',
		displayName: 'Form',
		pluralName: 'Forms',
		path: '/forms',
		capabilities: ['list', 'get', 'create', 'update', 'delete', 'archive', 'copy', 'bulkUpdate', 'bulkDelete', 'bulkArchive'],
		fields: [
			F.title, F.currency,
			{ name: 'status', displayName: 'Status', type: 'options', default: 'draft', options: [
				{ name: 'Draft', value: 'draft' }, { name: 'Published', value: 'published' },
				{ name: 'Pending', value: 'pending' }, { name: 'Archived', value: 'archived' }, { name: 'Expired', value: 'expired' },
			] },
			{ name: 'submissionsLimit', displayName: 'Submissions Limit', type: 'number', default: 0 },
			{ name: 'expirationDate', displayName: 'Expiration Date', type: 'dateTime', default: '' },
			F.customFields,
		],
	},
	{
		name: 'formResponse',
		displayName: 'Form Response',
		pluralName: 'Form Responses',
		path: '/form-responses',
		capabilities: ['list', 'get', 'create', 'update', 'delete', 'bulkDelete'],
		fields: [
			{ name: 'formId', displayName: 'Form ID', type: 'string', default: '' },
			{ name: 'data', displayName: 'Data (JSON object)', type: 'json', default: '{}', description: 'Map of field IDs to submitted values.' },
			{ name: 'name', displayName: 'Submitter Name', type: 'string', default: '' },
			{ name: 'email', displayName: 'Submitter Email', type: 'string', default: '' },
		],
	},
	{
		name: 'template',
		displayName: 'Template',
		pluralName: 'Templates',
		path: '/templates',
		capabilities: STD_OPS_FULL_CRUD,
		createRequired: ['entityType'],
		fields: [
			F.title,
			{ name: 'entityType', displayName: 'Entity Type', type: 'options', default: 'project', required: true, options: [
				{ name: 'Block', value: 'block' }, { name: 'Blocks Group', value: 'blocks-group' },
				{ name: 'Contract', value: 'contract' }, { name: 'Dashboard Page', value: 'dashboard-page' },
				{ name: 'Form', value: 'form' }, { name: 'Invoice', value: 'invoice' },
				{ name: 'Item', value: 'item' }, { name: 'Project', value: 'project' },
				{ name: 'Proposal', value: 'proposal' }, { name: 'Receipt', value: 'receipt' },
				{ name: 'Scheduler', value: 'scheduler' }, { name: 'Task', value: 'task' },
				{ name: 'Task Board', value: 'task-board' }, { name: 'Task Group', value: 'task-group' },
			] },
			{ name: 'description', displayName: 'Description', type: 'string', default: '' },
			{ name: 'isPublic', displayName: 'Is Public', type: 'boolean', default: false },
		],
	},
	{
		name: 'section',
		displayName: 'Section (Block Group)',
		pluralName: 'Sections',
		path: '/block-groups',
		capabilities: ['list', 'update'],
	},
	{
		name: 'block',
		displayName: 'Block',
		pluralName: 'Blocks',
		path: '/blocks',
		capabilities: STD_OPS_FULL_CRUD,
		fields: [
			F.title,
			{ name: 'type', displayName: 'Block Type', type: 'string', default: 'content', description: 'content, image, video, html, items, fees, intro, signature, item, time-entries, task, summary, button, navigation, title, scheduler-calendar, scheduler-booked, form, canvas' },
			{ name: 'entityId', displayName: 'Container Entity ID', type: 'string', default: '' },
			{ name: 'entityType', displayName: 'Container Entity Type', type: 'options', default: 'invoice', options: [
				{ name: 'Blocks Group', value: 'blocks-group' }, { name: 'Contract', value: 'contract' },
				{ name: 'Dashboard Page', value: 'dashboard-page' }, { name: 'Form', value: 'form' },
				{ name: 'Invoice', value: 'invoice' }, { name: 'Proposal', value: 'proposal' },
				{ name: 'Receipt', value: 'receipt' }, { name: 'Scheduler', value: 'scheduler' },
				{ name: 'Template', value: 'template' }, { name: 'Wiki', value: 'wiki' },
				{ name: 'Wiki Page', value: 'wiki-page' },
			] },
			{ name: 'textHTML', displayName: 'Text (HTML)', type: 'string', default: '' },
		],
	},
	{
		name: 'snippet',
		displayName: 'Snippet (Canned Response)',
		pluralName: 'Snippets',
		path: '/canned-responses',
		capabilities: STD_OPS_FULL_CRUD,
		createRequired: ['title', 'descriptionHTML'],
		fields: [F.title, F.descriptionHTML, { name: 'categoryId', displayName: 'Category ID', type: 'string', default: '' }],
	},
	{
		name: 'note',
		displayName: 'Note',
		pluralName: 'Notes',
		path: '/notes',
		capabilities: STD_OPS_FULL_CRUD,
		fields: [
			F.title, F.descriptionHTML,
			{ name: 'entityId', displayName: 'Attached To Entity ID', type: 'string', default: '' },
			{ name: 'entityType', displayName: 'Attached To Entity Type', type: 'options', default: 'person', options: [
				{ name: 'Block', value: 'block' }, { name: 'Company', value: 'company' }, { name: 'Person', value: 'person' },
			] },
		],
	},
	{
		name: 'item',
		displayName: 'Item (Product/Service)',
		pluralName: 'Items',
		path: '/items',
		capabilities: STD_OPS_FULL_CRUD,
		fields: [
			F.title, F.descriptionPlain,
			{ name: 'amount', displayName: 'Amount', type: 'number', default: 0 },
			{ name: 'quantity', displayName: 'Quantity', type: 'number', default: 1 },
			{ name: 'tax', displayName: 'Tax %', type: 'number', default: 0 },
		],
	},
	{
		name: 'wiki',
		displayName: 'Wiki',
		pluralName: 'Wikis',
		path: '/wiki',
		capabilities: STD_OPS_FULL_CRUD,
		createRequired: ['title'],
		fields: [F.title, { name: 'description', displayName: 'Description', type: 'string', default: '' }, F.projectId],
	},
	{
		name: 'wikiPage',
		displayName: 'Wiki Page',
		pluralName: 'Wiki Pages',
		path: '/wiki-entities',
		capabilities: ['list', 'get', 'create', 'update', 'delete', 'move'],
		createRequired: ['parentId', 'title', 'type', 'wikiId'],
		fields: [
			F.title,
			{ name: 'wikiId', displayName: 'Wiki ID', type: 'string', default: '', required: true },
			{ name: 'parentId', displayName: 'Parent ID', type: 'string', default: '', required: true },
			{ name: 'type', displayName: 'Type', type: 'options', default: 'page', required: true, options: [
				{ name: 'Page', value: 'page' }, { name: 'Category', value: 'category' },
			] },
			{ name: 'description', displayName: 'Description', type: 'string', default: '' },
		],
	},
	{
		name: 'folder',
		displayName: 'Folder',
		pluralName: 'Folders',
		path: '/file-folders',
		capabilities: ['list', 'get', 'create', 'update', 'delete', 'move'],
		createRequired: ['title'],
		fields: [
			F.title, F.projectId,
			{ name: 'parentFolderId', displayName: 'Parent Folder ID', type: 'string', default: '' },
			{ name: 'entityType', displayName: 'Container Entity Type', type: 'options', default: 'project', options: [
				{ name: 'Person', value: 'person' }, { name: 'Project', value: 'project' },
			] },
		],
	},
	{
		name: 'file',
		displayName: 'File',
		pluralName: 'Files',
		path: '/files',
		capabilities: ['list', 'get', 'create', 'update', 'delete', 'move', 'bulkUpdate', 'bulkDelete'],
		fields: [
			F.title,
			{ name: 'folderId', displayName: 'Folder ID', type: 'string', default: '' },
			{ name: 'url', displayName: 'URL (for type=link)', type: 'string', default: '' },
			{ name: 'type', displayName: 'File Type', type: 'options', default: 'file', options: [
				{ name: 'Document', value: 'document' }, { name: 'File', value: 'file' }, { name: 'Link', value: 'link' },
			] },
			{ name: 'mimeType', displayName: 'MIME Type', type: 'string', default: '' },
			{ name: 'size', displayName: 'Size (bytes)', type: 'number', default: 0 },
		],
	},
	{
		name: 'conversation',
		displayName: 'Conversation',
		pluralName: 'Conversations',
		path: '/conversations',
		capabilities: STD_OPS_FULL_CRUD,
		createRequired: ['entityType'],
		fields: [
			F.title,
			{ name: 'entityType', displayName: 'Entity Type', type: 'options', default: 'project', required: true, options: [
				{ name: 'Email', value: 'email' }, { name: 'Messenger', value: 'messenger' },
				{ name: 'Person', value: 'person' }, { name: 'Project', value: 'project' },
			] },
			{ name: 'entityId', displayName: 'Entity ID', type: 'string', default: '' },
			{ name: 'members', displayName: 'Member Profile IDs (JSON array)', type: 'json', default: '[]' },
			{ name: 'type', displayName: 'Type', type: 'options', default: 'group', options: [
				{ name: 'Direct', value: 'direct' }, { name: 'Group', value: 'group' },
			] },
		],
	},
	{
		name: 'messenger',
		displayName: 'Messenger (Inbox Group)',
		pluralName: 'Messengers',
		path: '/inbox-groups',
		capabilities: STD_OPS_FULL_CRUD,
		createRequired: ['title', 'type'],
		fields: [
			F.title,
			{ name: 'type', displayName: 'Type', type: 'options', default: 'messenger', required: true, options: [
				{ name: 'Email', value: 'email' }, { name: 'Messenger', value: 'messenger' },
			] },
			{ name: 'isActive', displayName: 'Is Active', type: 'boolean', default: true },
		],
	},
	{
		name: 'comment',
		displayName: 'Comment',
		pluralName: 'Comments',
		path: '/comments',
		capabilities: STD_OPS_FULL_CRUD,
		createRequired: ['entityId', 'entityType'],
		fields: [
			{ name: 'bodyHTML', displayName: 'Body (HTML)', type: 'string', default: '' },
			{ name: 'entityId', displayName: 'Entity ID', type: 'string', default: '', required: true },
			{ name: 'entityType', displayName: 'Entity Type', type: 'options', default: 'task', required: true, options: [
				{ name: 'Conversation', value: 'conversation' }, { name: 'File', value: 'file' }, { name: 'Task', value: 'task' },
			] },
			{ name: 'isNote', displayName: 'Is Internal Note', type: 'boolean', default: false },
			{ name: 'mentions', displayName: 'Mentions (Profile IDs JSON array)', type: 'json', default: '[]' },
			{ name: 'repliedTo', displayName: 'Replied To Comment ID', type: 'string', default: '' },
		],
	},
	{
		name: 'dashboard',
		displayName: 'Dashboard',
		pluralName: 'Dashboards',
		path: '/dashboards',
		capabilities: ['list', 'update'],
	},
	{
		name: 'dashboardPage',
		displayName: 'Dashboard Page',
		pluralName: 'Dashboard Pages',
		path: '/dashboard-pages',
		capabilities: STD_OPS_FULL_CRUD,
		createRequired: ['dashboardId'],
		fields: [
			F.title,
			{ name: 'dashboardId', displayName: 'Dashboard ID', type: 'string', default: '', required: true },
		],
	},
	{
		name: 'dashboardData',
		displayName: 'Dashboard Data',
		pluralName: 'Dashboard Data',
		path: '/dashboard-data',
		capabilities: ['list'],
		description: 'Aggregated metric values for dashboard widgets.',
	},
	{
		name: 'archive',
		displayName: 'Archive',
		pluralName: 'Archive',
		path: '/archive',
		capabilities: ['list', 'delete', 'bulkDelete'],
		description: 'Soft-deleted items (separate from trash).',
	},
	{
		name: 'trash',
		displayName: 'Trash',
		pluralName: 'Trash',
		path: '/trash-bin',
		capabilities: ['list', 'delete', 'bulkDelete'],
		description: 'Pre-permanent-delete bin. Plus /trash-bin/all for empty.',
	},
];

export function findResource(name: string): PlutioResource {
	const r = RESOURCES.find((res) => res.name === name);
	if (!r) {
		throw new Error(`Unknown Plutio resource: ${name}`);
	}
	return r;
}
