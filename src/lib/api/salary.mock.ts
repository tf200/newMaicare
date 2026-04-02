import type { ApiEnvelope } from '$lib/types/api';
import type {
	CaoSalaryScale,
	ShiftAssignment,
	Service,
	ContractChange,
	LeaveBalance,
	LeavePayout
} from '$lib/types/api/salary';
import type { EmployeeListItem } from '$lib/api/employees';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Mock employee list
// ---------------------------------------------------------------------------
const mockEmployees: EmployeeListItem[] = [
	{
		id: 'emp-001',
		first_name: 'Sophie',
		last_name: 'de Vries',
		bsn: '123456789',
		contract_type: 'loondienst',
		department: 'Zorg',
		location_address: null,
		contract_end_date: null
	},
	{
		id: 'emp-002',
		first_name: 'Ahmed',
		last_name: 'El Amrani',
		bsn: '234567890',
		contract_type: 'loondienst',
		department: 'Zorg',
		location_address: null,
		contract_end_date: null
	},
	{
		id: 'emp-003',
		first_name: 'Lisa',
		last_name: 'van den Berg',
		bsn: '345678901',
		contract_type: 'loondienst',
		department: 'Administratie',
		location_address: null,
		contract_end_date: null
	},
	{
		id: 'emp-004',
		first_name: 'Mohammed',
		last_name: 'Hassan',
		bsn: '456789012',
		contract_type: 'loondienst',
		department: 'Zorg',
		location_address: null,
		contract_end_date: null
	},
	{
		id: 'emp-005',
		first_name: 'Emma',
		last_name: 'Bakker',
		bsn: '567890123',
		contract_type: 'loondienst',
		department: 'Zorg',
		location_address: null,
		contract_end_date: null
	},
	{
		id: 'emp-006',
		first_name: 'Youssef',
		last_name: 'El Mahdi',
		bsn: '678901234',
		contract_type: 'ZZP',
		department: 'Zorg',
		location_address: null,
		contract_end_date: null
	},
	{
		id: 'emp-007',
		first_name: 'Fatima',
		last_name: 'Zorgman',
		bsn: '789012345',
		contract_type: 'loondienst',
		department: 'Zorg',
		location_address: null,
		contract_end_date: null
	},
	{
		id: 'emp-008',
		first_name: 'Julia',
		last_name: 'Smit',
		bsn: '890123456',
		contract_type: 'loondienst',
		department: 'HR',
		location_address: null,
		contract_end_date: null
	},
	{
		id: 'emp-009',
		first_name: 'Khalid',
		last_name: 'Rachidi',
		bsn: '901234567',
		contract_type: 'ZZP',
		department: 'Schoonmaak',
		location_address: null,
		contract_end_date: null
	},
	{
		id: 'emp-010',
		first_name: 'Anna',
		last_name: 'Jansen',
		bsn: '012345678',
		contract_type: 'loondienst',
		department: 'Administratie',
		location_address: null,
		contract_end_date: null
	}
];

// Extend mock employees with salary-specific fields at runtime
const mockEmployeeExtras: Record<
	string,
	{
		salary_scale: number | null;
		salary_periodiek: number | null;
		contract_hours: number;
		contract_rate: number | null;
		date_of_birth: string | null;
		contract_start_date: string | null;
	}
