export interface OrganizationProfile {
	name: string;
	timezone: string;
	address: {
		street: string;
		houseNumber: string;
		houseNumberAddition: string;
		postalCode: string;
		city: string;
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
	permissions: PermissionGrant[];
	userCount: number;
	permissionCount: number;
}

export type PermissionScope = 'assigned' | 'all';

export interface PermissionGrant {
	permissionId: string;
	scope: PermissionScope | null;
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
	isScoped: boolean;
	name: string;
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

export type SystemSettingsTab = 'organization' | 'roles' | 'departments';
