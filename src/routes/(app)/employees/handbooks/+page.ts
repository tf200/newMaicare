import type { PageLoad } from './$types';

export type HandbookStatus =
	| 'not_started'
	| 'in_progress'
	| 'completed'
	| 'waived'
	| 'no_assignment';

export interface EmployeeHandbookAssignment {
	id: string;
	employee_id: string;
	employee_name: string;
	employee_initials: string;
	status: HandbookStatus;
	template_id: string;
	template_title: string;
	template_version: string;
	assigned_at: string | null;
	started_at: string | null;
	completed_at: string | null;
	completed_steps: number;
	total_steps: number;
}

export interface HandbookTemplate {
	id: string;
	title: string;
	version: string;
	description: string;
	steps_count: number;
}

export interface HandbooksLoadResult {
	assignments: EmployeeHandbookAssignment[];
	templates: HandbookTemplate[];
	pagination: {
		page: number;
		pageSize: number;
		count: number;
	};
	loadError: string | null;
}

export const load: PageLoad = async ({ url }: { url: URL }) => {
	const page = Number(url.searchParams.get('page')) || 1;
	const pageSize = Number(url.searchParams.get('page_size')) || 10;
	const status = url.searchParams.get('status') || 'all';

	// Mock data
	const mockAssignments: EmployeeHandbookAssignment[] = [
		{
			id: 'as-1',
			employee_id: 'emp-1',
			employee_name: 'Emma van der Berg',
			employee_initials: 'EB',
			status: 'completed',
			template_id: 'tmpl-1',
			template_title: 'Employee Handbook 2024',
			template_version: '1.2.0',
			assigned_at: '2024-01-15T10:00:00Z',
			started_at: '2024-01-15T14:30:00Z',
			completed_at: '2024-01-16T09:15:00Z',
			completed_steps: 12,
			total_steps: 12
		},
		{
			id: 'as-2',
			employee_id: 'emp-2',
			employee_name: 'Lars Jansen',
			employee_initials: 'LJ',
			status: 'in_progress',
			template_id: 'tmpl-1',
			template_title: 'Employee Handbook 2024',
			template_version: '1.2.0',
			assigned_at: '2024-02-10T11:00:00Z',
			started_at: '2024-02-11T08:00:00Z',
			completed_at: null,
			completed_steps: 5,
			total_steps: 12
		},
		{
			id: 'as-3',
			employee_id: 'emp-3',
			employee_name: 'Sophie de Boer',
			employee_initials: 'SB',
			status: 'not_started',
			template_id: 'tmpl-1',
			template_title: 'Employee Handbook 2024',
			template_version: '1.2.0',
			assigned_at: '2024-03-01T09:00:00Z',
			started_at: null,
			completed_at: null,
			completed_steps: 0,
			total_steps: 12
		},
		{
			id: 'as-4',
			employee_id: 'emp-4',
			employee_name: 'Daan van Dijk',
			employee_initials: 'DD',
			status: 'waived',
			template_id: 'tmpl-0',
			template_title: 'Legacy Handbook 2023',
			template_version: '0.9.5',
			assigned_at: '2023-11-20T10:00:00Z',
			started_at: '2023-11-21T09:00:00Z',
			completed_at: null,
			completed_steps: 3,
			total_steps: 10
		},
		{
			id: 'as-5',
			employee_id: 'emp-5',
			employee_name: 'Julia Bakker',
			employee_initials: 'JB',
			status: 'no_assignment',
			template_id: '',
			template_title: '',
			template_version: '',
			assigned_at: null,
			started_at: null,
			completed_at: null,
			completed_steps: 0,
			total_steps: 0
		}
	];

	const mockTemplates: HandbookTemplate[] = [
		{
			id: 'tmpl-1',
			title: 'Employee Handbook 2024',
			version: '1.2.0',
			description: 'The latest handbook for all staff members.',
			steps_count: 12
		},
		{
			id: 'tmpl-2',
			title: 'Onboarding Guide for Nurses',
			version: '1.0.0',
			description: 'Specific onboarding steps for nursing staff.',
			steps_count: 8
		},
		{
			id: 'tmpl-0',
			title: 'Legacy Handbook 2023',
			version: '0.9.5',
			description: 'Old version of the general handbook.',
			steps_count: 10
		}
	];

	const filteredAssignments =
		status === 'all' ? mockAssignments : mockAssignments.filter((a) => a.status === status);

	// In a real app, this would be a fetch
	const handbooksDataPromise: Promise<HandbooksLoadResult> = Promise.resolve({
		assignments: filteredAssignments,
		templates: mockTemplates,
		pagination: {
			page,
			pageSize,
			count: filteredAssignments.length
		},
		loadError: null
	});

	return {
		initial: {
			page,
			pageSize,
			status
		},
		handbooksData: handbooksDataPromise
	};
};
