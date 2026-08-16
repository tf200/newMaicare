<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import * as v from 'valibot';
	import { CheckCircle2, Info, Plus, Save, Search, ShieldCheck, Users } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { m } from '$lib/paraglide/messages';
	import { getAuthState } from '$lib/state/auth.svelte';
	import type { PermissionGroup, PermissionItem, Role } from '../types';

	type MessageFunction = (inputs?: Record<string, string | number>) => string;
	type CreateRoleInput = { name: string; description: string };

	interface Props {
		roles: readonly Role[];
		permissionGroups?: readonly PermissionGroup[];
		initialRolePermissions?: Readonly<Record<string, readonly string[]>>;
		onCreateRole?: (payload: { name: string; description?: string }) => Promise<Role>;
		onFetchRolePermissions?: (roleId: string) => Promise<string[]>;
		onSaveRolePermissions?: (roleId: string, permissionIds: string[]) => Promise<void>;
		onRefresh?: () => void | Promise<void>;
	}

	let {
		roles,
		permissionGroups = [],
		initialRolePermissions = {},
		onCreateRole,
		onFetchRolePermissions,
		onSaveRolePermissions,
		onRefresh
	}: Props = $props();

	const messages = m as unknown as Record<string, MessageFunction | undefined>;
	const auth = getAuthState();
	const canGrantPermissions = $derived(auth.hasPermission(PERMISSIONS.PERMISSION.GRANT));
	const text = (key: string, fallback: string, inputs?: Record<string, string | number>) =>
		messages[key]?.(inputs) ?? fallback;
	const uid = $props.id();
	const createSchema = v.object({
		name: v.pipe(
			v.string(),
			v.trim(),
			v.minLength(1, text('system_settings_role_name_required', 'Role name is required.')),
			v.maxLength(100, text('system_settings_role_name_too_long', 'Role name is too long.'))
		),
		description: v.pipe(
			v.string(),
			v.trim(),
			v.maxLength(
				500,
				text('system_settings_role_description_too_long', 'Description is too long.')
			)
		)
	});

	let selectedRoleId = $state<string | undefined>();
	let permissionSearch = $state('');
	let persistedPermissions = $state.raw<Record<string, readonly string[]>>({});
	let draftPermissions = $state.raw<Record<string, readonly string[]>>({});
	let loadingRoleId = $state<string | null>(null);
	let permissionLoadError = $state('');
	let saveError = $state('');
	let isSaving = $state(false);
	let saveSuccess = $state(false);
	let requestToken = 0;
	let successTimer: ReturnType<typeof setTimeout> | undefined;

	let isCreateOpen = $state(false);
	let createError = $state('');
	let isCreating = $state(false);
	let createRequested = $state(false);

	const {
		form: createForm,
		errors: createErrors,
		enhance: enhanceCreate,
		reset: resetCreate
	} = superForm(
		defaults<CreateRoleInput>({ name: '', description: '' }, valibotClient(createSchema)),
		{
			validators: valibotClient(createSchema),
			SPA: true,
			dataType: 'json',
			onSubmit: ({ cancel }) => {
				if (createRequested || isCreating || !onCreateRole) cancel();
				else createRequested = true;
			},
			onUpdate: async ({ form: result }) => {
				if (!createRequested) return;
				if (!result.valid || !onCreateRole) {
					createRequested = false;
					return;
				}

				isCreating = true;
				createError = '';
				try {
					const created = await onCreateRole({
						name: result.data.name,
						description: result.data.description || undefined
					});
					selectedRoleId = created.id;
					isCreateOpen = false;
					resetCreate();
					await onRefresh?.();
				} catch (error) {
					createError =
						error instanceof Error
							? error.message
							: text('system_settings_role_create_error', 'Failed to create role.');
				} finally {
					isCreating = false;
					createRequested = false;
				}
			}
		}
	);

	const selectedRole = $derived(roles.find((role) => role.id === selectedRoleId));
	const selectedPermissions = $derived(
		selectedRoleId ? (draftPermissions[selectedRoleId] ?? []) : []
	);
	const isDirty = $derived.by(() => {
		if (!selectedRoleId) return false;
		const persisted = persistedPermissions[selectedRoleId] ?? [];
		return (
			persisted.length !== selectedPermissions.length ||
			persisted.some((permission) => !selectedPermissions.includes(permission))
		);
	});
	const filteredGroups = $derived.by(() => {
		const query = permissionSearch.trim().toLocaleLowerCase();
		if (!query) return permissionGroups;
		return permissionGroups
			.map((group) => ({
				...group,
				permissions: group.permissions.filter(
					(permission) =>
						permission.label.toLocaleLowerCase().includes(query) ||
						permission.description.toLocaleLowerCase().includes(query)
				)
			}))
			.filter((group) => group.permissions.length > 0);
	});

	$effect(() => {
		const availableIds = new Set(roles.map((role) => role.id));
		if (!selectedRoleId || !availableIds.has(selectedRoleId)) selectedRoleId = roles[0]?.id;
	});

	$effect(() => {
		const nextPersisted = { ...persistedPermissions };
		const nextDrafts = { ...draftPermissions };
		for (const [roleId, permissions] of Object.entries(initialRolePermissions)) {
			if (Object.hasOwn(nextPersisted, roleId)) continue;
			nextPersisted[roleId] = [...permissions];
			nextDrafts[roleId] = [...permissions];
		}
		persistedPermissions = nextPersisted;
		draftPermissions = nextDrafts;
	});

	$effect(() => {
		const roleId = selectedRoleId;
		if (!roleId || Object.hasOwn(persistedPermissions, roleId)) return;
		void loadRolePermissions(roleId);
	});

	async function loadRolePermissions(roleId: string) {
		const token = ++requestToken;
		permissionLoadError = '';
		loadingRoleId = roleId;
		try {
			const permissions = onFetchRolePermissions
				? await onFetchRolePermissions(roleId)
				: [...(roles.find((role) => role.id === roleId)?.permissions ?? [])];
			if (token !== requestToken) return;
			persistedPermissions = { ...persistedPermissions, [roleId]: [...permissions] };
			draftPermissions = { ...draftPermissions, [roleId]: [...permissions] };
		} catch (error) {
			if (token !== requestToken) return;
			permissionLoadError =
				error instanceof Error
					? error.message
					: text('system_settings_permissions_load_error', 'Failed to load role permissions.');
		} finally {
			if (token === requestToken) loadingRoleId = null;
		}
	}

	function selectRole(roleId: string) {
		requestToken += 1;
		selectedRoleId = roleId;
		permissionSearch = '';
		permissionLoadError = '';
		saveError = '';
		saveSuccess = false;
		if (!Object.hasOwn(persistedPermissions, roleId)) void loadRolePermissions(roleId);
	}

	function updateDraft(permissionIds: readonly string[]) {
		if (!selectedRoleId) return;
		draftPermissions = { ...draftPermissions, [selectedRoleId]: [...permissionIds] };
		saveSuccess = false;
		saveError = '';
	}

	function togglePermission(permissionId: string, checked: boolean) {
		updateDraft(
			checked
				? [...new Set([...selectedPermissions, permissionId])]
				: selectedPermissions.filter((id) => id !== permissionId)
		);
	}

	function toggleGroup(group: PermissionGroup, checked: boolean) {
		const ids = group.permissions.map((permission: PermissionItem) => permission.id);
		updateDraft(
			checked
				? [...new Set([...selectedPermissions, ...ids])]
				: selectedPermissions.filter((id) => !ids.includes(id))
		);
	}

	function getRolePermissionCount(role: Role) {
		return persistedPermissions[role.id]?.length ?? role.permissionCount ?? role.permissions.length;
	}

	async function savePermissions() {
		if (!selectedRoleId || !onSaveRolePermissions || isSaving) return;
		const roleId = selectedRoleId;
		const permissions = [...selectedPermissions];
		isSaving = true;
		saveError = '';
		try {
			await onSaveRolePermissions(roleId, permissions);
			persistedPermissions = { ...persistedPermissions, [roleId]: permissions };
			saveSuccess = true;
			clearTimeout(successTimer);
			successTimer = setTimeout(() => (saveSuccess = false), 3000);
			await onRefresh?.();
		} catch (error) {
			saveError =
				error instanceof Error
					? error.message
					: text('system_settings_permissions_save_error', 'Failed to save permissions.');
		} finally {
			isSaving = false;
		}
	}

	function openCreateRole() {
		resetCreate();
		createError = '';
		isCreateOpen = true;
	}
