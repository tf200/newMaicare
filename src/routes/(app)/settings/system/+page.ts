import type { PageLoad } from './$types';
import type { SystemSettings } from './types';

export const load: PageLoad = async () => {
	// Mocking a delay
	await new Promise((resolve) => setTimeout(resolve, 500));

	const systemSettings: SystemSettings = {
		organization: {
			name: 'MaiCare Care Solutions',
			timezone: 'Europe/Amsterdam',
			address: {
				street: 'Zorglaan',
				number: '42',
				postalCode: '1234 AB',
				city: 'Utrecht',
				country: 'Netherlands'
			},
			contact: {
				email: 'admin@maicare.com',
				phone: '+31 30 123 4567',
				website: 'https://maicare.com'
			}
		},
		roles: [
			{
				id: '1',
				name: 'Administrator',
				description: 'Full system access with all permissions.',
				permissions: ['ALL'],
				userCount: 3
			},
			{
				id: '2',
				name: 'Manager',
				description: 'Can manage employees and view reports.',
				permissions: ['EMPLOYEE.VIEW', 'EMPLOYEE.EDIT', 'REPORT.VIEW'],
				userCount: 8
			},
			{
				id: '3',
				name: 'Caregiver',
				description: 'Standard access for care coordination.',
				permissions: ['CLIENT.VIEW', 'CLIENT.EDIT', 'CARE.VIEW'],
				userCount: 45
			}
		],
		departments: [
			{
				id: '1',
				name: 'Medical',
				description: 'Nursing and clinical staff.',
				head: 'Dr. Sarah Jansen',
				employeeCount: 24
			},
			{
				id: '2',
				name: 'Administration',
				description: 'Human resources and office management.',
				head: 'Mark de Vries',
				employeeCount: 6
			},
			{
				id: '3',
				name: 'Support',
				description: 'IT and facility management.',
				head: 'Elena Petrova',
				employeeCount: 4
			}
		],
		security: {
			auditLogRetentionDays: 90,
			sessionTimeoutMinutes: 30,
			requireTwoFactor: true,
			passwordComplexity: {
				minLength: 12,
				requireNumbers: true,
				requireSymbols: true,
				requireUppercase: true
			}
		},
		integrations: [
			{
				id: '1',
				name: 'SendGrid',
				status: 'connected',
				lastSync: '2024-03-05T10:00:00Z',
				description: 'Email delivery service for notifications and reports.'
			},
			{
				id: '2',
				name: 'Twilio',
				status: 'disconnected',
				description: 'SMS gateway for two-factor authentication and alerts.'
			},
			{
				id: '3',
				name: 'AFAS Sync',
				status: 'pending',
				description: 'External HR and payroll synchronization.'
			}
		]
	};

	return {
		systemSettings,
		loadError: null as string | null
	};
};
