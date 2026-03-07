<script lang="ts">
	import type { PermissionGroup, PermissionItem, Role } from '../types';
	import {
		ShieldCheck,
		Plus,
		Pencil,
		Trash2,
		Users,
		Search,
		Check,
		X,
		ChevronRight,
		Info,
		CheckCircle2,
		Circle,
		Filter,
		LayoutGrid,
		List,
		ArrowRight,
		Save
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { fade, slide } from 'svelte/transition';
	import { onMount } from 'svelte';

	let {
		roles = $bindable(),
		permissionGroups = [],
		initialRolePermissions = {},
		onCreateRole,
		onFetchRolePermissions,
		onSaveRolePermissions
	}: {
		roles: Role[];
		permissionGroups?: PermissionGroup[];
		initialRolePermissions?: Record<string, string[]>;
		onCreateRole?: (payload: { name: string; description?: string }) => Promise<Role>;
		onFetchRolePermissions?: (roleId: string) => Promise<string[]>;
		onSaveRolePermissions?: (roleId: string, permissionIds: string[]) => Promise<void>;
	} = $props();

	let selectedRoleId = $state(roles[0]?.id);
	let searchQuery = $state('');
	let permissionSearch = $state('');

	let permissionsByRoleId = $state<Record<string, string[]>>({});
	let isLoadingPermissions = $state(false);
	let permissionLoadError = $state('');

	const groupIcons: Record<string, typeof Users> = {
		client: Users,
		employee: ShieldCheck,
		finance: LayoutGrid,
		schedule: List,
		settings: ShieldCheck
	};

	const selectedRole = $derived(roles.find((r) => r.id === selectedRoleId));
	const selectedRolePermissions: string[] = $derived(
		selectedRoleId
			? permissionsByRoleId[selectedRoleId] ?? selectedRole?.permissions ?? []
			: selectedRole?.permissions ?? []
	);

	async function loadRolePermissions(roleId: string) {
		if (!onFetchRolePermissions) return;
		isLoadingPermissions = true;
		permissionLoadError = '';
		try {
			const permissions = await onFetchRolePermissions(roleId);
			permissionsByRoleId = {
				...permissionsByRoleId,
				[roleId]: permissions
			};
		} catch (error) {
			permissionLoadError =
				error instanceof Error ? error.message : 'Failed to load role permissions';
		} finally {
			isLoadingPermissions = false;
		}
	}

	function selectRole(roleId: string) {
		selectedRoleId = roleId;
		if (!permissionsByRoleId[roleId] && onFetchRolePermissions) {
			void loadRolePermissions(roleId);
		}
	}

	onMount(() => {
		permissionsByRoleId = { ...initialRolePermissions };
		if (roles[0]?.id) {
			selectRole(roles[0].id);
		}
	});

	const filteredGroups = $derived.by((): PermissionGroup[] => {
		if (!permissionSearch) return permissionGroups;
		return permissionGroups
			.map((group) => ({
				...group,
				permissions: group.permissions.filter(
					(p: PermissionItem) =>
						p.label.toLowerCase().includes(permissionSearch.toLowerCase()) ||
						p.description.toLowerCase().includes(permissionSearch.toLowerCase())
				)
			}))
			.filter((group) => group.permissions.length > 0);
	});

	function setRolePermissions(roleId: string, permissions: string[]) {
		permissionsByRoleId = { ...permissionsByRoleId, [roleId]: permissions };
		roles = roles.map((role) =>
			role.id === roleId
				? {
						...role,
						permissions,
						permissionCount: permissions.length
					}
				: role
		);
	}

	function togglePermission(permissionId: string) {
		if (!selectedRoleId) return;
		const current = permissionsByRoleId[selectedRoleId] ?? selectedRolePermissions;
		const index = current.indexOf(permissionId);
		if (index === -1) {
			setRolePermissions(selectedRoleId, [...current, permissionId]);
		} else {
			setRolePermissions(
				selectedRoleId,
				current.filter((id) => id !== permissionId)
			);
		}
	}

	function toggleGroup(groupId: string, select: boolean) {
		if (!selectedRoleId) return;

		const group = permissionGroups.find((g) => g.id === groupId);
		if (!group) return;

		const groupPermissionIds = group.permissions.map((p: PermissionItem) => p.id);
		const current = permissionsByRoleId[selectedRoleId] ?? selectedRolePermissions;

		if (select) {
			const newPermissions = [...new Set([...current, ...groupPermissionIds])];
			setRolePermissions(selectedRoleId, newPermissions);
		} else {
			setRolePermissions(
				selectedRoleId,
				current.filter((id) => !groupPermissionIds.includes(id))
			);
		}
	}

	function getGroupSelectedCount(groupId: string) {
		const group = permissionGroups.find((g) => g.id === groupId);
		if (!group) return 0;
		return group.permissions.filter((p: PermissionItem) => selectedRolePermissions.includes(p.id)).length;
	}

	const totalSelectedCount = $derived(selectedRolePermissions.length ?? 0);

	function getRolePermissionCount(role: Role) {
		return permissionsByRoleId[role.id]?.length ?? role.permissionCount ?? role.permissions.length;
	}

	let isSaving = $state(false);
	let saveSuccess = $state(false);

	async function handleSave() {
		if (!selectedRoleId) return;
		isSaving = true;
		try {
			if (onSaveRolePermissions) {
				await onSaveRolePermissions(selectedRoleId, selectedRolePermissions);
			}
			saveSuccess = true;
			setTimeout(() => (saveSuccess = false), 3000);
		} finally {
			isSaving = false;
		}
	}

	let isCreateOpen = $state(false);
	let createName = $state('');
	let createDescription = $state('');
	let isCreating = $state(false);
	let createError = $state('');

	function openCreateRole() {
		createName = '';
		createDescription = '';
		createError = '';
		isCreateOpen = true;
	}

	async function handleCreateRole() {
		if (!onCreateRole) return;
		if (!createName.trim()) {
			createError = 'Role name is required.';
			return;
		}
		isCreating = true;
		createError = '';
		try {
			const created = await onCreateRole({
				name: createName.trim(),
				description: createDescription.trim() || undefined
			});
			roles = [...roles, created];
			permissionsByRoleId = { ...permissionsByRoleId, [created.id]: [] };
			selectRole(created.id);
			isCreateOpen = false;
		} catch (error) {
			createError = error instanceof Error ? error.message : 'Failed to create role.';
		} finally {
			isCreating = false;
		}
	}
</script>

<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
	<!-- Roles List Sidebar -->
	<aside class="space-y-6 lg:col-span-4">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-bold text-text">Access Roles</h3>
			<Button variant="ghost" class="h-8 rounded-xl px-2 text-brand" onclick={openCreateRole}>
				<Plus class="mr-1 h-3.5 w-3.5" />
				New Role
			</Button>
		</div>

		<div class="space-y-2">
			{#each roles as role (role.id)}
				<button
					onclick={() => selectRole(role.id)}
					class="group relative flex w-full flex-col gap-1 rounded-2xl border p-4 text-left transition-all duration-200
					{selectedRoleId === role.id
						? 'border-brand bg-brand/5 ring-1 ring-brand/20'
						: 'border-border/50 bg-surface/50 hover:border-brand/50 hover:bg-surface'}"
				>
					<div class="flex items-center justify-between">
						<span
							class="font-bold transition-colors {selectedRoleId === role.id
								? 'text-brand'
								: 'text-text'}"
						>
							{role.name}
						</span>
						{#if selectedRoleId === role.id}
							<ArrowRight class="h-4 w-4 text-brand" />
						{/if}
					</div>
					<p class="line-clamp-1 text-xs text-text-muted">{role.description}</p>
					<div class="mt-2 flex items-center gap-3">
						<div
							class="flex items-center gap-1 text-[10px] font-bold tracking-wider text-text-subtle uppercase"
						>
							<Users class="h-3 w-3" />
							{role.userCount} users
						</div>
						<div
							class="flex items-center gap-1 text-[10px] font-bold tracking-wider text-text-subtle uppercase"
						>
							<ShieldCheck class="h-3 w-3" />
							{getRolePermissionCount(role)} permissions
						</div>
					</div>
				</button>
			{/each}
		</div>

		<div class="rounded-2xl border border-dashed border-border p-4">
			<div class="flex items-start gap-3">
				<div class="rounded-lg bg-brand/10 p-2 text-brand">
					<Info class="h-4 w-4" />
				</div>
				<div class="space-y-1">
					<p class="text-xs font-bold text-text">About Roles</p>
					<p class="text-[11px] leading-relaxed text-text-muted">
						Roles define what actions users can take within the system. Changes to permissions are
						applied immediately to all users with the assigned role.
					</p>
				</div>
			</div>
		</div>
	</aside>

	<!-- Permission Editor -->
	<div class="lg:col-span-8">
		{#if selectedRole}
			<div class="space-y-6" in:fade={{ duration: 200 }}>
				<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h3 class="text-xl font-bold text-text">
							Permissions for <span class="text-brand">{selectedRole.name}</span>
						</h3>
						<p class="text-sm text-text-muted">Configure granular access controls for this role.</p>
					</div>
					<div class="flex items-center gap-3">
						{#if saveSuccess}
							<div
								in:fade
								out:fade
								class="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600"
							>
								<CheckCircle2 class="h-3.5 w-3.5" />
								Saved
							</div>
						{/if}
						<Button onclick={handleSave} isLoading={isSaving} class="gap-2 rounded-xl px-4 py-2">
							<Save class="h-4 w-4" />
							Save Permissions
						</Button>
					</div>
				</header>

				<div class="relative">
					<Search class="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-text-subtle" />
					<input
						type="text"
						bind:value={permissionSearch}
						placeholder="Search permissions..."
						class="w-full rounded-2xl border border-border bg-surface py-3.5 pr-4 pl-11 text-sm text-text outline-hidden transition-all focus:border-brand/50 focus:ring-4 focus:ring-brand/5"
					/>
				</div>

				{#if isLoadingPermissions}
					<div class="rounded-2xl border border-border/50 bg-surface/40 p-6 text-sm text-text-muted">
						Loading permissions for {selectedRole.name}...
					</div>
				{:else if permissionLoadError}
					<div class="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-rose-600">
						{permissionLoadError}
					</div>
				{:else}
					<div class="space-y-4">
						{#each filteredGroups as group (group.id)}
							{@const GroupIcon = groupIcons[group.id] ?? ShieldCheck}
							<div class="overflow-hidden rounded-2xl border border-border/50 bg-surface/30">
								<div
									class="flex items-center justify-between border-b border-border/50 bg-surface/50 px-5 py-4"
								>
									<div class="flex items-center gap-3">
										<div class="rounded-lg bg-text/5 p-2 text-text">
											<GroupIcon class="h-4 w-4" />
										</div>
									<div>
										<h4 class="text-sm font-bold text-text">{group.label}</h4>
										<p class="text-[10px] font-medium text-text-muted">
											{getGroupSelectedCount(group.id)} of {group.permissions.length} active
										</p>
									</div>
								</div>
								<div class="flex gap-2">
									<button
										onclick={() => toggleGroup(group.id, true)}
										class="text-[10px] font-bold tracking-wider text-brand uppercase hover:underline"
									>
										Select All
									</button>
									<span class="text-border">|</span>
									<button
										onclick={() => toggleGroup(group.id, false)}
										class="text-[10px] font-bold tracking-wider text-text-subtle uppercase hover:text-rose-500"
									>
										Clear
									</button>
								</div>
							</div>

								<div class="grid grid-cols-1 gap-px bg-border/50 sm:grid-cols-2">
									{#each group.permissions as perm (perm.id)}
										{@const isSelected = selectedRolePermissions.includes(perm.id)}
									<button
										onclick={() => togglePermission(perm.id)}
										class="group relative flex items-start gap-4 bg-surface p-5 text-left transition-colors hover:bg-brand/[0.02]"
									>
										<div class="mt-0.5">
											{#if isSelected}
												<div
													class="flex h-5 w-5 items-center justify-center rounded-md bg-brand text-white shadow-sm shadow-brand/20"
												>
													<Check class="h-3.5 w-3.5" strokeWidth={3} />
												</div>
											{:else}
												<div
													class="h-5 w-5 rounded-md border-2 border-border transition-colors group-hover:border-brand/50"
												></div>
											{/if}
										</div>
										<div class="space-y-1">
											<p
												class="text-sm font-bold transition-colors {isSelected
													? 'text-brand'
													: 'text-text'}"
											>
												{perm.label}
											</p>
											<p class="text-xs leading-relaxed text-text-muted">
												{perm.description}
											</p>
										</div>
									</button>
								{/each}
							</div>
						</div>
						{/each}

						{#if filteredGroups.length === 0}
							<div
								class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-20 text-center"
							>
								<div class="mb-4 rounded-full bg-surface p-4 shadow-sm">
									<Search class="h-8 w-8 text-text-subtle" />
								</div>
								<p class="text-lg font-bold text-text">No permissions found</p>
								<p class="text-sm text-text-muted">
									Try adjusting your search query to find what you're looking for.
								</p>
								<Button
									variant="ghost"
									class="mt-4 text-brand"
									onclick={() => (permissionSearch = '')}
								>
									Clear Search
								</Button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<div
				class="flex h-full min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-border bg-surface/30"
			>
				<div class="text-center">
					<ShieldCheck class="mx-auto h-12 w-12 text-text-subtle opacity-20" />
					<p class="mt-4 font-medium text-text-muted">Select a role to manage its permissions</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<Modal bind:open={isCreateOpen} title="Create Role" description="Add a new access role">
	<div class="space-y-4">
		<Input label="Role name" bind:value={createName} placeholder="e.g. Care Coordinator" />
		<Input label="Description" bind:value={createDescription} placeholder="What can this role do?" />
		{#if createError}
			<p class="text-xs font-medium text-rose-600">{createError}</p>
		{/if}
	</div>
	{#snippet footer()}
		<div class="flex items-center justify-end gap-2">
			<Button variant="ghost" onclick={() => (isCreateOpen = false)}>
				Cancel
			</Button>
			<Button onclick={handleCreateRole} isLoading={isCreating} class="px-4">
				Create Role
			</Button>
		</div>
	{/snippet}
</Modal>
