<script lang="ts">
	import { Users, Plus, Search } from 'lucide-svelte';
	import { afterNavigate, goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Filters from '$lib/components/ui/FilterDropdown.svelte';
	import CreateEmployeeForm from '$lib/components/forms/CreateEmployeeForm.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { EmployeeFilters as EmployeePageFilters, EmployeeRow } from './+page';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	type EmployeeFilters = EmployeePageFilters;

	const columns = $derived<DataTableColumn[]>([
		{ key: 'name', label: m.employee(), headerClass: 'pl-14' },
		{ key: 'department', label: m.department() },
		{ key: 'location', label: m.location() },
		{ key: 'contractType', label: m.contract_type_label(), width: '140px' },
		{ key: 'contractEndDate', label: m.contract_end(), width: '150px' },
		{ key: 'actions', label: '', align: 'right', width: '80px' }
	]);

	const employeesDataPromise = $derived.by(() => data.employeesData);
	const initial = $derived.by(() => data.initial);
	const currentPage = $derived.by(() => initial.page);
	const pageSize = $derived.by(() => initial.pageSize);
	const appliedSearch = $derived.by(() => (initial.filters.search ?? '').trim());
	const hasActiveFilters = $derived(
		Boolean(
			appliedSearch ||
			initial.filters.contractType ||
			initial.filters.isArchived ||
			initial.filters.outOfService
		)
	);

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

	afterNavigate(() => {
		searchTerm = appliedSearch;
	});

	const filterGroups: Array<{
		label: string;
		items: Array<{ key: 'isArchived' | 'outOfService'; label: string }>;
	}> = [
		{
			label: m.employment_state(),
			items: [
				{ key: 'isArchived', label: m.archived_employees() },
				{ key: 'outOfService', label: m.out_of_service() }
			]
		}
	];

	const buildQuery = (pageValue: number, nextFilters: EmployeeFilters) => {
		const params = new SvelteURLSearchParams();
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
		goto(resolve(`/(app)/employees?${nextQuery}`), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
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
			await goto(resolve(`/(app)/employees?${nextQuery}`), {
				replaceState: true,
				keepFocus: true,
				noScroll: true
			});
			return;
		}
		await invalidate('app:employees:list');
	};

	const getInitials = (name: string) =>
		name
			.split(' ')
			.map((part) => part[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();

	const contractTypeClasses: Record<EmployeeRow['contractType'], string> = {
		Loondienst: 'bg-success/10 text-success-strong',
		ZZP: 'bg-secondary/10 text-secondary-strong',
		None: 'bg-border text-text-muted'
	};

	const getContractTypeLabel = (contractType: EmployeeRow['contractType']) => {
		if (contractType === 'Loondienst') return m.loondienst();
		if (contractType === 'ZZP') return m.zzp();
		return m.none();
	};

	const normalizeDropdownFilters = (
		nextFilters: Record<string, string | number | boolean | undefined>
	) =>
		setFilters({
			...filters,
			isArchived: nextFilters.isArchived === true ? true : undefined,
			outOfService: nextFilters.outOfService === true ? true : undefined
		});
</script>

<svelte:head>
	<title>{m.employees()} | MaiCare</title>
</svelte:head>

{#snippet tableFilters()}
	<div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
		<div class="relative w-full sm:w-auto">
			<label for="employee-search" class="sr-only">{m.search_employees()}</label>
			<Search
				aria-hidden="true"
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				id="employee-search"
				type="text"
				placeholder={m.search_employees()}
				bind:value={searchTerm}
				class="h-10 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-64"
				onkeydown={(event) => {
					if (event.key === 'Enter') applySearch();
				}}
				onblur={applySearch}
			/>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<button
				type="button"
				onclick={() => setFilters({ ...filters, contractType: '' })}
				class="h-10 rounded-full px-4 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none {filters.contractType ===
				''
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				{m.all()}
			</button>
			<button
				type="button"
				onclick={() => setFilters({ ...filters, contractType: 'loondienst' })}
				class="h-10 rounded-full px-4 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none {filters.contractType ===
				'loondienst'
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				{m.loondienst()}
			</button>
			<button
				type="button"
				onclick={() => setFilters({ ...filters, contractType: 'ZZP' })}
				class="h-10 rounded-full px-4 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none {filters.contractType ===
				'ZZP'
					? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
					: 'border border-border text-text-muted hover:text-text'}"
			>
				{m.zzp()}
			</button>
		</div>

		<div class="hidden h-6 w-px bg-border sm:block"></div>

		<Filters
			{filters}
			groups={filterGroups}
			title={m.filter_employees()}
			buttonLabel={m.filters()}
			clearLabel={m.clear_filters()}
			onUpdate={normalizeDropdownFilters}
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
			<p class="text-xs text-text-muted">BSN {row.maskedBsn}</p>
		</div>
	</div>
{/snippet}

{#snippet contractTypeCell(row: EmployeeRow)}
	<span
		class="inline-flex items-center justify-center rounded-lg px-3 py-1 text-xs font-semibold {contractTypeClasses[
			row.contractType
		]}"
	>
		{getContractTypeLabel(row.contractType)}
	</span>
{/snippet}

{#snippet actionsCell(row: EmployeeRow)}
	<div class="flex items-center justify-end text-xs font-semibold">
		<a
			href={resolve('/(app)/employees/[id]', { id: row.id })}
			data-sveltekit-preload-data="hover"
			class="inline-flex min-h-10 items-center rounded-lg px-2 text-text-muted transition-colors hover:bg-brand/10 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
			>{m.view()}</a
		>
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
						<Users class="h-5 w-5" aria-hidden="true" />
					</span>
					<span>{m.workforce()}</span>
				</div>
				<h1 class="text-2xl font-bold tracking-tight text-text">{m.employees()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.employees_description()}
				</p>
			</div>
			<div class="flex w-full items-center gap-3 sm:w-auto">
				<Button class="w-full gap-2 sm:w-auto" onclick={() => (showCreateEmployee = true)}>
					<Plus class="h-4 w-4" aria-hidden="true" />
					{m.new_hire()}
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
			pagination={{
				mode: 'server',
				page: currentPage,
				pageSize,
				totalCount: 0,
				onPageChange: (nextPage) => updateQuery(nextPage, { ...filters })
			}}
			rowKey="id"
			title={m.employee_roster()}
			description={m.employee_roster_description()}
			toolbar={tableFilters}
			cells={{ name: nameCell, contractType: contractTypeCell, actions: actionsCell }}
		/>
	{:then employeesData}
		<DataTable
			{columns}
			rows={employeesData.employees}
			pagination={{
				mode: 'server',
				page: employeesData.pagination.page,
				pageSize: employeesData.pagination.pageSize,
				totalCount: employeesData.pagination.count,
				onPageChange: (nextPage) => updateQuery(nextPage, { ...filters })
			}}
			rowKey="id"
			title={m.employee_roster()}
			description={m.employee_roster_description()}
			empty={{
				title: hasActiveFilters ? m.empty_no_results_title() : m.empty_employees_title(),
				description: hasActiveFilters
					? m.empty_no_results_description()
					: m.empty_employees_description(),
				action: {
					label: hasActiveFilters ? m.empty_no_results_action() : m.empty_employees_action(),
					onClick: hasActiveFilters ? clearFilters : () => (showCreateEmployee = true)
				}
			}}
			error={employeesData.loadError ?? undefined}
			onRetry={() => invalidate('app:employees:list')}
			toolbar={tableFilters}
			cells={{ name: nameCell, contractType: contractTypeCell, actions: actionsCell }}
		/>
	{/await}
</section>
