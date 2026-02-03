import type { PageLoad } from './$types';
import type { PaginationState } from '$lib/types/ui';

export interface IntakeRow {
	id: string;
	clientFirstName: string;
	clientLastName: string;
	clientBsnNumber: string;
	intakeDate: string;
	intakeStatus: 'scheduled' | 'in_progress' | 'completed';
	goalAssessmentStatus: 'done' | 'pending';
	careProtectedLiving: boolean;
	careAssistedIndependentLiving: boolean;
	careRoomTrainingCenter: boolean;
	careAmbulatoryGuidance: boolean;
	assignedLocation: string;
}

export interface IntakeFilters {
	search: string;
	status: '' | 'done' | 'pending';
}

const STATIC_INTAKES: IntakeRow[] = [
	{
		id: '1',
		clientFirstName: 'Jan',
		clientLastName: 'Jansen',
		clientBsnNumber: '123456789',
		intakeDate: '2023-10-15T10:00:00Z',
		intakeStatus: 'completed',
		goalAssessmentStatus: 'done',
		careProtectedLiving: true,
		careAssistedIndependentLiving: false,
		careRoomTrainingCenter: false,
		careAmbulatoryGuidance: false,
		assignedLocation: 'Locatie Centrum'
	},
	{
		id: '2',
		clientFirstName: 'Piet',
		clientLastName: 'Pietersen',
		clientBsnNumber: '987654321',
		intakeDate: '2023-10-20T14:30:00Z',
		intakeStatus: 'in_progress',
		goalAssessmentStatus: 'pending',
		careProtectedLiving: false,
		careAssistedIndependentLiving: true,
		careRoomTrainingCenter: false,
		careAmbulatoryGuidance: false,
		assignedLocation: 'Locatie Noord'
	},
	{
		id: '3',
		clientFirstName: 'Sara',
		clientLastName: 'de Vries',
		clientBsnNumber: '112233445',
		intakeDate: '2023-11-01T09:15:00Z',
		intakeStatus: 'scheduled',
		goalAssessmentStatus: 'pending',
		careProtectedLiving: false,
		careAssistedIndependentLiving: false,
		careRoomTrainingCenter: true,
		careAmbulatoryGuidance: false,
		assignedLocation: 'Locatie West'
	},
	{
		id: '4',
		clientFirstName: 'Ahmed',
		clientLastName: 'Yilmaz',
		clientBsnNumber: '556677889',
		intakeDate: '2023-11-05T11:00:00Z',
		intakeStatus: 'completed',
		goalAssessmentStatus: 'done',
		careProtectedLiving: true,
		careAssistedIndependentLiving: false,
		careRoomTrainingCenter: false,
		careAmbulatoryGuidance: false,
		assignedLocation: 'Locatie Centrum'
	},
	{
		id: '5',
		clientFirstName: 'Eva',
		clientLastName: 'Smit',
		clientBsnNumber: '998877665',
		intakeDate: '2023-11-12T15:45:00Z',
		intakeStatus: 'scheduled',
		goalAssessmentStatus: 'pending',
		careProtectedLiving: false,
		careAssistedIndependentLiving: false,
		careRoomTrainingCenter: false,
		careAmbulatoryGuidance: true,
		assignedLocation: 'Ambulant Team A'
	}
];

export const load: PageLoad = async ({ url }) => {
	const page = Number(url.searchParams.get('page') ?? '1') || 1;
	const pageSize = Number(url.searchParams.get('page_size') ?? '8') || 8;
	const search = (url.searchParams.get('search') ?? '').toLowerCase();
	const status = url.searchParams.get('status') as IntakeFilters['status'] | null;

	let filtered = STATIC_INTAKES.filter((row) => {
		const nameMatch =
			row.clientFirstName.toLowerCase().includes(search) ||
			row.clientLastName.toLowerCase().includes(search);
		const bsnMatch = row.clientBsnNumber.includes(search);
		const statusMatch = !status || row.goalAssessmentStatus === status;

		return (nameMatch || bsnMatch) && statusMatch;
	});

	const totalCount = filtered.length;
	const start = (page - 1) * pageSize;
	const end = start + pageSize;
	const results = filtered.slice(start, end);

	return {
		intakes: results,
		stats: {
			total: STATIC_INTAKES.length,
			completed: STATIC_INTAKES.filter((r) => r.goalAssessmentStatus === 'done').length,
			pending: STATIC_INTAKES.filter((r) => r.goalAssessmentStatus === 'pending').length
		},
		pagination: {
			count: totalCount,
			page,
			pageSize,
			next: end < totalCount ? String(page + 1) : null,
			previous: page > 1 ? String(page - 1) : null,
			filters: {
				search,
				status: status ?? ''
			}
		} satisfies PaginationState<IntakeFilters>
	};
};
