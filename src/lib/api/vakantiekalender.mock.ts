import type { ApiEnvelope } from '$lib/types/api';
import type { LeaveRequest, LeaveType } from '$lib/types/api/vakantiekalender';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const employees = [
	{ id: 'emp-001', name: 'Sophie de Vries', department: 'Zorg' },
	{ id: 'emp-002', name: 'Ahmed El Amrani', department: 'Zorg' },
	{ id: 'emp-003', name: 'Lisa van den Berg', department: 'Administratie' },
	{ id: 'emp-004', name: 'Mohammed Hassan', department: 'Zorg' },
	{ id: 'emp-005', name: 'Emma Bakker', department: 'Zorg' },
	{ id: 'emp-007', name: 'Fatima Zorgman', department: 'Zorg' },
	{ id: 'emp-008', name: 'Julia Smit', department: 'HR' },
	{ id: 'emp-010', name: 'Anna Jansen', department: 'Administratie' }
];

function makeLeave(
	id: string,
	empId: string,
	type: LeaveType,
	start: string,
	end: string,
	days: number,
	hours: number,
	status: 'approved' | 'pending',
	reason: string | null = null
): LeaveRequest {
	const emp = employees.find((e) => e.id === empId)!;
	return {
		id,
		employee_id: empId,
		employee_name: emp.name,
		department: emp.department,
		type,
		start_date: start,
		end_date: end,
		days,
		hours,
		status,
		reason,
		submitted_at: '2026-02-01T10:00:00Z'
	};
}

const mockLeaveRequests: LeaveRequest[] = [
	// March 2026
	makeLeave(
		'lr-001',
		'emp-001',
		'vakantie',
		'2026-03-02',
		'2026-03-06',
		5,
		37.5,
		'approved',
		'Voorjaarsvakantie'
	),
	makeLeave('lr-002', 'emp-003', 'vakantie', '2026-03-09', '2026-03-13', 5, 37.5, 'approved'),
	makeLeave(
		'lr-003',
		'emp-007',
		'verlofbudget',
		'2026-03-16',
		'2026-03-18',
		3,
		22.5,
		'approved',
		'Privé afspraak'
	),
	makeLeave('lr-004', 'emp-004', 'vakantie', '2026-03-23', '2026-03-27', 5, 30, 'approved'),
	makeLeave('lr-005', 'emp-010', 'vakantie', '2026-03-25', '2026-03-27', 3, 22.5, 'approved'),
	makeLeave(
		'lr-006',
		'emp-002',
		'bijzonder',
		'2026-03-05',
		'2026-03-05',
		1,
		7.5,
		'approved',
		'Verhuizing'
	),
	makeLeave('lr-007', 'emp-005', 'vakantie', '2026-03-30', '2026-04-03', 5, 37.5, 'approved'),
	// Pending
	makeLeave('lr-008', 'emp-008', 'vakantie', '2026-03-16', '2026-03-20', 5, 40, 'pending'),
	// February 2026
	makeLeave('lr-009', 'emp-001', 'vakantie', '2026-02-16', '2026-02-20', 5, 37.5, 'approved'),
	makeLeave('lr-010', 'emp-007', 'vakantie', '2026-02-23', '2026-02-27', 5, 37.5, 'approved'),
	makeLeave('lr-011', 'emp-002', 'ziekte', '2026-02-10', '2026-02-11', 2, 15, 'approved'),
	// April 2026
	makeLeave(
		'lr-012',
		'emp-001',
		'vakantie',
		'2026-04-06',
		'2026-04-10',
		5,
		37.5,
		'approved',
		'Meivakantie'
	),
	makeLeave('lr-013', 'emp-003', 'verlofbudget', '2026-04-20', '2026-04-22', 3, 22.5, 'approved'),
	makeLeave(
		'lr-014',
		'emp-004',
		'vakantie',
		'2026-04-27',
		'2026-04-27',
		1,
		6,
		'approved',
		'Koningsdag'
	),
	// January 2026
	makeLeave('lr-015', 'emp-010', 'vakantie', '2026-01-05', '2026-01-09', 5, 37.5, 'approved'),
	makeLeave(
		'lr-016',
		'emp-005',
		'bijzonder',
		'2026-01-15',
		'2026-01-15',
		1,
		7.5,
		'approved',
		'Trouwerij'
	)
];

export function listMockLeaveRequests() {
	return delay(350).then(
		() => ({ data: mockLeaveRequests, success: true }) as ApiEnvelope<LeaveRequest[]>
	);
}