> = {
	'emp-001': {
		salary_scale: 45,
		salary_periodiek: 3,
		contract_hours: 36,
		contract_rate: null,
		date_of_birth: '1992-03-15',
		contract_start_date: '2021-06-01'
	},
	'emp-002': {
		salary_scale: 50,
		salary_periodiek: 5,
		contract_hours: 32,
		contract_rate: null,
		date_of_birth: '1988-11-22',
		contract_start_date: '2019-01-15'
	},
	'emp-003': {
		salary_scale: 40,
		salary_periodiek: 2,
		contract_hours: 36,
		contract_rate: null,
		date_of_birth: '1995-07-08',
		contract_start_date: '2023-02-01'
	},
	'emp-004': {
		salary_scale: 45,
		salary_periodiek: 6,
		contract_hours: 24,
		contract_rate: null,
		date_of_birth: '1990-01-30',
		contract_start_date: '2020-09-01'
	},
	'emp-005': {
		salary_scale: 40,
		salary_periodiek: 1,
		contract_hours: 36,
		contract_rate: null,
		date_of_birth: '1997-05-12',
		contract_start_date: '2024-03-01'
	},
	'emp-006': {
		salary_scale: null,
		salary_periodiek: null,
		contract_hours: 0,
		contract_rate: 65,
		date_of_birth: '1985-09-18',
		contract_start_date: '2022-04-01'
	},
	'emp-007': {
		salary_scale: 50,
		salary_periodiek: 8,
		contract_hours: 36,
		contract_rate: null,
		date_of_birth: '1983-12-04',
		contract_start_date: '2017-08-01'
	},
	'emp-008': {
		salary_scale: 35,
		salary_periodiek: 3,
		contract_hours: 40,
		contract_rate: null,
		date_of_birth: '1996-02-28',
		contract_start_date: '2022-11-01'
	},
	'emp-009': {
		salary_scale: null,
		salary_periodiek: null,
		contract_hours: 0,
		contract_rate: 55,
		date_of_birth: '1991-06-10',
		contract_start_date: '2023-07-01'
	},
	'emp-010': {
		salary_scale: 40,
		salary_periodiek: 4,
		contract_hours: 36,
		contract_rate: null,
		date_of_birth: '1994-08-25',
		contract_start_date: '2021-01-15'
	}
};

export function listMockEmployees() {
	return delay(300).then(() => ({
		data: {
			results: mockEmployees.map((e) => ({
				...e,
				...(mockEmployeeExtras[e.id] ?? {})
			})),
			count: mockEmployees.length
		},
		success: true
	})) as Promise<ApiEnvelope<{ results: any[]; count: number }>>;
}

// ---------------------------------------------------------------------------
// Mock services
// ---------------------------------------------------------------------------
const mockServices: Service[] = [
	{
		id: 'svc-001',
		legacy_id: null,
		name: 'Ochtenddienst',
		start_time: '07:00',
		end_time: '15:00',
		paid_hours: 7.5
	},
	{
		id: 'svc-002',
		legacy_id: null,
		name: 'Avonddienst',
		start_time: '14:30',
		end_time: '22:30',
		paid_hours: 7.5
	},
	{
		id: 'svc-003',
		legacy_id: null,
		name: 'Nachtdienst',
		start_time: '22:00',
		end_time: '07:30',
		paid_hours: 9
	},
	{
		id: 'svc-004',
		legacy_id: null,
		name: 'Weekend Ochtend',
		start_time: '08:00',
		end_time: '16:00',
		paid_hours: 7.5
	},
	{
		id: 'svc-005',
		legacy_id: null,
		name: 'Weekend Avond',
		start_time: '15:00',
		end_time: '23:00',
		paid_hours: 7.5
	}
];

// ---------------------------------------------------------------------------
// Mock shift assignments – generated per employee for the current month
// ---------------------------------------------------------------------------
function generateAssignments(startStr: string, endStr: string): ShiftAssignment[] {
	const assignments: ShiftAssignment[] = [];
	const startDate = new Date(startStr);
	const endDate = new Date(endStr);
	const servicePool = ['svc-001', 'svc-002', 'svc-003', 'svc-004', 'svc-005'];
	const employeeShiftCounts: Record<string, number> = {
		'emp-001': 16,
		'emp-002': 14,
		'emp-003': 15,
		'emp-004': 10,
		'emp-005': 16,
		'emp-006': 8,
		'emp-007': 15,
		'emp-008': 17,
		'emp-009': 5,
		'emp-010': 15
	};

	let idCounter = 0;

	for (const empId of Object.keys(employeeShiftCounts)) {
		const count = employeeShiftCounts[empId];
		const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
		const step = Math.max(1, Math.floor(totalDays / count));

		let shiftsCreated = 0;
		for (let d = 0; d < totalDays && shiftsCreated < count; d += step) {
			const shiftDate = new Date(startDate);
			shiftDate.setDate(shiftDate.getDate() + d);
			const dayOfWeek = shiftDate.getDay();

			// Pick service based on day
			let serviceId: string;
			if (dayOfWeek === 0 || dayOfWeek === 6) {
				serviceId = Math.random() > 0.5 ? 'svc-004' : 'svc-005';
			} else {
				serviceId = servicePool[Math.floor(Math.random() * 3)];
			}

			const svc = mockServices.find((s) => s.id === serviceId)!;

			assignments.push({
				id: `asgn-${++idCounter}`,
				employee_id: empId,
				service_id: serviceId,
				shift_date: shiftDate.toISOString().split('T')[0],
				start_time: svc.start_time,
				end_time: svc.end_time
			});

			shiftsCreated++;
		}
	}

	return assignments;
}

