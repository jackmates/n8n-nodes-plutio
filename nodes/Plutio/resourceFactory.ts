import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { Capability, PlutioField, PlutioResource, RESOURCES } from './resources';

const OPERATION_LABEL: Record<Capability, { name: string; action: (r: PlutioResource) => string; description: (r: PlutioResource) => string }> = {
	list:        { name: 'Get Many',     action: (r) => `Get many ${r.pluralName.toLowerCase()}`,           description: (r) => `Returns a list of ${r.pluralName.toLowerCase()} in your workspace.` },
	get:         { name: 'Get',          action: (r) => `Get a ${r.displayName.toLowerCase()}`,             description: (r) => `Get a single ${r.displayName.toLowerCase()} by ID.` },
	create:      { name: 'Create',       action: (r) => `Create a ${r.displayName.toLowerCase()}`,           description: (r) => `Create a new ${r.displayName.toLowerCase()}.` },
	update:      { name: 'Update',       action: (r) => `Update a ${r.displayName.toLowerCase()}`,           description: (r) => `Update an existing ${r.displayName.toLowerCase()}.` },
	delete:      { name: 'Delete',       action: (r) => `Delete a ${r.displayName.toLowerCase()}`,           description: (r) => `Permanently delete a ${r.displayName.toLowerCase()}.` },
	archive:     { name: 'Archive',      action: (r) => `Archive a ${r.displayName.toLowerCase()}`,          description: (r) => `Move a ${r.displayName.toLowerCase()} to the archive.` },
	move:        { name: 'Move',         action: (r) => `Move a ${r.displayName.toLowerCase()}`,             description: (r) => `Move a ${r.displayName.toLowerCase()} to a different position or parent.` },
	copy:        { name: 'Copy',         action: (r) => `Copy a ${r.displayName.toLowerCase()}`,             description: (r) => `Duplicate a ${r.displayName.toLowerCase()}.` },
	bulkUpdate:  { name: 'Bulk Update',  action: (r) => `Bulk update ${r.pluralName.toLowerCase()}`,         description: (r) => `Update multiple ${r.pluralName.toLowerCase()} in one request.` },
	bulkDelete:  { name: 'Bulk Delete',  action: (r) => `Bulk delete ${r.pluralName.toLowerCase()}`,         description: (r) => `Delete multiple ${r.pluralName.toLowerCase()} in one request.` },
	bulkArchive: { name: 'Bulk Archive', action: (r) => `Bulk archive ${r.pluralName.toLowerCase()}`,        description: (r) => `Archive multiple ${r.pluralName.toLowerCase()} in one request.` },
};

function fieldToProperty(field: PlutioField, resourceName: string, operation: string): INodeProperties {
	const base: INodeProperties = {
		displayName: field.displayName,
		name: field.name,
		type: field.type === 'json' ? 'string' : (field.type as INodeProperties['type']),
		typeOptions: field.type === 'json' ? { rows: 4 } : undefined,
		default: field.default ?? '',
		required: !!field.required,
		description: field.description,
		placeholder: field.placeholder,
		displayOptions: {
			show: {
				resource: [resourceName],
				operation: [operation],
			},
		},
	} as INodeProperties;
	if (field.options) {
		(base as IDataObjectLike).options = field.options;
	}
	return base;
}

interface IDataObjectLike {
	options?: INodePropertyOptions[];
}

/**
 * Build the Resource dropdown.
 */
export function buildResourceProperty(): INodeProperties {
	return {
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		default: 'task',
		options: RESOURCES.map((r) => ({
			name: r.displayName,
			value: r.name,
			description: r.description,
		})) as INodePropertyOptions[],
	};
}

/**
 * Build the Operations dropdown for each resource.
 */
export function buildOperationsProperties(): INodeProperties[] {
	return RESOURCES.map((r) => ({
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: r.capabilities[0],
		displayOptions: { show: { resource: [r.name] } },
		options: r.capabilities.map((cap) => {
			const meta = OPERATION_LABEL[cap];
			return {
				name: meta.name,
				value: cap,
				action: meta.action(r),
				description: meta.description(r),
			};
		}) as INodePropertyOptions[],
	}));
}

/**
 * For each (resource, operation) pair, build the input fields the user needs to fill in.
 *
 * - Operations needing _id (get, update, delete, archive, move, copy):
 *     adds an "ID" string field.
 * - Operations needing _ids (bulkUpdate, bulkDelete, bulkArchive):
 *     adds an "IDs (comma-separated)" string field.
 * - create: adds the curated resource fields, plus a generic "Additional Fields" JSON.
 * - update / bulkUpdate: adds ID(s) + curated fields (none required) + Additional Fields.
 * - move: adds ID + JSON body (because move payload varies by resource).
 * - list: adds optional "limit", "skip", "filter" (q JSON), "filterMode" toggle.
 */
