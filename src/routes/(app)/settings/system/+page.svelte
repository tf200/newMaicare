<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Building2, ShieldCheck, Users } from 'lucide-svelte';
	import { getBreadcrumbsState } from '$lib/state/breadcrumbs.svelte';
	import { getToastState } from '$lib/state/toast.svelte';
	import { getAuthState } from '$lib/state/auth.svelte';
	import { m } from '$lib/paraglide/messages';
	import { PERMISSIONS } from '$lib/config/permissions';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import OrganizationSection from './sections/OrganizationSection.svelte';
	import RolesSection from './sections/RolesSection.svelte';
	import DepartmentsSection from './sections/DepartmentsSection.svelte';
	import type { OrganizationProfile, Role, SystemSettingsTab } from './types';
	import type { SystemSettingsPageData } from './+page';
	import {
		addPermissionsToRole,
		createDepartment,
		createRole,
		listRolePermissions,
		updateDepartment,
		updateOrganizationProfile
	} from '$lib/api/settings';

	let { data }: { data: SystemSettingsPageData } = $props();
	const auth = getAuthState();
	const toast = getToastState();
	const breadcrumbs = getBreadcrumbsState();

	type MessageFunction = (inputs?: Record<string, string | number>) => string;
	const catalog = m as unknown as Record<string, MessageFunction | undefined>;
	const text = (key: string, fallback: string) => catalog[key]?.() ?? fallback;

	const tabs = $derived(
		[
			{
				id: 'organization' as const,
				label: text('system_settings_tab_organization', 'Organization'),
				icon: Building2,
				allowed: auth.hasPermission(PERMISSIONS.SETTINGS.ORGANIZATION_PROFILE.VIEW)
			},
			{
				id: 'roles' as const,
				label: text('system_settings_tab_roles', 'Roles & permissions'),
				icon: ShieldCheck,
				allowed:
					auth.hasPermission(PERMISSIONS.ROLES.VIEW) &&
					auth.hasPermission(PERMISSIONS.PERMISSION.VIEW)
			},
			{
				id: 'departments' as const,
				label: text('system_settings_tab_departments', 'Departments'),
				icon: Users,
				allowed: auth.hasPermission(PERMISSIONS.SETTINGS.DEPARTMENT.VIEW)
			}
		].filter((tab) => tab.allowed)
	);
	const requestedTab = $derived(
		(page.url.searchParams.get('tab') ?? data.initial.tab) as SystemSettingsTab
	);
	const activeTab = $derived(
		tabs.some((tab) => tab.id === requestedTab) ? requestedTab : (tabs[0]?.id ?? 'organization')
	);

	$effect(() => {
		breadcrumbs.items = [
			{ label: m.breadcrumb_home(), href: '/dashboard' },
			{ label: m.settings(), href: '/settings' },
			{ label: m.breadcrumb_system_settings() }
		];
		return () => {
			breadcrumbs.items = [];
		};
	});

	function selectTab(tab: SystemSettingsTab) {
		const url = new URL(page.url);
		url.searchParams.set('tab', tab);
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(`${resolve('/(app)/settings/system')}${url.search}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function handleTabKeydown(event: KeyboardEvent, index: number) {
		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
		event.preventDefault();
		const nextIndex =
			event.key === 'Home'
				? 0
				: event.key === 'End'
					? tabs.length - 1
					: (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
		selectTab(tabs[nextIndex].id);
		requestAnimationFrame(() =>
			document.getElementById(`system-settings-tab-${tabs[nextIndex].id}`)?.focus()
		);
	}

	async function saveOrganization(profile: OrganizationProfile): Promise<void> {
		await updateOrganizationProfile({
			default_timezone: profile.timezone,
			name: profile.name,
			email: profile.contact.email,
			phone_number: profile.contact.phone,
			website: profile.contact.website,
			hq_street: profile.address.street,
			hq_house_number: profile.address.houseNumber,
			hq_house_number_addition: profile.address.houseNumberAddition,
			hq_postal_code: profile.address.postalCode,
			hq_city: profile.address.city
		});
		await invalidate('app:settings-system:organization');
		toast.success(m.organization_updated_success());
	}

	async function createNewRole(payload: { name: string; description?: string }): Promise<Role> {
		const response = await createRole(payload);
		toast.success(m.role_created_success());
		return {
			id: response.data.role_id,
			name: response.data.name,
			description: response.data.description ?? '',
			permissions: [],
			userCount: 0,
			permissionCount: 0
		};
	}

	async function fetchRolePermissions(roleId: string): Promise<string[]> {
		const response = await listRolePermissions(roleId);
		return response.data.map((permission) => permission.permission_id);
	}

	async function saveRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
		await addPermissionsToRole(roleId, { permission_ids: permissionIds });
	}

	async function createNewDepartment(payload: {
		name: string;
		description?: string;
		departmentHeadId?: string | null;
	}): Promise<void> {
		await createDepartment({
			name: payload.name,
			description: payload.description,
			department_head_employee_id: payload.departmentHeadId
		});
		toast.success(m.department_created_success());
	}

	async function updateExistingDepartment(
		id: string,
		payload: { name: string; description?: string; departmentHeadId?: string | null }
	): Promise<void> {
		await updateDepartment(id, {
			name: payload.name,
			description: payload.description,
			department_head_employee_id: payload.departmentHeadId
		});
		toast.success(m.department_updated_success());
	}
</script>

<svelte:head>
	<title>{text('system_settings_page_title', 'System settings')}</title>
</svelte:head>

<div class="mx-auto max-w-6xl space-y-8 pb-20">
	<header>
		<h1 class="text-2xl font-bold tracking-tight text-text">
			{text('system_settings_page_title', 'System settings')}
		</h1>
		<p class="mt-2 text-sm text-text-muted">
			{text(
				'system_settings_page_description',
				'Manage organization details, access roles, and departments.'
			)}
		</p>
	</header>

	{#if tabs.length > 0}
		<nav
			class="no-scrollbar overflow-x-auto border-b border-border"
			aria-label={text('system_settings_page_title', 'System settings')}
		>
			<div class="flex min-w-max gap-1" role="tablist">
				{#each tabs as tab, index (tab.id)}
					<button
						id={`system-settings-tab-${tab.id}`}
						type="button"
						role="tab"
						aria-selected={activeTab === tab.id}
						aria-controls={`system-settings-panel-${tab.id}`}
						tabindex={activeTab === tab.id ? 0 : -1}
						onclick={() => selectTab(tab.id)}
						onkeydown={(event) => handleTabKeydown(event, index)}
						class="relative flex items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-6 {activeTab ===
						tab.id
							? 'text-brand'
							: 'text-text-muted hover:bg-surface hover:text-text'}"
					>
						<tab.icon class="h-4 w-4" aria-hidden="true" />
						{tab.label}
						{#if activeTab === tab.id}
							<span class="absolute inset-x-0 bottom-0 h-0.5 bg-brand" aria-hidden="true"></span>
						{/if}
					</button>
				{/each}
			</div>
		</nav>

		<div
			id={`system-settings-panel-${activeTab}`}
			role="tabpanel"
			aria-labelledby={`system-settings-tab-${activeTab}`}
			class="min-h-96"
		>
			{#if activeTab === 'organization' && data.organizationData}
				{#await data.organizationData}
					<div
						class="h-80 animate-pulse rounded-3xl border border-border bg-surface"
						aria-label={m.loading()}
					></div>
				{:then result}
					{#if result.loadError}
						<InlineErrorBanner
							message={result.loadError}
							onRetry={() => void invalidate('app:settings-system:organization')}
						/>
					{:else if result.organization}
						<OrganizationSection organization={result.organization} onSave={saveOrganization} />
					{/if}
				{/await}
			{:else if activeTab === 'roles' && data.rolesData && data.permissionGroupsData}
				{#await Promise.all([data.rolesData, data.permissionGroupsData])}
					<div
						class="h-96 animate-pulse rounded-3xl border border-border bg-surface"
						aria-label={m.loading()}
					></div>
				{:then [rolesResult, permissionsResult]}
					{#if rolesResult.loadError || permissionsResult.loadError}
						<InlineErrorBanner
							message={rolesResult.loadError ?? permissionsResult.loadError ?? ''}
							onRetry={() => {
								void invalidate('app:settings-system:roles');
								void invalidate('app:settings-system:permissions');
							}}
						/>
					{:else}
						<RolesSection
							roles={rolesResult.roles}
							permissionGroups={permissionsResult.permissionGroups}
							onCreateRole={createNewRole}
							onFetchRolePermissions={fetchRolePermissions}
							onSaveRolePermissions={saveRolePermissions}
							onRefresh={() => invalidate('app:settings-system:roles')}
						/>
					{/if}
				{/await}
			{:else if activeTab === 'departments' && data.departmentsData}
				{#await data.departmentsData}
					<div
						class="h-96 animate-pulse rounded-3xl border border-border bg-surface"
						aria-label={m.loading()}
					></div>
				{:then departmentsResult}
					{#if departmentsResult.loadError}
						<InlineErrorBanner
							message={departmentsResult.loadError}
							onRetry={() => void invalidate('app:settings-system:departments')}
						/>
					{:else if data.employeesData}
						{#await data.employeesData then employeesResult}
							<DepartmentsSection
								departments={departmentsResult.departments}
								employees={employeesResult.employees}
								onCreateDepartment={createNewDepartment}
								onUpdateDepartment={updateExistingDepartment}
							/>
						{/await}
					{:else}
						<DepartmentsSection
							departments={departmentsResult.departments}
							onCreateDepartment={createNewDepartment}
							onUpdateDepartment={updateExistingDepartment}
						/>
					{/if}
				{/await}
			{/if}
		</div>
	{/if}
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		scrollbar-width: none;
	}
</style>