// ---------------------------------------------------------------------------
// Mock CAO salary scales
// ---------------------------------------------------------------------------
const mockScales: CaoSalaryScale[] = [
	{
		id: 'sc-01',
		scale_number: 35,
		periodiek: 1,
		monthly_salary: 2457,
		hourly_rate: 14.18,
		is_uitloop: false
	},
	{
		id: 'sc-02',
		scale_number: 35,
		periodiek: 2,
		monthly_salary: 2580,
		hourly_rate: 14.89,
		is_uitloop: false
	},
	{
		id: 'sc-03',
		scale_number: 35,
		periodiek: 3,
		monthly_salary: 2710,
		hourly_rate: 15.64,
		is_uitloop: false
	},
	{
		id: 'sc-04',
		scale_number: 40,
		periodiek: 1,
		monthly_salary: 2750,
		hourly_rate: 15.87,
		is_uitloop: false
	},
	{
		id: 'sc-05',
		scale_number: 40,
		periodiek: 2,
		monthly_salary: 2890,
		hourly_rate: 16.68,
		is_uitloop: false
	},
	{
		id: 'sc-06',
		scale_number: 40,
		periodiek: 3,
		monthly_salary: 3035,
		hourly_rate: 17.51,
		is_uitloop: false
	},
	{
		id: 'sc-07',
		scale_number: 40,
		periodiek: 4,
		monthly_salary: 3187,
		hourly_rate: 18.39,
		is_uitloop: false
	},
	{
		id: 'sc-08',
		scale_number: 45,
		periodiek: 1,
		monthly_salary: 3025,
		hourly_rate: 17.46,
		is_uitloop: false
	},
	{
		id: 'sc-09',
		scale_number: 45,
		periodiek: 2,
		monthly_salary: 3180,
		hourly_rate: 18.36,
		is_uitloop: false
	},
	{
		id: 'sc-10',
		scale_number: 45,
		periodiek: 3,
		monthly_salary: 3340,
		hourly_rate: 19.28,
		is_uitloop: false
	},
	{
		id: 'sc-11',
		scale_number: 45,
		periodiek: 4,
		monthly_salary: 3510,
		hourly_rate: 20.26,
		is_uitloop: false
	},
	{
		id: 'sc-12',
		scale_number: 45,
		periodiek: 5,
		monthly_salary: 3688,
		hourly_rate: 21.29,
		is_uitloop: false
	},
	{
		id: 'sc-13',
		scale_number: 45,
		periodiek: 6,
		monthly_salary: 3875,
		hourly_rate: 22.37,
		is_uitloop: false
	},
	{
		id: 'sc-14',
		scale_number: 50,
		periodiek: 1,
		monthly_salary: 3400,
		hourly_rate: 19.63,
		is_uitloop: false
	},
	{
		id: 'sc-15',
		scale_number: 50,
		periodiek: 2,
		monthly_salary: 3575,
		hourly_rate: 20.64,
		is_uitloop: false
	},
	{
		id: 'sc-16',
		scale_number: 50,
		periodiek: 3,
		monthly_salary: 3758,
		hourly_rate: 21.69,
		is_uitloop: false
	},
	{
		id: 'sc-17',
		scale_number: 50,
		periodiek: 4,
		monthly_salary: 3948,
		hourly_rate: 22.79,
		is_uitloop: false
	},
	{
		id: 'sc-18',
		scale_number: 50,
		periodiek: 5,
		monthly_salary: 4148,
		hourly_rate: 23.94,
		is_uitloop: false
	},
	{
		id: 'sc-19',
		scale_number: 50,
		periodiek: 6,
		monthly_salary: 4358,
		hourly_rate: 25.15,
		is_uitloop: false
	},
	{
		id: 'sc-20',
		scale_number: 50,
		periodiek: 7,
		monthly_salary: 4576,
		hourly_rate: 26.41,
		is_uitloop: false
	},
	{
		id: 'sc-21',
		scale_number: 50,
		periodiek: 8,
		monthly_salary: 4805,
		hourly_rate: 27.73,
		is_uitloop: false
	}
];

