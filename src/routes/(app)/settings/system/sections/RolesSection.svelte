<script lang="ts">
	import type { Role } from '../types';
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
		ArrowRight
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { fade, slide } from 'svelte/transition';

	let { roles = $bindable() }: { roles: Role[] } = $props();

	let selectedRoleId = $state(roles[0]?.id);
	let searchQuery = $state('');
	let permissionSearch = $state('');

	const permissionGroups = [
		{
			id: 'client',
			label: 'Client Management',
			icon: Users,
			permissions: [
				{
					id: 'client.read',
					label: 'View Clients',
					description: 'Can view client profiles and lists'
				},
				{
					id: 'client.write',
					label: 'Manage Clients',
					description: 'Can create and edit client profiles'
				},
				{
					id: 'client.delete',
					label: 'Delete Clients',
					description: 'Can remove client records'
				},
				{
					id: 'client.export',
					label: 'Export Data',
					description: 'Can export client lists to CSV/Excel'
				}
			]
		},
		{
			id: 'employee',
			label: 'Employee Management',
			icon: ShieldCheck,
			permissions: [
				{
					id: 'employee.read',
					label: 'View Employees',
					description: 'Can view employee directory'
				},
				{
					id: 'employee.write',
					label: 'Manage Employees',
					description: 'Can hire and edit employee data'
				},
				{
					id: 'employee.schedule',
					label: 'Manage Schedules',
					description: 'Can assign shifts to employees'
				},
				{
					id: 'employee.delete',
					label: 'Terminate Employees',
					description: 'Can remove employee records'
				}
			]
		},
		{
			id: 'finance',
			label: 'Finance & Billing',
			icon: LayoutGrid,
			permissions: [
				{
					id: 'finance.read',
					label: 'View Billing',
					description: 'Can view invoices and payments'
				},
				{
					id: 'finance.write',
					label: 'Manage Invoices',
					description: 'Can create and edit invoices'
				},
				{
					id: 'finance.approve',
					label: 'Approve Expenses',
					description: 'Can approve employee expense claims'
				},
				{
					id: 'finance.reports',
					label: 'Financial Reports',
					description: 'Can access financial dashboards'
				}
			]
		},
		{
			id: 'schedule',
			label: 'Scheduling & Rota',
			icon: List,
			permissions: [
				{ id: 'schedule.read', label: 'View Rota', description: 'Can view the shared schedule' },
				{
					id: 'schedule.write',
					label: 'Edit Rota',
					description: 'Can modify shifts and assignments'
				},
				{
					id: 'schedule.publish',
					label: 'Publish Rota',
					description: 'Can finalize and send out schedules'
				}
			]
		},
		{
			id: 'settings',
			label: 'System Administration',
			icon: ShieldCheck,
			permissions: [
				{
					id: 'settings.read',
					label: 'View Settings',
					description: 'Can view system configuration'
				},
				{
					id: 'settings.write',
					label: 'Edit Settings',
					description: 'Can modify system-wide options'
				},
				{ id: 'settings.audit', label: 'Audit Logs', description: 'Can view system activity logs' }
			]
		}
	];

	const selectedRole = $derived(roles.find((r) => r.id === selectedRoleId));

	const filteredGroups = $derived.by(() => {
		if (!permissionSearch) return permissionGroups;
		return permissionGroups
			.map((group) => ({
				...group,
				permissions: group.permissions.filter(
					(p) =>
						p.label.toLowerCase().includes(permissionSearch.toLowerCase()) ||
						p.description.toLowerCase().includes(permissionSearch.toLowerCase())
				)
			}))
			.filter((group) => group.permissions.length > 0);
	});

	function togglePermission(permissionId: string) {
		if (!selectedRole) return;

		const index = selectedRole.permissions.indexOf(permissionId);
		if (index === -1) {
			selectedRole.permissions = [...selectedRole.permissions, permissionId];
		} else {
			selectedRole.permissions = selectedRole.permissions.filter((id) => id !== permissionId);
		}
	}

	function toggleGroup(groupId: string, select: boolean) {
		if (!selectedRole) return;

		const group = permissionGroups.find((g) => g.id === groupId);
		if (!group) return;

		const groupPermissionIds = group.permissions.map((p) => p.id);

		if (select) {
			// Add all missing permissions
			const newPermissions = [...new Set([...selectedRole.permissions, ...groupPermissionIds])];
			selectedRole.permissions = newPermissions;
		} else {
			// Remove all group permissions
			selectedRole.permissions = selectedRole.permissions.filter(
				(id) => !groupPermissionIds.includes(id)
			);
		}
	}

	function getGroupSelectedCount(groupId: string) {
		if (!selectedRole) return 0;
		const group = permissionGroups.find((g) => g.id === groupId);
		if (!group) return 0;
		return group.permissions.filter((p) => selectedRole.permissions.includes(p.id)).length;
	}

	const totalSelectedCount = $derived(selectedRole?.permissions.length ?? 0);
</script>

<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
	<!-- Roles List Sidebar -->
	<aside class="space-y-6 lg:col-span-4">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-bold text-text">Access Roles</h3>
			<Button variant="ghost" class="h-8 px-2 text-brand">
				<Plus class="mr-1 h-3.5 w-3.5" />
				New Role
			</Button>
		</div>

		<div class="space-y-2">
			{#each roles as role (role.id)}
				<button
					onclick={() => (selectedRoleId = role.id)}
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
							{role.permissions.length} permissions
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
					<div class="flex items-center gap-2">
						<div
							class="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand ring-1 ring-brand/20"
						>
							{totalSelectedCount} Selected
						</div>
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

				<div class="space-y-4">
					{#each filteredGroups as group (group.id)}
						<div class="overflow-hidden rounded-2xl border border-border/50 bg-surface/30">
							<div
								class="flex items-center justify-between border-b border-border/50 bg-surface/50 px-5 py-4"
							>
								<div class="flex items-center gap-3">
									<div class="rounded-lg bg-text/5 p-2 text-text">
										<group.icon class="h-4 w-4" />
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
									{@const isSelected = selectedRole.permissions.includes(perm.id)}
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
