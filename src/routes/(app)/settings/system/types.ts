export interface OrganizationProfile {
	name: string;
	timezone: string;
	address: {
		street: string;
		number: string;
		postalCode: string;
		city: string;
		country: string;
	};
	contact: {
		email: string;
		phone: string;
		website: string;
	};
}

export interface Role {
	id: string;
	name: string;
	description: string;
	permissions: string[];
	userCount: number;
	permissionCount?: number;
}

export interface Department {
	id: string;
	name: string;
	description: string;
	head: string | null;
	employeeCount: number;
}

export interface PermissionItem {
	id: string;
	label: string;
	description: string;
	resource?: string;
}

export interface PermissionGroup {
	id: string;
	label: string;
	permissions: PermissionItem[];
}

export interface EmployeeOption {
	id: string;
	name: string;
}

export interface SecurityPolicy {
	auditLogRetentionDays: number;
	sessionTimeoutMinutes: number;
	requireTwoFactor: boolean;
	passwordComplexity: {
		minLength: number;
		requireNumbers: boolean;
		requireSymbols: boolean;
		requireUppercase: boolean;
	};
}

export interface Integration {
	id: string;
	name: string;
	status: 'connected' | 'disconnected' | 'pending';
	lastSync?: string;
	description: string;
}

export interface SystemSettings {
	organization: OrganizationProfile;
	roles: Role[];
	departments: Department[];
	security: SecurityPolicy;
	integrations: Integration[];
}
