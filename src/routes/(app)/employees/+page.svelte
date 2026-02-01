<script lang="ts">
	import { Users, Sparkles, Filter, Download, Plus } from 'lucide-svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface EmployeeRow {
		id: string;
		name: string;
		bsn: string;
		department: string;
		location: string;
		contractType: 'Freelancer' | 'Full-time';
		contractEndDate: string;
	}

	const columns: DataTableColumn[] = [
		{ key: 'name', label: 'Employee' },
		{ key: 'department', label: 'Department' },
		{ key: 'location', label: 'Location' },
		{ key: 'contractType', label: 'Contract type', align: 'center', width: '160px' },
		{ key: 'contractEndDate', label: 'Contract end date', align: 'right' },
		{ key: 'actions', label: '', align: 'right', width: '120px' }
	];

	const employees: EmployeeRow[] = [
		{
			id: 'MC-1024',
			name: 'Ava Reynolds',
			bsn: '1285.44.210',
			department: 'Care Ops',
			location: 'Austin, TX',
			contractType: 'Full-time',
			contractEndDate: 'Dec 31, 2026'
		},
		{
			id: 'MC-1031',
			name: 'Noah Patel',
			bsn: '2147.09.662',
			department: 'Transitions',
			location: 'San Jose, CA',
			contractType: 'Freelancer',
			contractEndDate: 'Jun 30, 2025'
		},
		{
			id: 'MC-1044',
			name: 'Mia Clark',
			bsn: '0983.17.504',
			department: 'Remote Care',
			location: 'Denver, CO',
			contractType: 'Full-time',
			contractEndDate: 'Mar 01, 2027'
		},
		{
			id: 'MC-1052',
			name: 'Ethan Brooks',
			bsn: '3321.55.190',
			department: 'Field',
			location: 'Tampa, FL',
			contractType: 'Freelancer',
			contractEndDate: 'Oct 15, 2025'
		},
		{
			id: 'MC-1061',
			name: 'Sofia Nguyen',
			bsn: '4720.63.889',
			department: 'Care Ops',
			location: 'Seattle, WA',
			contractType: 'Full-time',
			contractEndDate: 'Sep 30, 2026'
		}
	];

	let currentPage = 1;
	const pageSize = 10;

	const getInitials = (name: string) =>
		name
			.split(' ')
			.map((part) => part[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();

	const contractTypeClasses: Record<EmployeeRow['contractType'], string> = {
		'Full-time': 'bg-success/10 text-success',
		Freelancer: 'bg-warning/10 text-warning'
	};
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
		class="rounded-full bg-btn-primary-bg px-4 py-2 text-xs font-semibold text-btn-primary-text shadow-sm transition hover:opacity-90"
	>
		All
	</button>
	<button
		class="rounded-full border border-border px-4 py-2 text-xs font-semibold text-text-muted transition hover:text-text"
	>
		Active
	</button>
	<button
		class="rounded-full border border-border px-4 py-2 text-xs font-semibold text-text-muted transition hover:text-text"
	>
		On Leave
	</button>
	<button
		class="rounded-full border border-border px-4 py-2 text-xs font-semibold text-text-muted transition hover:text-text"
	>
		Invited
	</button>
{/snippet}

{#snippet nameCell(row: EmployeeRow)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 items-center justify-center rounded-2xl bg-border/50 text-xs font-semibold text-text shadow-sm"
		>
			{getInitials(row.name)}
		</div>
		<div>
			<p class="text-sm font-semibold text-text">{row.name}</p>
			<p class="text-xs text-text-muted">BSN {row.bsn}</p>
		</div>
	</div>
{/snippet}

{#snippet contractTypeCell(row: EmployeeRow)}
	<span
		class="inline-flex items-center justify-center rounded-lg px-3 py-1 text-xs font-semibold {contractTypeClasses[
			row.contractType
		]}"
	>
		{row.contractType}
	</span>
{/snippet}

{#snippet actionsCell(row: EmployeeRow)}
	<div class="flex items-center justify-end gap-2 text-xs font-semibold">
		<button class="text-text-muted transition hover:text-brand"> View </button>
		<span class="text-border">|</span>
		<button class="text-text-muted transition hover:text-brand"> Message </button>
	</div>
{/snippet}

<section class="space-y-6">
	<header class="rounded-3xl border border-border bg-surface/90 p-6 shadow-sm">
		<div class="flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-2">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span
						class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand"
					>
						<Users class="h-5 w-5" />
					</span>
					<span>Workforce</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">Employees</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
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
		cells={{ name: nameCell, contractType: contractTypeCell, actions: actionsCell }}
	/>
</section>