</script>

<div class="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
	<aside class="space-y-4" aria-label={text('system_settings_roles_title', 'Access roles')}>
		<div class="flex items-center justify-between gap-3">
			<h3 class="text-lg font-bold tracking-tight text-text">
				{text('system_settings_roles_title', 'Access roles')}
			</h3>
			<PermissionGuard permission={PERMISSIONS.ROLES.CREATE}>
				<Button variant="ghost" class="h-9 px-3 text-brand" onclick={openCreateRole}>
					<Plus class="h-4 w-4" aria-hidden="true" />
					{text('system_settings_new_role', 'New role')}
				</Button>
			</PermissionGuard>
		</div>

		<div
			class="space-y-2"
			role="listbox"
			aria-label={text('system_settings_roles_title', 'Access roles')}
		>
			{#each roles as role (role.id)}
				<button
					type="button"
					role="option"
					aria-selected={selectedRoleId === role.id}
					onclick={() => selectRole(role.id)}
					class="w-full rounded-2xl border p-4 text-left transition-colors {selectedRoleId ===
					role.id
						? 'border-brand bg-brand/10'
						: 'border-border bg-surface hover:border-brand/50'}"
				>
					<span class="block font-semibold text-text">{role.name}</span>
					{#if role.description}<span class="mt-1 line-clamp-2 text-xs text-text-muted"
							>{role.description}</span
						>{/if}
					<span class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
						<span class="inline-flex items-center gap-1"
							><Users class="h-3.5 w-3.5" aria-hidden="true" />
							{text('system_settings_user_count', `${role.userCount} users`, {
								count: role.userCount
							})}</span
						>
						<span class="inline-flex items-center gap-1"
							><ShieldCheck class="h-3.5 w-3.5" aria-hidden="true" />
							{text(
								'system_settings_permission_count',
								`${getRolePermissionCount(role)} permissions`,
								{ count: getRolePermissionCount(role) }
							)}</span
						>
					</span>
				</button>
			{/each}
		</div>

		<div class="flex gap-3 rounded-2xl border border-border bg-surface p-4">
			<Info class="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
			<div>
				<p class="text-sm font-semibold text-text">
					{text('system_settings_about_roles', 'About roles')}
				</p>
				<p class="mt-1 text-xs leading-5 text-text-muted">
					{text(
						'system_settings_about_roles_description',
						'Roles define which actions users can take. Saved changes apply to every user assigned to the role.'
					)}
				</p>
			</div>
		</div>
	</aside>

	<section class="min-w-0" aria-live="polite">
		{#if selectedRole}
			<div class="space-y-5">
				<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h3 class="text-xl font-bold tracking-tight text-text">
							{text(
								'system_settings_permissions_for_role',
								`Permissions for ${selectedRole.name}`,
								{ role: selectedRole.name }
							)}
						</h3>
						<p class="mt-1 text-sm text-text-muted">
							{text(
								'system_settings_permissions_description',
								'Configure access controls for this role.'
							)}
						</p>
					</div>
					<PermissionGuard permission={PERMISSIONS.PERMISSION.GRANT}>
						<div class="flex items-center gap-3">
							{#if saveSuccess}<span
									class="inline-flex items-center gap-1.5 text-sm font-medium text-success"
									><CheckCircle2 class="h-4 w-4" aria-hidden="true" />
									{text('system_settings_permissions_saved', 'Saved')}</span
								>{/if}
							<Button
								onclick={savePermissions}
								isLoading={isSaving}
								disabled={!isDirty || loadingRoleId === selectedRole.id}
							>
								<Save class="h-4 w-4" aria-hidden="true" />
								{text('system_settings_save_permissions', 'Save permissions')}
							</Button>
						</div>
					</PermissionGuard>
				</header>

				{#if saveError}<InlineErrorBanner
						title={text(
							'system_settings_permissions_save_error_title',
							'Could not save permissions'
						)}
						message={saveError}
					/>{/if}

				<div>
					<label for={`${uid}-permission-search`} class="mb-2 block text-sm font-medium text-text"
						>{text('system_settings_search_permissions_label', 'Search permissions')}</label
					>
					<div class="relative">
						<Search
							class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-text-muted"
							aria-hidden="true"
						/>
						<input
							id={`${uid}-permission-search`}
							type="search"
							bind:value={permissionSearch}
							placeholder={text(
								'system_settings_search_permissions_placeholder',
								'Search by name or description'
							)}
							class="w-full rounded-xl border border-border bg-surface py-3 pr-4 pl-10 text-sm text-text transition-colors outline-none placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20"
						/>
					</div>
				</div>

				{#if loadingRoleId === selectedRole.id}
					<p class="rounded-2xl border border-border bg-surface p-5 text-sm text-text-muted">
						{text(
							'system_settings_permissions_loading',
							`Loading permissions for ${selectedRole.name}...`,
							{ role: selectedRole.name }
						)}
					</p>
				{:else if permissionLoadError}
					<InlineErrorBanner
						title={text(
							'system_settings_permissions_load_error_title',
							'Could not load permissions'
						)}
						message={permissionLoadError}
						onRetry={() => void loadRolePermissions(selectedRole.id)}
					/>
				{:else}
					<div class="space-y-4">
						{#each filteredGroups as group (group.id)}
							{@const selectedCount = group.permissions.filter((permission) =>
								selectedPermissions.includes(permission.id)
							).length}
							<fieldset class="overflow-hidden rounded-2xl border border-border bg-surface">
								<div
									class="flex flex-col gap-3 border-b border-border bg-bg/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
								>
									<legend class="font-semibold text-text">{group.label}</legend>
									<div class="flex items-center gap-3 text-xs">
										<span class="text-text-muted"
											>{text(
												'system_settings_group_active_count',
												`${selectedCount} of ${group.permissions.length} active`,
												{ selected: selectedCount, total: group.permissions.length }
											)}</span
										>
										<button
											type="button"
											class="font-semibold text-brand hover:underline"
											onclick={() => toggleGroup(group, true)}
											disabled={!canGrantPermissions}
											>{text('system_settings_select_all', 'Select all')}</button
										>
										<button
											type="button"
											class="font-semibold text-text-muted hover:text-text"
											onclick={() => toggleGroup(group, false)}
											disabled={!canGrantPermissions}
											>{text('system_settings_clear', 'Clear')}</button
										>
									</div>
								</div>
								<div class="grid sm:grid-cols-2">
									{#each group.permissions as permission (permission.id)}
										<label
											class="flex cursor-pointer gap-3 border-b border-border p-4 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
										>
											<input
												type="checkbox"
												checked={selectedPermissions.includes(permission.id)}
												disabled={!canGrantPermissions}
												onchange={(event) =>
													togglePermission(permission.id, event.currentTarget.checked)}
												class="mt-0.5 h-5 w-5 shrink-0 rounded border-border text-brand focus:ring-brand/30"
											/>
											<span
												><span class="block text-sm font-semibold text-text"
													>{permission.label}</span
												><span class="mt-1 block text-xs leading-5 text-text-muted"
													>{permission.description}</span
												></span
											>
										</label>
									{/each}
								</div>
							</fieldset>
						{/each}
						{#if filteredGroups.length === 0}
							<div class="rounded-2xl border border-dashed border-border py-12 text-center">
								<p class="font-semibold text-text">
									{text('system_settings_no_permissions_found', 'No permissions found')}
								</p>
								<button
									type="button"
									class="mt-2 text-sm font-medium text-brand hover:underline"
									onclick={() => (permissionSearch = '')}
									>{text('system_settings_clear_search', 'Clear search')}</button
								>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<div
				class="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-6 text-center"
			>
				<p class="text-sm text-text-muted">
					{text('system_settings_select_role', 'Select a role to manage its permissions.')}
				</p>
			</div>
		{/if}
	</section>
</div>

<Modal
	bind:open={isCreateOpen}
	title={text('system_settings_create_role', 'Create role')}
	description={text('system_settings_create_role_description', 'Add a new access role')}
>
	<form id={`${uid}-create-role-form`} method="POST" use:enhanceCreate class="space-y-4">
		<div>
			<label for={`${uid}-role-name`} class="mb-1.5 block text-sm font-medium text-text"
				>{text('system_settings_role_name', 'Role name')}</label
			>
			<input
				id={`${uid}-role-name`}
				name="name"
				bind:value={$createForm.name}
				required
				maxlength="100"
				autocomplete="off"
				aria-invalid={$createErrors.name ? 'true' : undefined}
				aria-describedby={$createErrors.name ? `${uid}-role-name-error` : undefined}
				class="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
			/>
			{#if $createErrors.name}<p
					id={`${uid}-role-name-error`}
					class="mt-1.5 text-xs font-medium text-error"
				>
					{$createErrors.name[0]}
				</p>{/if}
		</div>
		<div>
			<label for={`${uid}-role-description`} class="mb-1.5 block text-sm font-medium text-text"
				>{text('system_settings_role_description', 'Description')}</label
			>
			<textarea
				id={`${uid}-role-description`}
				name="description"
				bind:value={$createForm.description}
				rows="3"
				maxlength="500"
				aria-invalid={$createErrors.description ? 'true' : undefined}
				aria-describedby={$createErrors.description ? `${uid}-role-description-error` : undefined}
				class="w-full resize-y rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
			></textarea>
			{#if $createErrors.description}<p
					id={`${uid}-role-description-error`}
					class="mt-1.5 text-xs font-medium text-error"
				>
					{$createErrors.description[0]}
				</p>{/if}
		</div>
		{#if createError}<InlineErrorBanner
				title={text('system_settings_role_create_error_title', 'Could not create role')}
				message={createError}
			/>{/if}
	</form>
	{#snippet footer()}
		<div class="flex justify-end gap-2">
			<Button variant="ghost" onclick={() => (isCreateOpen = false)}
				>{text('system_settings_cancel', 'Cancel')}</Button
			>
			<Button type="submit" form={`${uid}-create-role-form`} isLoading={isCreating}
				>{text('system_settings_create_role_action', 'Create role')}</Button
			>
		</div>
	{/snippet}
</Modal>