// ---------------------------------------------------------------------------
// Mock contract changes
// ---------------------------------------------------------------------------
const mockContractChanges: ContractChange[] = [
	{
		id: 'cc-001',
		employee_id: 'emp-004',
		field_changed: 'hours_per_week',
		old_value: '36',
		new_value: '24',
		change_date: '2025-01-01'
	}
];

// ---------------------------------------------------------------------------
// Mock leave balances
// ---------------------------------------------------------------------------
const mockLeaveBalances: LeaveBalance[] = [
	{
		employee_id: 'emp-001',
		year: 2026,
		vacation_hours_total: 151.2,
		vacation_hours_used: 24,
		leave_budget_hours_total: 52.8,
		leave_budget_hours_used: 8
	},
	{
		employee_id: 'emp-002',
		year: 2026,
		vacation_hours_total: 134.4,
		vacation_hours_used: 40,
		leave_budget_hours_total: 47,
		leave_budget_hours_used: 0
	},
	{
		employee_id: 'emp-003',
		year: 2026,
		vacation_hours_total: 151.2,
		vacation_hours_used: 16,
		leave_budget_hours_total: 52.8,
		leave_budget_hours_used: 4
	},
	{
		employee_id: 'emp-004',
		year: 2026,
		vacation_hours_total: 84,
		vacation_hours_used: 12,
		leave_budget_hours_total: 29.4,
		leave_budget_hours_used: 0
	},
	{
		employee_id: 'emp-005',
		year: 2026,
		vacation_hours_total: 151.2,
		vacation_hours_used: 8,
		leave_budget_hours_total: 52.8,
		leave_budget_hours_used: 0
	},
	{
		employee_id: 'emp-007',
		year: 2026,
		vacation_hours_total: 151.2,
		vacation_hours_used: 60,
		leave_budget_hours_total: 52.8,
		leave_budget_hours_used: 16
	},
	{
		employee_id: 'emp-008',
		year: 2026,
		vacation_hours_total: 168,
		vacation_hours_used: 32,
		leave_budget_hours_total: 58.8,
		leave_budget_hours_used: 8
	},
	{
		employee_id: 'emp-010',
		year: 2026,
		vacation_hours_total: 151.2,
		vacation_hours_used: 20,
		leave_budget_hours_total: 52.8,
		leave_budget_hours_used: 4
	}
];

// ---------------------------------------------------------------------------
// Mock leave payouts
// ---------------------------------------------------------------------------
const mockLeavePayouts: LeavePayout[] = [
	{
		id: 'lp-001',
		employee_id: 'emp-007',
		salary_month: '2026-03-01',
		payout_code: 'W',
		leave_type: 'vacation',
		hours_requested: 16,
		hourly_rate: 26.41,
		total_amount: 422.56,
		status: 'approved'
	}
];

// ---------------------------------------------------------------------------
// Public API functions (return mock data with artificial delay)
// ---------------------------------------------------------------------------
export function listCaoSalaryScales() {
	return delay(400).then(
		() => ({ data: mockScales, success: true }) as ApiEnvelope<CaoSalaryScale[]>
	);
}

export function listShiftAssignments(params: { start_date: string; end_date: string }) {
	return delay(500).then(
		() =>
			({
				data: generateAssignments(params.start_date, params.end_date),
				success: true
			}) as ApiEnvelope<ShiftAssignment[]>
	);
}

export function listServices() {
	return delay(200).then(() => ({ data: mockServices, success: true }) as ApiEnvelope<Service[]>);
}

export function listContractChanges() {
	return delay(200).then(
		() => ({ data: mockContractChanges, success: true }) as ApiEnvelope<ContractChange[]>
	);
}

export function listLeaveBalancesForYear(year: number) {
	return delay(300).then(
		() =>
			({
				data: mockLeaveBalances.filter((b) => b.year === year),
				success: true
			}) as ApiEnvelope<LeaveBalance[]>
	);
}

export function listLeavePayoutsForMonth(salaryMonth: string) {
	return delay(200).then(
		() =>
			({
				data: mockLeavePayouts.filter((p) => p.salary_month === salaryMonth),
				success: true
			}) as ApiEnvelope<LeavePayout[]>
	);
}

export function sendSalarySlipEmail(payload: {
	to: string;
	subject: string;
	filename: string;
	pdfBase64: string;
}) {
	return delay(1000).then(() => ({ data: null, success: true }) as ApiEnvelope<null>);
}
