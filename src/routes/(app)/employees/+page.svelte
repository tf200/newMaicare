<script lang="ts">
	import { Users, Sparkles, Filter, Download, Plus } from 'lucide-svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	type EmployeeStatus = 'Active' | 'On Leave' | 'Invited';

	interface EmployeeRow {
		id: string;
		name: string;
		email: string;
		role: string;
		team: string;
		status: EmployeeStatus;
		location: string;
		lastActive: string;
	}

	const columns: DataTableColumn[] = [
		{ key: 'name', label: 'Employee' },
		{ key: 'role', label: 'Role' },
		{ key: 'team', label: 'Team' },
		{ key: 'status', label: 'Status', align: 'center', width: '160px' },
		{ key: 'location', label: 'Location' },
		{ key: 'lastActive', label: 'Last active', align: 'right' },
		{ key: 'actions', label: '', align: 'right', width: '120px' }
	];

	const employees: EmployeeRow[] = [
		{
			id: 'MC-1024',
			name: 'Ava Reynolds',
			email: 'ava.reynolds@maicare.io',
			role: 'Senior Nurse',
			team: 'Care Ops',
			status: 'Active',
			location: 'Austin, TX',
			lastActive: '2 min ago'
		},
		{
			id: 'MC-1031',
			name: 'Noah Patel',
			email: 'noah.patel@maicare.io',
			role: 'Case Manager',
			team: 'Transitions',
			status: 'On Leave',
			location: 'San Jose, CA',
			lastActive: '3 days ago'
		},
		{
			id: 'MC-1044',
			name: 'Mia Clark',
			email: 'mia.clark@maicare.io',
			role: 'Care Coordinator',
			team: 'Remote Care',
			status: 'Active',
			location: 'Denver, CO',
			lastActive: '18 min ago'
		},
		{
			id: 'MC-1052',
			name: 'Ethan Brooks',
			email: 'ethan.brooks@maicare.io',
			role: 'Medical Assistant',
			team: 'Field',
			status: 'Invited',
			location: 'Tampa, FL',
			lastActive: 'Pending'
		},
		{
			id: 'MC-1061',
			name: 'Sofia Nguyen',
			email: 'sofia.nguyen@maicare.io',
			role: 'Operations Lead',
			team: 'Care Ops',
			status: 'Active',
			location: 'Seattle, WA',
			lastActive: 'Just now'
		}
	];

	const statusClasses: Record<EmployeeStatus, string> = {
		Active: 'bg-emerald-500/10 text-emerald-500 dark:bg-neutral-900',
		'On Leave': 'bg-amber-400/20 text-amber-400',
		Invited: 'bg-indigo-500/10 text-indigo-500'
	};

	let currentPage = 1;
	const pageSize = 10;

	const getInitials = (name: string) =>
		name
			.split(' ')
			.map((part) => part[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
</script>

<svelte:head>
	<title>Employees | MaiCare</title>
</svelte:head>

{#snippet tableActions()}
	<Button variant="ghost" class="gap-2">
		<Filter class="h-4 w-4" />
		Filters
	</Button>
	<Button variant="ghost" class="gap-2">
		<Download class="h-4 w-4" />
		Export
	</Button>
	<Button class="gap-2">
		<Plus class="h-4 w-4" />
		Add employee
	</Button>
{/snippet}

{#snippet tableFilters()}
	<button
		class="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800"
	>
		All
	</button>
	<button
		class="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 transition hover:text-zinc-900"
	>
		Active
	</button>
	<button
		class="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 transition hover:text-zinc-900"
	>
		On Leave
	</button>
	<button
		class="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 transition hover:text-zinc-900"
	>
		Invited
	</button>
{/snippet}

{#snippet nameCell(row: EmployeeRow)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-xs font-semibold text-zinc-900 shadow-sm"
		>
			{getInitials(row.name)}
		</div>
		<div>
			<p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</p>
			<p class="text-xs text-zinc-500 dark:text-zinc-400">{row.email}</p>
		</div>
	</div>
{/snippet}

{#snippet statusCell(row: EmployeeRow)}
	<span
		class="inline-flex items-center justify-center rounded-lg px-3 py-1 text-xs font-semibold {statusClasses[
			row.status
		]}"
	>
		{row.status}
	</span>
{/snippet}

{#snippet actionsCell(row: EmployeeRow)}
	<div class="flex items-center justify-end gap-2 text-xs font-semibold">
		<button
			class="text-zinc-500 transition hover:text-teal-600 dark:text-zinc-400 dark:hover:text-teal-300"
		>
			View
		</button>
		<span class="text-zinc-200 dark:text-zinc-700">|</span>
		<button
			class="text-zinc-500 transition hover:text-teal-600 dark:text-zinc-400 dark:hover:text-teal-300"
		>
			Message
		</button>
	</div>
{/snippet}

<section class="space-y-6">
	<header class="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-sm">
		<div class="flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-2">
				<div class="flex items-center gap-3 text-sm font-semibold text-teal-600">
					<span
						class="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-600"
					>
						<Users class="h-5 w-5" />
					</span>
					<span>Workforce</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-zinc-900">Employees</h1>
				<p class="max-w-2xl text-sm font-medium text-zinc-500 dark:text-zinc-400">
					Keep a live view of staffing coverage, permissions, and team availability across MaiCare.
				</p>
			</div>
			<div class="flex items-center gap-3">
				<Button variant="ghost" class="gap-2">
					<Sparkles class="h-4 w-4" />
					Smart sort
				</Button>
				<Button class="gap-2">
					<Plus class="h-4 w-4" />
					New hire
				</Button>
			</div>
		</div>
	</header>

	<DataTable
		{columns}
		rows={employees}
		{currentPage}
		{pageSize}
		rowKey="id"
		title="Employee roster"
		description="Track active coverage, leave status, and team ownership in real time."
		actions={tableActions}
		filters={tableFilters}
		cells={{ name: nameCell, status: statusCell, actions: actionsCell }}
	/>
</section>
