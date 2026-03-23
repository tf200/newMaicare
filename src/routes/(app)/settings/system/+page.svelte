<script lang="ts">
	import { getBreadcrumbsState } from '$lib/state/breadcrumbs.svelte';
	import { m } from '$lib/paraglide/messages';
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
	import { localizeHref } from '$lib/paraglide/runtime';
	import OrganizationSection from './sections/OrganizationSection.svelte';
	import RolesSection from './sections/RolesSection.svelte';
	import DepartmentsSection from './sections/DepartmentsSection.svelte';
	import SecuritySection from './sections/SecuritySection.svelte';
	import IntegrationsSection from './sections/IntegrationsSection.svelte';
	import type {
		Department,
		EmployeeOption,
		OrganizationProfile,
		PermissionGroup,
		Role
	} from './types';
	import type { GetOrganizationProfileResponse } from '$lib/types/api';
	import {
		_createInitialSystemSettings,
		_mapDepartment,
		_mapPermissionGroups,
		_mapRole
	} from './+page';
	import type { SystemSettingsLoadResult, SystemSettingsPageData } from './+page';
	import {
		addPermissionsToRole,
		createDepartment,
		createRole,
		listDepartments,
		listPermissionGroups,
		listRolePermissions,
		listRoles,
		updateDepartment,
		updateOrganizationProfile
	} from '$lib/api/settings';
	import { listEmployees, type EmployeeListItem } from '$lib/api/employees';

	let { data }: { data: SystemSettingsPageData } = $props();

	const initial = $derived(data.initial);
	const systemDataPromise = $derived(data.systemData);

	const breadcrumbs = getBreadcrumbsState();
	$effect(() => {
		breadcrumbs.items = [
			{ label: m.breadcrumb_home(), href: '/dashboard' },
			{ label: m.settings(), href: '/settings/system' },
			{ label: m.breadcrumb_system_settings() }
		];
		return () => {
			breadcrumbs.items = [];
		};
	});

	let systemState = $state<SystemSettingsLoadResult>(_createInitialSystemSettings());
	let systemPending = $state(true);
	let systemRequestToken = 0;

	$effect(() => {
		const nextInitial = initial;
		const promise = systemDataPromise;
		const requestToken = ++systemRequestToken;

		systemState = nextInitial;
		systemPending = true;

		void promise
			.then((result) => {
				if (requestToken !== systemRequestToken) return;
				systemState = result;
			})
			.catch((error) => {
				if (requestToken !== systemRequestToken) return;
				systemState = {
					...nextInitial,
					loadError: error instanceof Error ? error.message : 'Failed to load system settings.'
				};
			})
			.finally(() => {
				if (requestToken === systemRequestToken) {
					systemPending = false;
				}
			});
	});

	const systemSettings = $derived(systemState.systemSettings);
	const permissionGroups = $derived<PermissionGroup[]>(systemState.permissionGroups ?? []);
	const initialRolePermissionsByRoleId = $derived<Record<string, string[]>>(
		systemState.rolePermissionsByRoleId ?? {}
	);
	const employees = $derived<EmployeeOption[]>(systemState.employees ?? []);

	const tabs = [
		{ id: 'organization', label: 'Organization', icon: Building2 },
		{ id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
		{ id: 'departments', label: 'Departments', icon: Users },
		{ id: 'security', label: 'Security', icon: Lock },
		{ id: 'integrations', label: 'Integrations', icon: Share2 }
	] as const;

	type TabId = (typeof tabs)[number]['id'];
	type TabLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

	let activeTab = $state<TabId>('organization');
	let tabStatus = $state<Record<TabId, TabLoadStatus>>({
		organization: 'loaded',
		roles: 'idle',
		departments: 'idle',
		security: 'loaded',
		integrations: 'loaded'
	});
	let tabErrors = $state<Partial<Record<TabId, string>>>({});

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

	async function loadRolesTabData(force = false) {
		if (!force && tabStatus.roles !== 'idle') return;

		tabStatus = { ...tabStatus, roles: 'loading' };
		tabErrors = { ...tabErrors, roles: undefined };

		try {
			const [rolesResponse, permissionGroupsResponse] = await Promise.all([
				listRoles(),
				listPermissionGroups()
			]);

			const roles = rolesResponse.data.map((role) => _mapRole(role, []));
			const permissionGroups = _mapPermissionGroups(permissionGroupsResponse.data);

			systemState = {
				...systemState,
				systemSettings: {
					...systemState.systemSettings,
					roles
				},
				permissionGroups,
				rolePermissionsByRoleId: systemState.rolePermissionsByRoleId ?? {}
			};
			tabStatus = { ...tabStatus, roles: 'loaded' };
		} catch (error) {
			tabStatus = { ...tabStatus, roles: 'error' };
			tabErrors = {
				...tabErrors,
				roles: error instanceof Error ? error.message : 'Failed to load roles and permissions.'
			};
		}
	}

	async function loadDepartmentsTabData(force = false) {
		if (!force && tabStatus.departments !== 'idle') return;

		tabStatus = { ...tabStatus, departments: 'loading' };
		tabErrors = { ...tabErrors, departments: undefined };

		try {
			const [departmentsResponse, employeesResponse] = await Promise.all([
				listDepartments(),
				listEmployees({ page: 1, page_size: 100 })
			]);

			const departments = departmentsResponse.data.results.map(_mapDepartment);
			const employees = employeesResponse.data.results.map((employee: EmployeeListItem) => ({
				id: employee.id,
				name: `${employee.first_name} ${employee.last_name}`.trim()
			}));

			systemState = {
				...systemState,
				systemSettings: {
					...systemState.systemSettings,
					departments
				},
				employees
			};
			tabStatus = { ...tabStatus, departments: 'loaded' };
		} catch (error) {
			tabStatus = { ...tabStatus, departments: 'error' };
			tabErrors = {
				...tabErrors,
				departments: error instanceof Error ? error.message : 'Failed to load departments.'
			};
		}
	}

	$effect(() => {
		if (systemPending) return;
		if (activeTab === 'roles') {
			void loadRolesTabData();
		}
		if (activeTab === 'departments') {
			void loadDepartmentsTabData();
		}
	});

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
			<div class="hidden"></div>
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

	{#if systemState.loadError}
		<div
			class="rounded-2xl border border-amber-400/30 bg-amber-50/80 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
		>
			{systemState.loadError}
		</div>
	{/if}

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
		{#if systemPending}
			<div class="space-y-6" aria-busy="true">
				<div class="grid gap-4 md:grid-cols-3">
					{#each [1, 2, 3] as item (item)}
						<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
							<div class="h-3 w-24 animate-pulse rounded bg-border/70"></div>
							<div class="mt-4 h-8 w-full animate-pulse rounded bg-border/70"></div>
							<div class="mt-3 h-8 w-3/4 animate-pulse rounded bg-border/70"></div>
						</div>
					{/each}
				</div>
				<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
					<div class="h-4 w-40 animate-pulse rounded bg-border/70"></div>
					<div class="mt-6 space-y-3">
						{#each [1, 2, 3, 4] as row (row)}
							<div class="h-12 w-full animate-pulse rounded-2xl bg-border/70"></div>
						{/each}
					</div>
				</div>
			</div>
		{:else if activeTab === 'organization'}
			<div in:fade={{ duration: 300 }}>
				<OrganizationSection
					organization={systemSettings.organization}
					onSave={handleSaveOrganization}
				/>
			</div>
		{:else if activeTab === 'roles'}
			<div in:fade={{ duration: 300 }}>
				{#if tabStatus.roles === 'loading' || tabStatus.roles === 'idle'}
					<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
						<div class="h-5 w-40 animate-pulse rounded bg-border/70"></div>
						<div class="mt-6 grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
							<div class="space-y-3">
								{#each [1, 2, 3] as item (item)}
									<div class="h-24 animate-pulse rounded-2xl bg-border/60"></div>
								{/each}
							</div>
							<div class="space-y-3">
								{#each [1, 2, 3] as item (item)}
									<div class="h-28 animate-pulse rounded-2xl bg-border/60"></div>
								{/each}
							</div>
						</div>
					</div>
				{:else if tabStatus.roles === 'error'}
					<div
						class="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-rose-600"
					>
						<div>{tabErrors.roles ?? 'Failed to load roles and permissions.'}</div>
						<div class="mt-4">
							<Button onclick={() => void loadRolesTabData(true)} class="rounded-xl px-4 py-2">
								Retry
							</Button>
						</div>
					</div>
				{:else}
					<RolesSection
						roles={systemSettings.roles}
						{permissionGroups}
						initialRolePermissions={initialRolePermissionsByRoleId}
						onCreateRole={handleCreateRole}
						onFetchRolePermissions={handleFetchRolePermissions}
						onSaveRolePermissions={handleSaveRolePermissions}
					/>
				{/if}
			</div>
		{:else if activeTab === 'departments'}
			<div in:fade={{ duration: 300 }}>
				{#if tabStatus.departments === 'loading' || tabStatus.departments === 'idle'}
					<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
						<div class="h-5 w-36 animate-pulse rounded bg-border/70"></div>
						<div class="mt-6 space-y-3">
							{#each [1, 2, 3, 4] as item (item)}
								<div class="h-14 animate-pulse rounded-2xl bg-border/60"></div>
							{/each}
						</div>
					</div>
				{:else if tabStatus.departments === 'error'}
					<div
						class="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-rose-600"
					>
						<div>{tabErrors.departments ?? 'Failed to load departments.'}</div>
						<div class="mt-4">
							<Button
								onclick={() => void loadDepartmentsTabData(true)}
								class="rounded-xl px-4 py-2"
							>
								Retry
							</Button>
						</div>
					</div>
				{:else}
					<DepartmentsSection
						departments={systemSettings.departments}
						{employees}
						onCreateDepartment={handleCreateDepartment}
						onUpdateDepartment={handleUpdateDepartment}
					/>
				{/if}
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