export function buildInputFieldsProperties(): INodeProperties[] {
	const props: INodeProperties[] = [];

	for (const r of RESOURCES) {
		// ID fields
		const idOps = ['get', 'update', 'delete', 'archive', 'move', 'copy'].filter((o) => r.capabilities.includes(o as Capability));
		if (idOps.length) {
			props.push({
				displayName: 'ID',
				name: '_id',
				type: 'string',
				default: '',
				required: true,
				description: `_id of the ${r.displayName.toLowerCase()}`,
				displayOptions: { show: { resource: [r.name], operation: idOps } },
			});
		}

		const bulkOps = ['bulkUpdate', 'bulkDelete', 'bulkArchive'].filter((o) => r.capabilities.includes(o as Capability));
		if (bulkOps.length) {
			props.push({
				displayName: 'IDs',
				name: '_ids',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'id1,id2,id3',
				description: 'Comma-separated _ids',
				displayOptions: { show: { resource: [r.name], operation: bulkOps } },
			});
		}

		// Required fields for create
		if (r.capabilities.includes('create')) {
			const requiredNames = new Set(r.createRequired || []);
			for (const field of r.fields || []) {
				const isRequired = requiredNames.has(field.name) || field.required === true;
				props.push(fieldToProperty({ ...field, required: isRequired }, r.name, 'create'));
			}
			// Generic escape hatch
			props.push({
				displayName: 'Additional Fields (JSON)',
				name: 'additionalFields',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '{}',
				description: 'Any other fields supported by the Plutio API for this resource. Merged into the request body.',
				displayOptions: { show: { resource: [r.name], operation: ['create'] } },
			});
		}

		// Update fields
		if (r.capabilities.includes('update')) {
			for (const field of r.fields || []) {
				props.push(fieldToProperty({ ...field, required: false }, r.name, 'update'));
			}
			props.push({
				displayName: 'Additional Fields (JSON)',
				name: 'additionalFields',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '{}',
				description: 'Any other fields supported by the Plutio API for this resource. Merged into the request body.',
				displayOptions: { show: { resource: [r.name], operation: ['update'] } },
			});
		}

		// Bulk update body
		if (r.capabilities.includes('bulkUpdate')) {
			props.push({
				displayName: 'Update Body (JSON)',
				name: 'bulkBody',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '{}',
				description: 'Fields to apply to every record. Will be merged with _ids.',
				displayOptions: { show: { resource: [r.name], operation: ['bulkUpdate'] } },
			});
		}

		// Move body
		if (r.capabilities.includes('move')) {
			props.push({
				displayName: 'Move Body (JSON)',
				name: 'moveBody',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '{"position":0}',
				description: 'Move payload. Common fields: position, index, projectId, taskBoardId, parentFolderId, destinationId.',
				displayOptions: { show: { resource: [r.name], operation: ['move'] } },
			});
		}

		// Copy body
		if (r.capabilities.includes('copy')) {
			props.push({
				displayName: 'Copy Body (JSON)',
				name: 'copyBody',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '{}',
				description: 'Copy payload. Most resources accept { position } or { index }.',
				displayOptions: { show: { resource: [r.name], operation: ['copy'] } },
			});
		}

		// List options
		if (r.capabilities.includes('list')) {
			props.push(
				{
					displayName: 'Return All',
					name: 'returnAll',
					type: 'boolean',
					default: false,
					description: 'Whether to page through all results. Off = use Limit.',
					displayOptions: { show: { resource: [r.name], operation: ['list'] } },
				},
				{
					displayName: 'Limit',
					name: 'limit',
					type: 'number',
					typeOptions: { minValue: 1 },
					default: 50,
					description: 'Max items to return (when Return All is off).',
					displayOptions: { show: { resource: [r.name], operation: ['list'], returnAll: [false] } },
				},
				{
					displayName: 'Skip',
					name: 'skip',
					type: 'number',
					typeOptions: { minValue: 0 },
					default: 0,
					description: 'Number of items to skip (offset).',
					displayOptions: { show: { resource: [r.name], operation: ['list'], returnAll: [false] } },
				},
				{
					displayName: 'Filter (q, JSON)',
					name: 'q',
					type: 'string',
					typeOptions: { rows: 3 },
					default: '',
					placeholder: '{"status":"incomplete"}',
					description: 'MongoDB-style filter. Plutio supports $regex, $or, $and, $elemMatch, $gte, $lte, $in, $size.',
					displayOptions: { show: { resource: [r.name], operation: ['list'] } },
				},
				{
					displayName: 'Extra Query Params (JSON)',
					name: 'queryParams',
					type: 'string',
					typeOptions: { rows: 2 },
					default: '{}',
					description: 'Additional simple key=value query params (besides q/skip/limit).',
					displayOptions: { show: { resource: [r.name], operation: ['list'] } },
				},
			);
		}
	}

	return props;
}
