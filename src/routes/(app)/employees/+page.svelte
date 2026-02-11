<script lang="ts">
	import { Users, Plus, Search } from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import Filters from '$lib/components/ui/FilterDropdown.svelte';
	import CreateEmployeeForm from '$lib/components/forms/CreateEmployeeForm.svelte';
	import type {
		EmployeeFilters as EmployeePageFilters,
		EmployeeRow,
		EmployeesLoadResult
	} from './+page';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
				filters: EmployeePageFilters;
			};
			employeesData: Promise<EmployeesLoadResult>;
		};
	}>();
	type EmployeeFilters = EmployeePageFilters;

	const columns: DataTableColumn[] = [
		{ key: 'name', label: 'Employee', headerClass: 'pl-14' },
		{ key: 'department', label: 'Department' },
		{ key: 'location', label: 'Location' },
		{ key: 'contractType', label: 'Contract', width: '140px' },
		{ key: 'contractEndDate', label: 'Contract end', width: '150px' },
		{ key: 'actions', label: '', align: 'right', width: '80px' }
	];

	const employeesDataPromise = $derived.by(() => data.employeesData);
	const initial = $derived.by(() => data.initial);
	const currentPage = $derived.by(() => initial.page);
	const pageSize = $derived.by(() => initial.pageSize);
	const appliedSearch = $derived.by(() => (initial.filters.search ?? '').trim());

	const defaultFilters: EmployeeFilters = {
		search: '',
		contractType: '',
		isArchived: undefined,
		outOfService: undefined
	};

	let searchTerm = $state('');
	let showCreateEmployee = $state(false);
	let filters = $derived.by(() => ({
		...defaultFilters,
		...initial.filters
	}));

	onMount(() => {
		searchTerm = appliedSearch;
	});

	const filterGroups: Array<{
		label: string;
		items: Array<{ key: 'isArchived' | 'outOfService'; label: string }>;
	}> = [
		{
			label: 'Employment state',
			items: [
				{ key: 'isArchived', label: 'Archived employees' },
				{ key: 'outOfService', label: 'Out of service' }
			]
		}
	];

	const buildQuery = (pageValue: number, nextFilters: EmployeeFilters) => {
		const params = new URLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));
		if (nextFilters.search) params.set('search', nextFilters.search);
		if (nextFilters.contractType) params.set('contract_type', nextFilters.contractType);
		if (nextFilters.isArchived != null) params.set('is_archived', String(nextFilters.isArchived));
		if (nextFilters.outOfService != null)
			params.set('out_of_service', String(nextFilters.outOfService));

		return params.toString();
	};

	const updateQuery = (pageValue: number, nextFilters: EmployeeFilters) => {
		const nextQuery = buildQuery(pageValue, nextFilters);
		if (page.url.searchParams.toString() === nextQuery) return;
		goto(`?${nextQuery}`, { replaceState: true, keepFocus: true, noScroll: true });
	};

	const setFilters = (nextFilters: EmployeeFilters) => {
		updateQuery(1, nextFilters);
	};

	const applySearch = () => {
		setFilters({ ...filters, search: searchTerm.trim() });
	};

	const clearFilters = () => {
		searchTerm = '';
		updateQuery(1, defaultFilters);
	};

	const handleEmployeeCreated = async () => {
		showCreateEmployee = false;
		const nextQuery = buildQuery(1, { ...filters });
		if (page.url.searchParams.toString() !== nextQuery) {
			await goto(`?${nextQuery}`, { replaceState: true, keepFocus: true, noScroll: true });
			return;
		}
		await invalidateAll();
	};

	const getInitials = (name: string) =>
		name
			.split(' ')
			.map((part) => part[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();

	const contractTypeClasses: Record<EmployeeRow['contractType'], string> = {
		Loondienst: 'bg-success/10 text-success',
		ZZP: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
		None: 'bg-border text-text-muted'
	};
</script>

<svelte:head>
	<title>Employees | MaiCare</title>
</svelte:head>

{#snippet tableFilters()}
	<div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
		<div class="relative w-full sm:w-auto">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="text"
				placeholder="Search employees..."
				bind:value={searchTerm}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-64"
				onkeydown={(event) => {
					if (event.key === 'Enter') applySearch();
				}}
				onblur={applySearch}
			/>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<button
				onclick={() => setFilters({ ...filters, contractType: '' })}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {filters.contractType ===
				''
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				All
			</button>
			<button
				onclick={() => setFilters({ ...filters, contractType: 'loondienst' })}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {filters.contractType ===
				'loondienst'
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				Loondienst
			</button>
			<button
				onclick={() => setFilters({ ...filters, contractType: 'ZZP' })}
				class="h-9 rounded-full px-4 text-xs font-semibold transition-all {filters.contractType ===
				'ZZP'
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				ZZP
			</button>
		</div>

		<div class="hidden h-6 w-px bg-border sm:block"></div>

		<Filters
			{filters}
			groups={filterGroups}
			title="Filter employees"
			onUpdate={(nextFilters) => setFilters(nextFilters as unknown as EmployeeFilters)}
			onClear={clearFilters}
		/>
	</div>
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
		<button class="text-text-muted transition hover:text-brand">View</button>
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
				<Button variant="secondary" class="gap-2" onclick={() => (showCreateEmployee = true)}>
					<Plus class="h-4 w-4" />
					New hire
				</Button>
			</div>
		</div>
	</header>

	<CreateEmployeeForm bind:open={showCreateEmployee} onCreated={handleEmployeeCreated} />

	{#await employeesDataPromise}
		<DataTable
			{columns}
			rows={[]}
			loading
			{currentPage}
			{pageSize}
			totalCount={0}
			onPageChange={(nextPage) => updateQuery(nextPage, { ...filters })}
			rowKey="id"
			title="Employee roster"
			description="Track active coverage, leave status, and team ownership in real time."
			filters={tableFilters}
			cells={{ name: nameCell, contractType: contractTypeCell, actions: actionsCell }}
		/>
	{:then employeesData}
		{#if employeesData.loadError}
			<InlineErrorBanner message={employeesData.loadError} onRetry={() => invalidateAll()} />
		{/if}

		<DataTable
			{columns}
			rows={employeesData.employees}
			currentPage={employeesData.pagination.page}
			pageSize={employeesData.pagination.pageSize}
			totalCount={employeesData.pagination.count}
			onPageChange={(nextPage) => updateQuery(nextPage, { ...filters })}
			rowKey="id"
			title="Employee roster"
			description="Track active coverage, leave status, and team ownership in real time."
			filters={tableFilters}
			cells={{ name: nameCell, contractType: contractTypeCell, actions: actionsCell }}
		/>
	{/await}
</section>
