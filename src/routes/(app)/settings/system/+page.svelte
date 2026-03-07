<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import {
		Building2,
		ShieldCheck,
		Share2,
		Lock,
		Users,
		Settings2,
		ChevronLeft
	} from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import OrganizationSection from './sections/OrganizationSection.svelte';
	import RolesSection from './sections/RolesSection.svelte';
	import DepartmentsSection from './sections/DepartmentsSection.svelte';
	import SecuritySection from './sections/SecuritySection.svelte';
	import IntegrationsSection from './sections/IntegrationsSection.svelte';
	import type { Department, EmployeeOption, OrganizationProfile, PermissionGroup, Role } from './types';
	import type { GetOrganizationProfileResponse } from '$lib/types/api';
	import {
		addPermissionsToRole,
		createDepartment,
		createRole,
		listRolePermissions,
		updateDepartment,
		updateOrganizationProfile
	} from '$lib/api/settings';

	let { data }: { data: PageData } = $props();

	const systemSettings = $derived(data.systemSettings);
	const permissionGroups = $derived<PermissionGroup[]>(data.permissionGroups ?? []);
	const initialRolePermissionsByRoleId = $derived<Record<string, string[]>>(
		data.rolePermissionsByRoleId ?? {}
	);
	const employees = $derived<EmployeeOption[]>(data.employees ?? []);

	const tabs = [
		{ id: 'organization', label: 'Organization', icon: Building2 },
		{ id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
		{ id: 'departments', label: 'Departments', icon: Users },
		{ id: 'security', label: 'Security', icon: Lock },
		{ id: 'integrations', label: 'Integrations', icon: Share2 }
	] as const;

	type TabId = (typeof tabs)[number]['id'];
	let activeTab = $state<TabId>('organization');

	function mapOrganizationProfile(data: GetOrganizationProfileResponse): OrganizationProfile {
		const houseNumber = [data.hq_house_number, data.hq_house_number_addition]
			.filter(Boolean)
			.join(' ');

		return {
			name: data.name,
			timezone: data.default_timezone,
			address: {
				street: data.hq_street,
				number: houseNumber,
				postalCode: data.hq_postal_code,
				city: data.hq_city,
				country: 'Netherlands'
			},
			contact: {
				email: data.email,
				phone: data.phone_number,
				website: data.website
			}
		};
	}

	async function handleSaveOrganization(profile: OrganizationProfile) {
		const payload = {
			default_timezone: profile.timezone,
			name: profile.name,
			email: profile.contact.email,
			phone_number: profile.contact.phone,
			website: profile.contact.website,
			hq_street: profile.address.street,
			hq_house_number: profile.address.number,
			hq_postal_code: profile.address.postalCode,
			hq_city: profile.address.city,
			hq_house_number_addition: ''
		};

		const response = await updateOrganizationProfile(payload);
		const mapped = mapOrganizationProfile(response.data);
		return mapped;
	}

	async function handleCreateRole(payload: { name: string; description?: string }) {
		const response = await createRole({
			name: payload.name,
			description: payload.description
		});

		const created: Role = {
			id: response.data.role_id,
			name: response.data.name,
			description: response.data.description ?? payload.description ?? '',
			permissions: [],
			userCount: 0,
			permissionCount: 0
		};
		return created;
	}

	async function handleFetchRolePermissions(roleId: string) {
		const response = await listRolePermissions(roleId);
		const permissions = response.data.map((item) => item.permission_id);
		return permissions;
	}

	async function handleSaveRolePermissions(roleId: string, permissionIds: string[]) {
		await addPermissionsToRole(roleId, { permission_ids: permissionIds });
	}

	async function handleCreateDepartment(payload: {
		name: string;
		description?: string;
		departmentHeadId?: string | null;
	}) {
		const response = await createDepartment({
			name: payload.name,
			description: payload.description,
			department_head_employee_id: payload.departmentHeadId ?? undefined
		});

		const department: Department = {
			id: response.data.id,
			name: response.data.name,
			description: response.data.description ?? '',
			head: response.data.department_head_employee_id ?? null,
			employeeCount: 0
		};
		return department;
	}

	async function handleUpdateDepartment(
		id: string,
		payload: { name?: string; description?: string; departmentHeadId?: string | null }
	) {
		const response = await updateDepartment(id, {
			name: payload.name,
			description: payload.description,
			department_head_employee_id: payload.departmentHeadId ?? undefined
		});

		const updated: Department = {
			id: response.data.id,
			name: response.data.name,
			description: response.data.description ?? '',
			head: response.data.department_head_employee_id ?? null,
			employeeCount: systemSettings.departments.find((dept) => dept.id === id)?.employeeCount ?? 0
		};
		return updated;
	}
</script>

<div class="mx-auto max-w-6xl space-y-8 pb-20">
	<header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
		<div class="space-y-2">
			<button
				type="button"
				onclick={() => goto('/dashboard')}
				class="flex items-center gap-2 text-xs font-bold tracking-widest text-text-muted uppercase transition hover:text-brand"
			>
				<ChevronLeft class="h-3 w-3" />
				Back to Dashboard
			</button>
			<div class="flex items-center gap-4">
				<h1 class="text-4xl font-bold tracking-tight text-text">System Settings</h1>
			</div>
			<p class="mt-2 text-text-muted">
				Manage global application configuration and infrastructure.
			</p>
		</div>

		<div class="flex gap-3">
			<Button variant="ghost" class="gap-2 rounded-xl">
				<Settings2 class="h-4 w-4" />
				Audit Logs
			</Button>
		</div>
	</header>

	<nav class="no-scrollbar flex overflow-x-auto border-b border-border/50 pb-px">
		<div class="flex min-w-full gap-1">
			{#each tabs as tab (tab.id)}
				<button
					onclick={() => (activeTab = tab.id)}
					class="relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all
					{activeTab === tab.id ? 'text-brand' : 'text-text-muted hover:bg-surface/50 hover:text-text'}"
				>
					<tab.icon class="h-4 w-4" />
					{tab.label}
					{#if activeTab === tab.id}
						<div
							class="absolute right-0 bottom-0 left-0 h-0.5 bg-brand"
							in:fade={{ duration: 200 }}
						></div>
					{/if}
				</button>
			{/each}
		</div>
	</nav>

	<main class="min-h-[600px]">
		{#if activeTab === 'organization'}
			<div in:fade={{ duration: 300 }}>
				<OrganizationSection
					organization={systemSettings.organization}
					onSave={handleSaveOrganization}
				/>
			</div>
		{:else if activeTab === 'roles'}
			<div in:fade={{ duration: 300 }}>
				<RolesSection
					roles={systemSettings.roles}
					permissionGroups={permissionGroups}
					initialRolePermissions={initialRolePermissionsByRoleId}
					onCreateRole={handleCreateRole}
					onFetchRolePermissions={handleFetchRolePermissions}
					onSaveRolePermissions={handleSaveRolePermissions}
				/>
			</div>
		{:else if activeTab === 'departments'}
			<div in:fade={{ duration: 300 }}>
				<DepartmentsSection
					departments={systemSettings.departments}
					employees={employees}
					onCreateDepartment={handleCreateDepartment}
					onUpdateDepartment={handleUpdateDepartment}
				/>
			</div>
		{:else if activeTab === 'security'}
			<div in:fade={{ duration: 300 }}>
				<SecuritySection security={systemSettings.security} />
			</div>
		{:else if activeTab === 'integrations'}
			<div in:fade={{ duration: 300 }}>
				<IntegrationsSection integrations={systemSettings.integrations} />
			</div>
		{/if}
	</main>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
