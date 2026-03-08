<script lang="ts">
	import {
		BookOpen,
		Plus,
		Search,
		CheckCircle2,
		Clock,
		AlertCircle,
		Ban,
		ChevronRight,
		User
	} from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import type { EmployeeHandbookAssignment, HandbookStatus, HandbooksLoadResult } from './+page';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
				status: string;
			};
			handbooksData: Promise<HandbooksLoadResult>;
		};
	}>();

	const columns: DataTableColumn[] = [
		{ key: 'employee', label: 'Employee', headerClass: 'pl-14' },
		{ key: 'status', label: 'Status', width: '150px' },
		{ key: 'template', label: 'Assigned Template' },
		{ key: 'progress', label: 'Progress', width: '200px' },
		{ key: 'assigned_at', label: 'Assigned At', width: '150px' },
		{ key: 'actions', label: '', align: 'right', width: '120px' }
	];

	const handbooksDataPromise = $derived(data.handbooksData);
	const initial = $derived(data.initial);
	const currentPage = $derived(initial.page);
	const pageSize = $derived(initial.pageSize);

	let searchTerm = $state('');
	let selectedAssignment = $state<EmployeeHandbookAssignment | null>(null);
	let isDetailOpen = $state(false);
	let isAssignModalOpen = $state(false);

	// Assignment Form State
	let selectedEmployeeId = $state('');
	let selectedTemplateId = $state('');
	let isAssigning = $state(false);

	const statusOptions = [
		{ value: 'all', label: 'All Statuses' },
		{ value: 'not_started', label: 'Not Started' },
		{ value: 'in_progress', label: 'In Progress' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'waived', label: 'Waived' },
		{ value: 'no_assignment', label: 'No Assignment' }
	];

	const updateQuery = (pageValue: number, statusValue: string) => {
		const params = new URLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));
		if (statusValue !== 'all') params.set('status', statusValue);
		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true, noScroll: true });
	};

	const handleViewDetail = (assignment: EmployeeHandbookAssignment) => {
		selectedAssignment = assignment;
		isDetailOpen = true;
	};

	const handleOpenAssign = (employeeId?: string) => {
		selectedEmployeeId = employeeId || '';
		selectedTemplateId = '';
		isAssignModalOpen = true;
	};

	const handleAssign = async () => {
		if (!selectedEmployeeId || !selectedTemplateId) return;
		isAssigning = true;
		// Mock API call
		await new Promise((resolve) => setTimeout(resolve, 1000));
		isAssigning = false;
		isAssignModalOpen = false;
		// In a real app, we'd invalidate or refetch
		await invalidateAll();
	};

	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const statusColors: Record<HandbookStatus, string> = {
		completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
		in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
		not_started: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
		waived: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
		no_assignment: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'
	};

	const statusIcons: Record<HandbookStatus, any> = {
		completed: CheckCircle2,
		in_progress: Clock,
		not_started: AlertCircle,
		waived: Ban,
		no_assignment: User
	};

	const getProgressColor = (progress: number) => {
		if (progress >= 100) return 'bg-emerald-500';
		if (progress > 0) return 'bg-blue-500';
		return 'bg-zinc-200';
	};

	// Mock steps for detail view
	const mockSteps = [
		{ id: '1', title: 'Welcome & Culture', status: 'completed' },
		{ id: '2', title: 'Health & Safety', status: 'completed' },
		{ id: '3', title: 'Code of Conduct', status: 'in_progress' },
		{ id: '4', title: 'Leave Policies', status: 'not_started' },
		{ id: '5', title: 'Data Protection (GDPR)', status: 'not_started' },
		{ id: '6', title: 'IT & Security', status: 'not_started' }
	];
</script>

<svelte:head>
	<title>Employee Handbooks | MaiCare</title>
</svelte:head>

