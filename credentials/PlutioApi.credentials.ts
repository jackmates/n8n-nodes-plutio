import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class PlutioApi implements ICredentialType {
	name = 'plutioMatesApi';
	displayName = 'Plutio (MATES) API';
	documentationUrl = 'https://docs.plutio.com';
	properties: INodeProperties[] = [
		{
			displayName: 'Business (Subdomain)',
			name: 'business',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'matesincorporated',
			description: 'Your Plutio subdomain — the bit before .plutio.com (e.g. for matesincorporated.plutio.com use "matesincorporated").',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			required: true,
			default: '',
			description: 'From Plutio → Settings → API.',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'From Plutio → Settings → API.',
		},
	];
}
