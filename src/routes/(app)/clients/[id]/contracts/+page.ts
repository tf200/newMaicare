import type { PageLoad } from './$types';
import type { ClientContract } from '$lib/types/contracts';

export interface ContractsLoadResult {
	contracts: ClientContract[];
	loadError: string | null;
}

export const load: PageLoad = async ({ params }) => {
	const clientId = params.id;

	// Simulate API call
	const fetchContracts = async (): Promise<ContractsLoadResult> => {
		// Artificial delay
		await new Promise((resolve) => setTimeout(resolve, 800));

		const mockContracts: ClientContract[] = [
			{
				id: '1',
				status: 'approved',
				start_date: '2024-01-01',
				end_date: '2024-12-31',
				financing_act: 'WMO',
				financing_option: 'ZIN',
				care_type: 'accommodation',
				summary: 'Regular long-term care contract for protected living.',
				notes: 'Approved by municipality on Dec 15th.'
			},
			{
				id: '2',
				status: 'draft',
				start_date: '2025-01-01',
				end_date: '2025-12-31',
				financing_act: 'WMO',
				financing_option: 'ZIN',
				care_type: 'accommodation',
				summary: 'Renewal contract for the upcoming year.',
				notes: 'Pending final signature from the client.'
			}
		];

		return {
			contracts: mockContracts,
			loadError: null
		};
	};

	return {
		clientId,
		contractsData: fetchContracts()
	};
};