<section class="space-y-6">
	<header class="rounded-3xl border border-border bg-surface/90 p-6 shadow-sm">
		<div class="flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-2">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span
						class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand"
					>
						<BookOpen class="h-5 w-5" />
					</span>
					<span>Workforce Operations</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">Employee Handbooks</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					Manage handbook assignments and monitor employee progress across the organization.
				</p>
			</div>
			<div class="flex items-center gap-3">
				<Button variant="secondary" class="gap-2" onclick={() => handleOpenAssign()}>
					<Plus class="h-4 w-4" />
					Assign Handbook
				</Button>
			</div>
		</div>
	</header>

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
				/>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				{#each statusOptions as option (option.value)}
					<button
						onclick={() => updateQuery(1, option.value)}
						class="h-9 rounded-full px-4 text-xs font-semibold transition-all {initial.status ===
						option.value
							? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
							: 'border border-border text-text-muted hover:text-text'}"
					>
						{option.label}
					</button>
				{/each}
			</div>
		</div>
	{/snippet}

	{#snippet employeeCell(row: EmployeeHandbookAssignment)}
		<div class="flex items-center gap-3">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-2xl bg-border/50 text-xs font-semibold text-text shadow-sm"
			>
				{row.employee_initials}
			</div>
			<div>
				<p class="text-sm font-semibold text-text">{row.employee_name}</p>
				<p class="text-xs text-text-muted">ID: {row.employee_id}</p>
			</div>
		</div>
	{/snippet}

	{#snippet statusCell(row: EmployeeHandbookAssignment)}
		{@const Icon = statusIcons[row.status]}
		<span
			class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold {statusColors[
				row.status
			]}"
		>
			<Icon class="h-3.5 w-3.5" />
			{row.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
		</span>
	{/snippet}

	{#snippet templateCell(row: EmployeeHandbookAssignment)}
		{#if row.template_title}
			<div>
				<p class="text-sm font-medium text-text">{row.template_title}</p>
				<p class="text-xs text-text-muted">v{row.template_version}</p>
			</div>
		{:else}
			<span class="text-xs text-text-subtle italic">No active assignment</span>
		{/if}
	{/snippet}

	{#snippet progressCell(row: EmployeeHandbookAssignment)}
		{#if row.status !== 'no_assignment' && row.status !== 'waived'}
			{@const percent = Math.round((row.completed_steps / row.total_steps) * 100)}
			<div class="w-full space-y-1.5">
				<div class="flex justify-between text-[10px] font-bold tracking-wider uppercase">
					<span class="text-text-muted">{row.completed_steps} / {row.total_steps} steps</span>
					<span class="text-text">{percent}%</span>
				</div>
				<div class="h-1.5 w-full overflow-hidden rounded-full bg-border/50">
					<div
						class="h-full transition-all duration-500 {getProgressColor(percent)}"
						style="width: {percent}%"
					></div>
				</div>
			</div>
		{:else}
			<span class="text-xs text-text-subtle">-</span>
		{/if}
	{/snippet}

	{#snippet actionsCell(row: EmployeeHandbookAssignment)}
		<div class="flex items-center justify-end gap-2">
			{#if row.status === 'no_assignment'}
				<Button
					variant="ghost"
					size="sm"
					class="text-brand"
					onclick={() => handleOpenAssign(row.employee_id)}
				>
					Assign
				</Button>
			{:else}
				<button
					class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-border/50 hover:text-brand"
					onclick={() => handleViewDetail(row)}
					title="View Progress"
				>
					<ChevronRight class="h-5 w-5" />
				</button>
			{/if}
		</div>
	{/snippet}

	{#await handbooksDataPromise}
		<DataTable
			{columns}
			rows={[]}
			loading
			{currentPage}
			{pageSize}
			totalCount={0}
			onPageChange={(nextPage) => updateQuery(nextPage, initial.status)}
			rowKey="id"
			title="Employee Handbook Roster"
			description="Overview of all employee handbook assignments and their current status."
			filters={tableFilters}
			cells={{
				employee: employeeCell,
				status: statusCell,
				template: templateCell,
				progress: progressCell,
				actions: actionsCell
			}}
		/>
	{:then handbooksData}
		<DataTable
			{columns}
			rows={handbooksData.assignments.filter((a) =>
				a.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
			)}
			currentPage={handbooksData.pagination.page}
			pageSize={handbooksData.pagination.pageSize}
			totalCount={handbooksData.pagination.count}
			onPageChange={(nextPage) => updateQuery(nextPage, initial.status)}
			rowKey="id"
			title="Employee Handbook Roster"
			description="Overview of all employee handbook assignments and their current status."
			filters={tableFilters}
			cells={{
				employee: employeeCell,
				status: statusCell,
				template: templateCell,
				progress: progressCell,
				assigned_at: (row) => formatDate(row.assigned_at),
				actions: actionsCell
			}}
		/>

		<!-- Assign Handbook Modal -->
		<Modal
			bind:open={isAssignModalOpen}
			title="Assign Handbook"
			description="Select an employee and a handbook template version to assign."
		>
			<div class="space-y-4 py-4">
				<div class="space-y-2">
					<label for="employee-select" class="text-sm font-semibold text-text">Employee</label>
					<SearchSelect
						id="employee-select"
						placeholder="Select employee..."
						options={handbooksData.assignments.map((a) => ({
							value: a.employee_id,
							label: a.employee_name
						}))}
						bind:value={selectedEmployeeId}
					/>
				</div>

				<div class="space-y-2">
					<label for="template-select" class="text-sm font-semibold text-text"
						>Handbook Template</label
					>
					<Select
						id="template-select"
						placeholder="Select template version..."
						options={handbooksData.templates.map((t) => ({
							value: t.id,
							label: `${t.title} (v${t.version})`
						}))}
						bind:value={selectedTemplateId}
					/>
					{#if selectedTemplateId}
						{#each handbooksData.templates.filter((t) => t.id === selectedTemplateId) as tmpl (tmpl.id)}
							<p class="mt-1 text-xs text-text-muted">
								{tmpl.description} • {tmpl.steps_count} steps
							</p>
						{/each}
					{/if}
				</div>

				<div class="mt-4 rounded-xl border border-orange-500/10 bg-orange-500/5 p-3">
					<div class="flex gap-2 text-orange-600 dark:text-orange-400">
						<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
						<p class="text-xs font-medium">
							Assigning a new handbook will replace any existing active assignment for this
							employee.
						</p>
					</div>
				</div>
			</div>

			{#snippet footer()}
				<div class="flex justify-end gap-3">
					<Button variant="ghost" onclick={() => (isAssignModalOpen = false)}>Cancel</Button>
					<Button
						variant="secondary"
						onclick={handleAssign}
						disabled={!selectedEmployeeId || !selectedTemplateId || isAssigning}
						loading={isAssigning}
					>
						Assign Handbook
					</Button>
				</div>
			{/snippet}
		</Modal>

		<!-- Detail Sheet -->
		<Sheet bind:open={isDetailOpen} title="Assignment Detail">
			{#if selectedAssignment}
				{@const StatusIcon = statusIcons[selectedAssignment.status]}
				<div class="space-y-8 pb-20">
					<!-- Employee Header -->
					<div class="flex items-center gap-4">
						<div
							class="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-xl font-bold text-brand"
						>
							{selectedAssignment.employee_initials}
						</div>
						<div>
							<h3 class="text-xl font-bold text-text">{selectedAssignment.employee_name}</h3>
							<p class="text-sm text-text-muted">{selectedAssignment.employee_id}</p>
						</div>
					</div>

					<!-- Status Card -->
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-1 rounded-2xl border border-border bg-surface p-4">
							<p class="text-[10px] font-bold tracking-widest text-text-muted uppercase">Status</p>
							<div class="flex items-center gap-2">
								<StatusIcon
									class="h-4 w-4 {statusColors[selectedAssignment.status].split(' ')[1]}"
								/>
								<span class="text-sm font-bold text-text">
									{selectedAssignment.status
										.replace('_', ' ')
										.replace(/\b\w/g, (l) => l.toUpperCase())}
								</span>
							</div>
						</div>
						<div class="space-y-1 rounded-2xl border border-border bg-surface p-4">
							<p class="text-[10px] font-bold tracking-widest text-text-muted uppercase">
								Progress
							</p>
							<p class="text-sm font-bold text-text">
								{selectedAssignment.completed_steps} / {selectedAssignment.total_steps} steps
							</p>
						</div>
					</div>

					<!-- Assignment Info -->
					<div class="space-y-4">
						<h4 class="text-xs font-bold tracking-widest text-text-muted uppercase">
							Assignment Info
						</h4>
						<div class="divide-y divide-border rounded-2xl border border-border bg-surface">
							<div class="flex items-center justify-between p-4">
								<span class="text-sm text-text-muted">Template</span>
								<span class="text-sm font-semibold text-text"
									>{selectedAssignment.template_title}</span
								>
							</div>
							<div class="flex items-center justify-between p-4">
								<span class="text-sm text-text-muted">Version</span>
								<span class="text-sm font-semibold text-text"
									>v{selectedAssignment.template_version}</span
								>
							</div>
							<div class="flex items-center justify-between p-4">
								<span class="text-sm text-text-muted">Assigned At</span>
								<span class="text-sm font-semibold text-text"
									>{formatDate(selectedAssignment.assigned_at)}</span
								>
							</div>
							<div class="flex items-center justify-between p-4">
								<span class="text-sm text-text-muted">Started At</span>
								<span class="text-sm font-semibold text-text"
									>{formatDate(selectedAssignment.started_at)}</span
								>
							</div>
							<div class="flex items-center justify-between p-4">
								<span class="text-sm text-text-muted">Completed At</span>
								<span class="text-sm font-semibold text-text"
									>{formatDate(selectedAssignment.completed_at)}</span
								>
							</div>
						</div>
					</div>

					<!-- Progress Steps -->
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h4 class="text-xs font-bold tracking-widest text-text-muted uppercase">
								Step Progress
							</h4>
							<span class="text-xs font-bold text-brand">
								{Math.round(
									(selectedAssignment.completed_steps / selectedAssignment.total_steps) * 100
								)}% Complete
							</span>
						</div>

						<div class="space-y-3">
							{#each mockSteps as step, i (step.id)}
								<div
									class="group relative flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 transition-all hover:border-brand/30"
								>
									<div
										class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2
										{step.status === 'completed'
											? 'border-emerald-500 bg-emerald-500 text-white'
											: step.status === 'in_progress'
												? 'border-blue-500 text-blue-500'
												: 'border-border text-text-subtle'}"
									>
										{#if step.status === 'completed'}
											<CheckCircle2 class="h-3.5 w-3.5" />
										{:else if step.status === 'in_progress'}
											<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500"></div>
										{:else}
											<span class="text-[10px] font-bold">{i + 1}</span>
										{/if}
									</div>
									<div class="flex-1">
										<p
											class="text-sm font-semibold text-text {step.status === 'completed'
												? 'text-text-muted line-through'
												: ''}"
										>
											{step.title}
										</p>
										<p class="text-xs font-bold tracking-tighter text-text-muted uppercase">
											{step.status.replace('_', ' ')}
										</p>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Actions -->
					<div class="flex gap-3 pt-4">
						<Button
							variant="outline"
							class="flex-1 gap-2"
							onclick={() => handleOpenAssign(selectedAssignment?.employee_id)}
						>
							<Plus class="h-4 w-4" />
							Reassign
						</Button>
						{#if selectedAssignment.status !== 'waived' && selectedAssignment.status !== 'completed'}
							<Button variant="ghost" class="flex-1 text-orange-600 hover:bg-orange-500/10">
								Waive
							</Button>
						{/if}
					</div>
				</div>
			{/if}
		</Sheet>
	{/await}
</section>
