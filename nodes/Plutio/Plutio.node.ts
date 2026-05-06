import { IExecuteFunctions } from 'n8n-core';
import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import {
	buildInputFieldsProperties,
	buildOperationsProperties,
	buildResourceProperty,
} from './resourceFactory';
import { Capability } from './resources';
import { executeOperation } from './executeOperation';

export class Plutio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Plutio (MATES)',
		name: 'plutioMates',
		icon: 'file:plutio.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Read and write data in your Plutio workspace via the v1.11 API.',
		defaults: { name: 'Plutio (MATES)' },
		// @ts-expect-error usableAsTool was added in newer n8n-workflow types; older pinned version lacks it but n8n runtime supports it.
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{ name: 'plutioMatesApi', required: true },
		],
		properties: [
			buildResourceProperty(),
			...buildOperationsProperties(),
			...buildInputFieldsProperties(),
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as Capability;

				const result = await executeOperation.call(this, resource, operation, i);
				if (Array.isArray(result)) {
					returnData.push(...(result as IDataObject[]));
				} else if (result === undefined || result === null) {
					returnData.push({ success: true });
				} else {
					returnData.push(result);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: (error as Error).message });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
