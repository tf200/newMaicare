import type { ApiEnvelope } from '$lib/types/api';
import type { Expense } from '$lib/types/api/declaraties';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const employees = [
	{ id: 'emp-001', name: 'Sophie de Vries' },
	{ id: 'emp-002', name: 'Ahmed El Amrani' },
	{ id: 'emp-003', name: 'Lisa van den Berg' },
	{ id: 'emp-004', name: 'Mohammed Hassan' },
	{ id: 'emp-005', name: 'Emma Bakker' },
	{ id: 'emp-007', name: 'Fatima Zorgman' },
	{ id: 'emp-008', name: 'Julia Smit' },
	{ id: 'emp-010', name: 'Anna Jansen' }
];

function make(
	id: string,
	empId: string,
	date: string,
	cat: string,
	desc: string,
	amount: number,
	status: string
): Expense {
	const emp = employees.find((e) => e.id === empId)!;
	return {
		id,
		employee_id: empId,
		employee_name: emp.name,
		date,
		category: cat as any,
		description: desc,
		amount,
		status: status as any,
		created_at: `${date}T10:00:00Z`
	};
}

const mockExpenses: Expense[] = [
	// March 2026
	make(
		'exp-001',
		'emp-001',
		'2026-03-02',
		'reiskosten',
		'Treinreis Den Haag – Amsterdam retour',
		89.5,
		'approved'
	),
	make(
		'exp-002',
		'emp-003',
		'2026-03-03',
		'maaltijden',
		'Teamdiner kwartaalvergadering',
		245.0,
		'approved'
	),
	make(
		'exp-003',
		'emp-002',
		'2026-03-05',
		'reiskosten',
		'Kilometervergoeding cliëntbezoek',
		67.2,
		'pending'
	),
	make(
		'exp-004',
		'emp-007',
		'2026-03-06',
		'telefoon',
		'Telefoonabonnement maart',
		35.0,
		'approved'
	),
	make(
		'exp-005',
		'emp-005',
		'2026-03-08',
		'opleidingen',
		'Cursus Nieuwe Autoriteit',
		450.0,
		'pending'
	),
	make(
		'exp-006',
		'emp-008',
		'2026-03-10',
		'kantoorbenodigdheden',
		'Ordners en papier kantoor',
		42.8,
		'paid'
	),
	make(
		'exp-007',
		'emp-001',
		'2026-03-12',
		'verblijfkosten',
		'Overnachting conferentie Rotterdam',
		165.0,
		'pending'
	),
	make(
		'exp-008',
		'emp-004',
		'2026-03-14',
		'reiskosten',
		'NS Business card opladen',
		120.0,
		'approved'
	),
	make('exp-009', 'emp-010', '2026-03-15', 'representatie', 'Bloemen jubilaris', 45.0, 'approved'),
	make('exp-010', 'emp-002', '2026-03-18', 'overig', 'Kopieën jaarverslag', 18.5, 'rejected'),
	// February 2026
	make(
		'exp-011',
		'emp-001',
		'2026-02-04',
		'reiskosten',
		'Kilometervergoeding werkbezoek',
		54.6,
		'paid'
	),
	make('exp-012', 'emp-007', '2026-02-10', 'maaltijden', 'Lunch met opdrachtgever', 87.3, 'paid'),
	make('exp-013', 'emp-003', '2026-02-15', 'telefoon', 'Telefoonkosten februari', 35.0, 'paid'),
	make(
		'exp-014',
		'emp-008',
		'2026-02-20',
		'opleidingen',
		'EHBO hercertificering',
		195.0,
		'approved'
	),
	make('exp-015', 'emp-005', '2026-02-22', 'reiskosten', 'Auto kosten bezoek', 43.2, 'rejected'),
	// January 2026
	make(
		'exp-016',
		'emp-004',
		'2026-01-08',
		'verblijfkosten',
		'Hotel overnachting symposium',
		189.0,
		'paid'
	),
	make(
		'exp-017',
		'emp-010',
		'2026-01-15',
		'kantoorbenodigdheden',
		'Printer cartridges',
		67.9,
		'paid'
	),
	make('exp-018', 'emp-002', '2026-01-22', 'representatie', 'Kerstpakketten team', 320.0, 'paid'),
	// April 2026 (current month)
	make(
		'exp-019',
		'emp-001',
		'2026-04-01',
		'reiskosten',
		'Treinreis Den Haag – Rotterdam',
		42.5,
		'pending'
	),
	make(
		'exp-020',
		'emp-003',
		'2026-04-01',
		'kantoorbenodigdheden',
		'Pennen en ordners kantoor',
		28.9,
		'pending'
	),
	make('exp-021', 'emp-007', '2026-04-01', 'maaltijden', 'Lunch teamoverleg', 67.5, 'approved'),
	make('exp-022', 'emp-005', '2026-04-01', 'telefoon', 'Telefoonabonnement april', 35.0, 'pending'),
	make(
		'exp-023',
		'emp-008',
		'2026-04-01',
		'opleidingen',
		'Cursus BHV hercertificering',
		195.0,
		'approved'
	),
	make(
		'exp-024',
		'emp-002',
		'2026-04-02',
		'reiskosten',
		'Kilometervergoeding cliëntbezoek',
		54.2,
		'pending'
	),
	make(
		'exp-025',
		'emp-004',
		'2026-04-03',
		'maaltijden',
		'Teamdiner projectafsluiting',
		189.0,
		'pending'
	),
	make('exp-026', 'emp-010', '2026-04-04', 'telefoon', 'Telefoonkosten april', 35.0, 'approved'),
	make(
		'exp-027',
		'emp-001',
		'2026-04-07',
		'reiskosten',
		'Treinreis Utrecht retour',
		67.8,
		'pending'
	)
];

export function listMockExpenses() {
	return delay(350).then(() => ({ data: mockExpenses, success: true }) as ApiEnvelope<Expense[]>);
}
