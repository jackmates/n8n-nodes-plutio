import { IExecuteFunctions } from 'n8n-core';
import { IDataObject } from 'n8n-workflow';
import { Capability, findResource, PlutioField, PlutioResource } from './resources';
import { parseJsonParam, plutioApiRequest, plutioApiRequestAllItems } from './GenericFunctions';

/**
 * Read a field from item params and coerce it for the request body.
 * - json fields are parsed
 * - empty strings/dates are skipped (don't overwrite with empty)
 */
function readField(this: IExecuteFunctions, field: PlutioField, itemIndex: number, isCreate: boolean): unknown | undefined {
	const value = this.getNodeParameter(field.name, itemIndex, undefined as unknown);
	if (value === undefined || value === null) return undefined;
	if (field.type === 'json') {
		// Parse JSON-typed fields. Empty stays as the field default.
		if (typeof value === 'string' && value.trim() === '') return undefined;
		return parseJsonParam(value, field.default);
	}
	if (field.type === 'string' && value === '') {
		// On create, send empty string only if it's required (so server gives a useful error).
		// On update, empty string usually means "don't change" — skip.
		return isCreate && field.required ? '' : undefined;
	}
	if (field.type === 'number' && (value === '' || value === null)) return undefined;
	if (field.type === 'dateTime' && value === '') return undefined;
	return value;
}

function buildBodyFromFields(this: IExecuteFunctions, resource: PlutioResource, itemIndex: number, isCreate: boolean): IDataObject {
	const body: IDataObject = {};
	for (const field of resource.fields || []) {
		const v = readField.call(this, field, itemIndex, isCreate);
		if (v !== undefined) {
			(body as Record<string, unknown>)[field.name] = v;
		}
	}
	const additional = parseJsonParam<IDataObject>(
		this.getNodeParameter('additionalFields', itemIndex, '{}') as string,
		{},
	);
	return { ...body, ...additional };
}

export async function executeOperation(
	this: IExecuteFunctions,
	resourceName: string,
	operation: Capability,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	const resource = findResource(resourceName);
	const path = resource.path;

	switch (operation) {
		case 'list': {
			const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
			const qRaw = this.getNodeParameter('q', itemIndex, '') as string;
			const extraRaw = this.getNodeParameter('queryParams', itemIndex, '{}') as string;
			const extras = parseJsonParam<IDataObject>(extraRaw, {});
			const query: IDataObject = { ...extras };
			if (qRaw && qRaw.trim() !== '') query.q = qRaw.trim();

			if (returnAll) {
				return plutioApiRequestAllItems.call(this, path, query);
			}
			const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
			const skip = this.getNodeParameter('skip', itemIndex, 0) as number;
			query.limit = limit;
			query.skip = skip;
			return plutioApiRequest.call(this, 'GET', path, {}, query);
		}

		case 'get': {
			const id = this.getNodeParameter('_id', itemIndex) as string;
			// Plutio: get-one is just list with _id filter
			const result = (await plutioApiRequest.call(this, 'GET', path, {}, { _id: id })) as IDataObject | IDataObject[];
			if (Array.isArray(result)) return result[0] ?? { error: 'Not found', _id: id };
			return result;
		}

		case 'create': {
			const body = buildBodyFromFields.call(this, resource, itemIndex, true);
			return plutioApiRequest.call(this, 'POST', path, body);
		}

		case 'update': {
			const id = this.getNodeParameter('_id', itemIndex) as string;
			const body = buildBodyFromFields.call(this, resource, itemIndex, false);
			body._id = id;
			return plutioApiRequest.call(this, 'PUT', path, body);
		}

		case 'delete': {
			const id = this.getNodeParameter('_id', itemIndex) as string;
			return plutioApiRequest.call(this, 'DELETE', path, { _id: id });
		}

		case 'archive': {
			const id = this.getNodeParameter('_id', itemIndex) as string;
			return plutioApiRequest.call(this, 'POST', `${path}/archive`, { _id: id, isArchived: true });
		}

		case 'move': {
			const id = this.getNodeParameter('_id', itemIndex) as string;
			const moveBody = parseJsonParam<IDataObject>(this.getNodeParameter('moveBody', itemIndex, '{}') as string, {});
			return plutioApiRequest.call(this, 'POST', `${path}/move`, { _id: id, ...moveBody });
		}

		case 'copy': {
			const id = this.getNodeParameter('_id', itemIndex) as string;
			const copyBody = parseJsonParam<IDataObject>(this.getNodeParameter('copyBody', itemIndex, '{}') as string, {});
			return plutioApiRequest.call(this, 'POST', `${path}/copy`, { _id: id, ...copyBody });
		}

		case 'bulkUpdate': {
			const idsRaw = this.getNodeParameter('_ids', itemIndex) as string;
			const _ids = idsRaw.split(',').map((s) => s.trim()).filter(Boolean);
			const updateBody = parseJsonParam<IDataObject>(this.getNodeParameter('bulkBody', itemIndex, '{}') as string, {});
			return plutioApiRequest.call(this, 'PUT', `${path}/bulk`, { _ids, ...updateBody });
		}

		case 'bulkDelete': {
			const idsRaw = this.getNodeParameter('_ids', itemIndex) as string;
			const _ids = idsRaw.split(',').map((s) => s.trim()).filter(Boolean);
			return plutioApiRequest.call(this, 'DELETE', `${path}/bulk`, { _ids });
		}

		case 'bulkArchive': {
			const idsRaw = this.getNodeParameter('_ids', itemIndex) as string;
			const _ids = idsRaw.split(',').map((s) => s.trim()).filter(Boolean);
			return plutioApiRequest.call(this, 'POST', `${path}/bulk/archive`, { _ids, isArchived: true });
		}

		default:
			throw new Error(`Unsupported operation '${operation}' for resource '${resourceName}'`);
	}
}
