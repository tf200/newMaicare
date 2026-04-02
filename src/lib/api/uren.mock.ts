import type { ApiEnvelope } from '$lib/types/api';
import type { TimeEntry } from '$lib/types/api/uren';

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

function make(id: string, empId: string, date: string, hours: number, hourType: string, cat: string, desc: string | null, project: string | null, status: string): TimeEntry {
	const emp = employees.find((e) => e.id === empId)!;
	return {
		id,
		employee_id: empId,
		employee_name: emp.name,
		entry_date: date,
		hours,
		hour_type: hourType as any,
		activity_category: cat as any,
		activity_description: desc,
		project_name: project,
		status: status as any,
		created_at: `${date}T08:00:00Z`
	};
}

const mockEntries: TimeEntry[] = [
	// March 10
	make('te-001', 'emp-001', '2026-03-10', 4, 'regular', 'zorg', 'Begeleiding dagbesteding groep A', 'Woonlocatie De Es', 'approved'),
	make('te-002', 'emp-001', '2026-03-10', 2.5, 'regular', 'zorg', 'Persoonlijke verzorging cliënten', 'Woonlocatie De Es', 'approved'),
	make('te-003', 'emp-001', '2026-03-10', 1, 'regular', 'administratie', 'Verslaglegging dagrapporten', 'Woonlocatie De Es', 'approved'),
	make('te-004', 'emp-002', '2026-03-10', 3, 'regular', 'zorg', 'Begeleiding middagactiviteiten', 'Woonlocatie De Es', 'submitted'),
	make('te-005', 'emp-002', '2026-03-10', 1.5, 'regular', 'overleg', 'MDT-overleg', 'Woonlocatie De Es', 'submitted'),
	make('te-006', 'emp-005', '2026-03-10', 7.5, 'regular', 'zorg', 'Dienst ochtend + avond', 'Woonlocatie De Es', 'draft'),
	// March 11
	make('te-007', 'emp-001', '2026-03-11', 7.5, 'regular', 'zorg', 'Dienst ochtend', 'Woonlocatie De Es', 'approved'),
	make('te-008', 'emp-003', '2026-03-11', 7.5, 'regular', 'administratie', 'Facturatie en boekhouding', null, 'approved'),
	make('te-009', 'emp-004', '2026-03-11', 6, 'regular', 'zorg', 'Begeleiding individueel', 'Woonlocatie De Es', 'approved'),
	make('te-010', 'emp-007', '2026-03-11', 7.5, 'regular', 'zorg', 'Dienst avond', 'Woonlocatie De Es', 'approved'),
	// March 12
	make('te-011', 'emp-001', '2026-03-12', 7.5, 'regular', 'zorg', 'Dienst ochtend', 'Woonlocatie De Es', 'draft'),
	make('te-012', 'emp-008', '2026-03-12', 4, 'regular', 'administratie', 'Personeelsdossiers bijwerken', null, 'submitted'),
	make('te-013', 'emp-008', '2026-03-12', 3.5, 'regular', 'overleg', 'Functioneringsgesprekken', null, 'submitted'),
	make('te-014', 'emp-010', '2026-03-12', 7.5, 'regular', 'administratie', 'Receptie en telefoon', null, 'approved'),
	// March 9 (zondag)
	make('te-015', 'emp-007', '2026-03-09', 8, 'weekend', 'zorg', 'Dienst zondag', 'Woonlocatie De Es', 'approved'),
	make('te-016', 'emp-004', '2026-03-09', 8, 'weekend', 'zorg', 'Dienst zondag', 'Woonlocatie De Es', 'approved'),
	// Avonddienst
	make('te-017', 'emp-002', '2026-03-11', 5, 'evening', 'zorg', 'Avonddienst 17:00-22:00', 'Woonlocatie De Es', 'approved'),
	// Overuren
	make('te-018', 'emp-001', '2026-03-10', 2, 'overtime', 'zorg', 'Extra begeleiding crisis', 'Woonlocatie De Es', 'rejected'),
	// Opleiding
	make('te-019', 'emp-005', '2026-03-08', 8, 'regular', 'scholing', 'Medicatie training', null, 'approved'),
	// Feestdag
	make('te-020', 'emp-001', '2026-03-15', 7.5, 'holiday', 'zorg', 'Dienst feestdag', 'Woonlocatie De Es', 'draft'),
	// April 2026 (current month)
	make('te-021', 'emp-001', '2026-04-01', 4, 'regular', 'zorg', 'Begeleiding dagbesteding', 'Woonlocatie De Es', 'approved'),
	make('te-022', 'emp-001', '2026-04-01', 3.5, 'regular', 'zorg', 'Persoonlijke verzorging', 'Woonlocatie De Es', 'approved'),
	make('te-023', 'emp-002', '2026-04-01', 7.5, 'regular', 'zorg', 'Dienst ochtend', 'Woonlocatie De Es', 'submitted'),
	make('te-024', 'emp-005', '2026-04-01', 5, 'regular', 'zorg', 'Begeleiding middag', 'Woonlocatie De Es', 'draft'),
	make('te-025', 'emp-008', '2026-04-01', 7.5, 'regular', 'administratie', 'Personeelszaken', null, 'approved'),
	make('te-026', 'emp-003', '2026-04-01', 7.5, 'regular', 'administratie', 'Boekhouding', null, 'approved'),
	make('te-027', 'emp-007', '2026-04-01', 2.5, 'regular', 'zorg', 'Avonddienst deel', 'Woonlocatie De Es', 'submitted'),
	make('te-028', 'emp-004', '2026-04-01', 6, 'regular', 'zorg', 'Individuele begeleiding', 'Woonlocatie De Es', 'draft'),
	// April 2 - additional entries for multiple days
	make('te-029', 'emp-001', '2026-04-02', 7.5, 'regular', 'zorg', 'Dienst ochtend', 'Woonlocatie De Es', 'approved'),
	make('te-030', 'emp-003', '2026-04-02', 7.5, 'regular', 'administratie', 'Facturatie', null, 'approved'),
	make('te-031', 'emp-007', '2026-04-02', 7.5, 'regular', 'zorg', 'Dienst avond', 'Woonlocatie De Es', 'submitted'),
	make('te-032', 'emp-002', '2026-04-03', 4, 'regular', 'zorg', 'Begeleiding dagbesteding', 'Woonlocatie De Es', 'draft'),
	make('te-033', 'emp-010', '2026-04-03', 7.5, 'regular', 'administratie', 'Receptie en telefoon', null, 'approved'),
	make('te-034', 'emp-005', '2026-04-03', 8, 'regular', 'zorg', 'Dienst hele dag', 'Woonlocatie De Es', 'submitted'),
	make('te-035', 'emp-008', '2026-04-03', 6, 'regular', 'administratie', 'Personeelszaken', null, 'approved'),
	make('te-036', 'emp-004', '2026-04-04', 7.5, 'regular', 'zorg', 'Begeleiding groep', 'Woonlocatie De Es', 'approved')
];

export function listMockTimeEntries() {
	return delay(350).then(
		() => ({ data: mockEntries, success: true }) as ApiEnvelope<TimeEntry[]>
	);
}
