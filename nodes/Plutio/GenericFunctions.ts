import { OptionsWithUri } from 'request';

import {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
} from 'n8n-core';

import { IDataObject, NodeApiError } from 'n8n-workflow';

const PLUTIO_BASE = 'api.plutio.com/v1.11';

/**
 * Per-execution token cache. Plutio access tokens expire (response includes
 * accessTokenExpiresAt) so we cache by credential triple and reuse until
 * 60 seconds before expiry. Avoids spending half the rate-limit budget on
 * /oauth/token round-trips.
 */
interface CachedToken {
	token: string;
	expiresAt: number; // epoch ms
}

const tokenCache: Map<string, CachedToken> = new Map();

function cacheKey(business: string, clientId: string): string {
	return `${business}::${clientId}`;
}

async function fetchAccessToken(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
): Promise<string> {
	const credentials = await this.getCredentials('plutioMatesApi');
	const business = `${credentials.business}`;
	const clientId = `${credentials.clientId}`;
	const clientSecret = `${credentials.clientSecret}`;

	const key = cacheKey(business, clientId);
	const cached = tokenCache.get(key);
	const now = Date.now();
	if (cached && cached.expiresAt - now > 60_000) {
		return cached.token;
	}

	const options: OptionsWithUri = {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Business': business,
		},
		method: 'POST',
		body: {
			'client_id': clientId,
			'client_secret': clientSecret,
			'grant_type': 'client_credentials',
		},
		uri: `https://${PLUTIO_BASE}/oauth/token`,
		json: true,
	};

	let response: IDataObject;
	try {
		response = (await this.helpers.request!(options)) as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error);
	}

	const accessToken = response.accessToken as string | undefined;
	if (!accessToken) {
		throw new NodeApiError(this.getNode(), {
			message: 'Plutio /oauth/token did not return accessToken',
			description: JSON.stringify(response),
		});
	}

	const expiresAtRaw = response.accessTokenExpiresAt as string | number | undefined;
	let expiresAt = now + 60 * 60 * 1000; // default: 1 hour
	if (typeof expiresAtRaw === 'string') {
		const parsed = Date.parse(expiresAtRaw);
		if (!isNaN(parsed)) expiresAt = parsed;
	} else if (typeof expiresAtRaw === 'number') {
		expiresAt = expiresAtRaw < 1e12 ? expiresAtRaw * 1000 : expiresAtRaw;
	}

	tokenCache.set(key, { token: accessToken, expiresAt });
	return accessToken;
}

/**
 * Make a request to the Plutio API.
 *
 * @param method   HTTP verb
 * @param resource Path beginning with '/' — e.g. '/tasks'
 * @param body     Request body (object). Empty objects are stripped.
 * @param query    Query string params (object). Empty objects are stripped.
 * @param uri      Full URI override (rarely needed)
 * @param options  Extra options merged into the request (e.g. resolveWithFullResponse)
 */
export async function plutioApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: string,
	resource: string,
	body: IDataObject | IDataObject[] = {},
	query: IDataObject = {},
	uri?: string,
	option: IDataObject = {},
): Promise<IDataObject | IDataObject[]> {
	const credentials = await this.getCredentials('plutioMatesApi');
	const business = `${credentials.business}`;
	const accessToken = await fetchAccessToken.call(this);

	let options: OptionsWithUri = {
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${accessToken}`,
			'Business': business,
		},
		method,
		body,
		qs: query,
		uri: uri || `https://${PLUTIO_BASE}${resource}`,
		json: true,
	};

	const bodyIsEmpty =
		(Array.isArray(body) && body.length === 0) ||
		(!Array.isArray(body) && Object.keys(body || {}).length === 0);
	if (bodyIsEmpty) delete options.body;
	if (Object.keys(query).length === 0) delete options.qs;

	options = Object.assign({}, options, option);

	try {
		return (await this.helpers.request!(options)) as IDataObject | IDataObject[];
	} catch (error) {
		// On 401, clear cached token once and retry
		if (error?.statusCode === 401) {
			tokenCache.delete(cacheKey(business, `${credentials.clientId}`));
		}
		throw new NodeApiError(this.getNode(), error);
	}
}

/**
 * Fetch all records from a list endpoint by paging through `skip`/`limit`.
 * Stops when a page returns fewer than `limit` items.
 */
export async function plutioApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	resource: string,
	query: IDataObject = {},
	pageSize = 100,
): Promise<IDataObject[]> {
	const all: IDataObject[] = [];
	let skip = 0;

	while (true) {
		const page = (await plutioApiRequest.call(
			this,
			'GET',
			resource,
			{},
			{ ...query, skip, limit: pageSize },
		)) as IDataObject[] | IDataObject;
		const arr = Array.isArray(page) ? page : [page];
		all.push(...arr);
		if (arr.length < pageSize) break;
		skip += pageSize;
		if (skip > 100_000) break; // safety stop
	}
	return all;
}

export function capitalize(s: string): string {
	if (typeof s !== 'string') return '';
	return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Parse a JSON-ish string parameter into a value, returning `fallback` if
 * empty or unparseable. n8n stores `json` parameters as strings.
 */
export function parseJsonParam<T = IDataObject>(raw: unknown, fallback: T): T {
	if (raw === undefined || raw === null || raw === '') return fallback;
	if (typeof raw !== 'string') return raw as T;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}
