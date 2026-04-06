<script lang="ts">
	import { onMount } from 'svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import {
		Clock,
		CheckCircle,
		FileText,
		Plus,
		Send,
		Search,
		XCircle,
		Eye,
		Pencil
	} from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { listTimeEntries } from '$lib/api/uren';
	import type { TimeEntryListItemResponse, TimeEntriesListStatus } from '$lib/types/api';
	import AddTimeEntryModal from '$lib/components/schedules/AddTimeEntryModal.svelte';

	const DEFAULT_PAGE_SIZE = 10;
	const HOUR_TYPE_COLORS: Record<string, string> = {
		normal: 'text-blue-600 dark:text-blue-400',
		overtime: 'text-violet-600 dark:text-violet-400',
		travel: 'text-orange-600 dark:text-orange-400',
		leave: 'text-cyan-600 dark:text-cyan-400',
		sick: 'text-rose-600 dark:text-rose-400',
		training: 'text-indigo-600 dark:text-indigo-400'
	};

	const SEARCH_DEBOUNCE_MS = 350;

	type StatusFilter = 'all' | TimeEntriesListStatus;

	let activeFilter = $state<StatusFilter>('all');
	let searchQuery = $state('');
	let debouncedSearchQuery = $state('');
	let entries = $state<TimeEntryListItemResponse[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let currentPage = $state(1);
	let pageSize = $state(DEFAULT_PAGE_SIZE);
	let totalCount = $state(0);
	let requestId = 0;
	let searchDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
	let showAddModal = $state(false);

	const columns: DataTableColumn[] = [
		{ key: 'employee_name', label: 'Employee' },
		{ key: 'entry_date', label: 'Date' },
		{ key: 'client_name', label: 'Client / Project' },
		{ key: 'schedule', label: 'Schedule', align: 'center' },
		{ key: 'hours', label: 'Hours', align: 'right' },
		{ key: 'status', label: 'Status' },
		{ key: 'actions', label: '', align: 'right' }
	];

	const filterPills: Array<{ id: StatusFilter; label: string }> = [
		{ id: 'all', label: 'All' },
		{ id: 'submitted', label: 'For Approval' },
		{ id: 'approved', label: 'Approved' },
		{ id: 'draft', label: 'Concepts' },
		{ id: 'rejected', label: 'Rejected' }
	];

	async function fetchEntries() {
		const nextRequestId = ++requestId;
		loading = true;
		loadError = null;

		try {
			const response = await listTimeEntries({
				page: currentPage,
				pageSize,
				employeeSearch: debouncedSearchQuery || undefined,
				status: activeFilter === 'all' ? undefined : activeFilter
			});
			if (nextRequestId !== requestId) return;

			entries = response.data.results;
			totalCount = response.data.count;
			pageSize = response.data.page_size || pageSize;
		} catch (error) {
			if (nextRequestId !== requestId) return;
			entries = [];
			totalCount = 0;
			loadError = error instanceof Error ? error.message : 'Failed to load time entries.';
		} finally {
			if (nextRequestId !== requestId) return;
			loading = false;
		}
	}

	onMount(() => {
		void fetchEntries();

		return () => {
			if (!searchDebounceTimeout) return;
			clearTimeout(searchDebounceTimeout);
		};
	});

	const locale = $derived(getLocale() === 'nl' ? 'nl-NL' : 'en-US');

	function parseFiniteNumber(value: unknown): number | null {
		if (typeof value === 'number') {
			return Number.isFinite(value) ? value : null;
		}
		if (typeof value === 'string' && value.trim() !== '') {
			const parsed = Number(value);
			return Number.isFinite(parsed) ? parsed : null;
		}
		return null;
	}

	function computeEntryHours(entry: TimeEntryListItemResponse): number {
		const direct = parseFiniteNumber(entry.hours);
		if (direct !== null) return direct;

		if (!entry.start_time || !entry.end_time) return 0;

		const [sh, sm] = entry.start_time.split(':').map(Number);
		const [eh, em] = entry.end_time.split(':').map(Number);
		if (
			!Number.isFinite(sh) ||
			!Number.isFinite(sm) ||
			!Number.isFinite(eh) ||
			!Number.isFinite(em)
		)
			return 0;

		let diffMinutes = eh * 60 + em - (sh * 60 + sm);
		if (diffMinutes < 0) diffMinutes += 24 * 60;
		const breakMin = parseFiniteNumber(entry.break_minutes) ?? 0;
		return Math.max(0, (diffMinutes - breakMin) / 60);
	}

	function getHoursValue(value: unknown): number {
		return parseFiniteNumber(value) ?? 0;
	}

	function formatHours(value: unknown): string {
		const parsed = parseFiniteNumber(value);
		return parsed === null ? '—' : `${parsed.toFixed(2)}h`;
	}

	const totalHours = $derived.by(() =>
		entries.reduce((sum, entry) => sum + computeEntryHours(entry), 0)
	);

	const submittedHours = $derived.by(() =>
		entries
			.filter((entry) => entry.status === 'submitted')
			.reduce((sum, entry) => sum + computeEntryHours(entry), 0)
	);

	const approvedHours = $derived.by(() =>
		entries
			.filter((entry) => entry.status === 'approved')
			.reduce((sum, entry) => sum + computeEntryHours(entry), 0)
	);

	const draftHours = $derived.by(() =>
		entries
			.filter((entry) => entry.status === 'draft')
			.reduce((sum, entry) => sum + computeEntryHours(entry), 0)
	);

	function getFilterPillClass(pillId: StatusFilter) {
		if (pillId === 'all') {
			return activeFilter === pillId
				? 'bg-btn-primary-bg text-btn-primary-text shadow-sm'
				: 'border border-border text-text-muted hover:text-text';
		}
		if (pillId === 'submitted') {
			return activeFilter === pillId
				? 'bg-amber-500 text-white'
				: 'border border-border text-text-muted hover:text-text';
		}
		if (pillId === 'approved') {
			return activeFilter === pillId
				? 'bg-emerald-600 text-white'
				: 'border border-border text-text-muted hover:text-text';
		}
		if (pillId === 'draft') {
			return activeFilter === pillId
				? 'bg-gray-500 text-white'
				: 'border border-border text-text-muted hover:text-text';
		}
		return activeFilter === pillId
			? 'bg-rose-600 text-white'
			: 'border border-border text-text-muted hover:text-text';
	}

	function formatDate(dateValue: string): string {
		const parsed = new Date(dateValue);
		if (Number.isNaN(parsed.getTime())) return dateValue;

		return new Intl.DateTimeFormat(locale, {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		}).format(parsed);
	}

	function getStatusColor(status: TimeEntriesListStatus) {
		switch (status) {
			case 'approved':
				return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
			case 'submitted':
				return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
			case 'rejected':
				return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50';
			case 'draft':
			default:
				return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800/50';
		}
	}

	function getStatusLabel(status: TimeEntriesListStatus) {
		switch (status) {
			case 'approved':
				return 'Approved';
			case 'submitted':
				return 'For Approval';
			case 'rejected':
				return 'Rejected';
			case 'draft':
			default:
				return 'Concept';
		}
	}

	function getHourTypeLabel(hourType: TimeEntryListItemResponse['hour_type']): string {
		switch (hourType) {
			case 'normal':
				return 'Normal';
			case 'overtime':
				return 'Overtime';
			case 'travel':
				return 'Travel';
			case 'leave':
				return 'Leave';
			case 'sick':
				return 'Sick';
			case 'training':
				return 'Training';
			default:
				return hourType;
		}
	}

	function getInitials(name: string): string {
		return name
			.split(' ')
			.filter(Boolean)
			.map((part) => part[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	function handleStatusFilterChange(nextFilter: StatusFilter) {
		if (activeFilter === nextFilter) return;
		activeFilter = nextFilter;
		currentPage = 1;
		void fetchEntries();
	}

	function handlePageChange(nextPage: number) {
		if (nextPage === currentPage) return;
		currentPage = nextPage;
		void fetchEntries();
	}

	function handleSearchInput(event: Event) {
		searchQuery = (event.target as HTMLInputElement).value;

		if (searchDebounceTimeout) {
			clearTimeout(searchDebounceTimeout);
		}

		searchDebounceTimeout = setTimeout(() => {
			const nextQuery = searchQuery.trim();
			if (nextQuery === debouncedSearchQuery) return;
			debouncedSearchQuery = nextQuery;
			currentPage = 1;
			void fetchEntries();
		}, SEARCH_DEBOUNCE_MS);
	}

	function handleEntrySaved() {
		currentPage = 1;
		activeFilter = 'all';
		searchQuery = '';
		debouncedSearchQuery = '';
		void fetchEntries();
	}
</script>

{#snippet tableFilters()}
	<div class="flex w-full flex-wrap items-center gap-3">
		<div class="relative w-full sm:w-64">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="search"
				placeholder={m.search_employees()}
				value={searchQuery}
				oninput={handleSearchInput}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
			/>
		</div>
		<div class="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
			{#each filterPills as pill (pill.id)}
				<button
					onclick={() => handleStatusFilterChange(pill.id)}
					class="h-9 rounded-full px-4 text-xs font-semibold transition-all {getFilterPillClass(
						pill.id
					)}"
				>
					{pill.label}
				</button>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet cellEmployee(row: TimeEntryListItemResponse)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-border/50 text-xs font-semibold text-text shadow-sm"
		>
			{getInitials(row.employee_name)}
		</div>
		<div>
			<p class="text-sm font-semibold text-text">{row.employee_name}</p>
		</div>
	</div>
{/snippet}

{#snippet cellSchedule(row: TimeEntryListItemResponse)}
	<div class="flex flex-col items-center gap-0.5">
		{#if row.start_time && row.end_time}
			<span class="text-sm font-semibold text-text tabular-nums">
				{row.start_time.slice(0, 5)} – {row.end_time.slice(0, 5)}
			</span>
		{:else}
			<span class="text-sm text-text-muted">—</span>
		{/if}
		<span class="text-[10px] font-medium {HOUR_TYPE_COLORS[row.hour_type] || 'text-text-muted'}">
			{getHourTypeLabel(row.hour_type)}
		</span>
	</div>
{/snippet}

{#snippet cellDate(row: TimeEntryListItemResponse)}
	<span>{formatDate(row.entry_date)}</span>
{/snippet}

{#snippet cellStatus(row: TimeEntryListItemResponse)}
	<div class="flex items-center gap-1.5">
		<span
			class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase {getStatusColor(
				row.status
			)}"
		>
			{getStatusLabel(row.status)}
		</span>
		{#if row.is_paid}
			<span
				class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-emerald-700 uppercase dark:border-emerald-800/50 dark:text-emerald-400"
			>
				Paid
			</span>
		{/if}
	</div>
{/snippet}

{#snippet cellHours(row: TimeEntryListItemResponse)}
	<div class="flex flex-col items-end gap-0.5">
		<span class="text-sm font-bold text-text tabular-nums"
			>{formatHours(computeEntryHours(row))}</span
		>
		{#if (row.break_minutes ?? 0) > 0}
			<span
				class="inline-flex items-center rounded-md bg-border/40 px-1.5 py-px text-[10px] font-medium text-text-muted"
			>
				{row.break_minutes}m break
			</span>
		{/if}
	</div>
{/snippet}

{#snippet cellClient(row: TimeEntryListItemResponse)}
	<span class="font-medium text-text">{row.client_name || row.project_name || '—'}</span>
{/snippet}

{#snippet actionsCell(row: TimeEntryListItemResponse)}
	<div class="relative flex items-center justify-end gap-1.5">
		{#if row.status === 'submitted'}
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg border border-error/30 bg-surface text-error transition-all hover:bg-error/5 active:scale-95"
				title="Reject"
			>
				<XCircle class="h-4 w-4" />
			</button>
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-success text-white shadow-sm transition-all hover:bg-success/90 active:scale-95"
				title="Approve"
			>
				<CheckCircle class="h-4 w-4" />
			</button>
			<div class="ml-1 h-5 w-px bg-border/40"></div>
		{/if}
		<button
			type="button"
			class="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text-muted transition-all hover:bg-border/30 hover:text-text"
			title="View"
		>
			<Eye class="h-4 w-4" />
		</button>
		{#if !row.is_paid}
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text-muted transition-all hover:bg-border/30 hover:text-text"
				title="Edit"
			>
				<Pencil class="h-4 w-4" />
			</button>
		{/if}
	</div>
{/snippet}

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-end">
		<button
			type="button"
			onclick={() => (showAddModal = true)}
			class="inline-flex h-9 items-center gap-1.5 rounded-xl bg-btn-primary-bg px-4 text-sm font-bold text-btn-primary-text shadow-sm transition-all hover:opacity-90 active:scale-95"
		>
			<Plus class="h-4 w-4" />
			Add Entry
		</button>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<div
			class="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-brand/30"
		>
			<div
				class="absolute -right-4 -bottom-4 text-brand opacity-[0.03] transition-opacity group-hover:opacity-10"
			>
				<Clock class="h-28 w-28" />
			</div>
			<div class="relative">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					Total Hours
				</div>
				<div class="mt-2 text-2xl font-bold tracking-tight text-brand sm:text-3xl">
					{totalHours.toFixed(1)}
				</div>
				<p class="mt-2 text-xs font-medium text-text-muted">loaded on this page</p>
			</div>
		</div>

		<div
			class="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-amber-500/30"
		>
			<div
				class="absolute -right-4 -bottom-4 text-amber-600 opacity-[0.03] transition-opacity group-hover:opacity-10"
			>
				<Send class="h-28 w-28" />
			</div>
			<div class="relative">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					For Approval
				</div>
				<div class="mt-2 text-2xl font-bold tracking-tight text-amber-600 sm:text-3xl">
					{submittedHours.toFixed(1)}
				</div>
				<p class="mt-2 text-xs font-medium text-text-muted">hours awaiting review</p>
			</div>
		</div>

		<div
			class="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-emerald-500/30"
		>
			<div
				class="absolute -right-4 -bottom-4 text-emerald-600 opacity-[0.03] transition-opacity group-hover:opacity-10"
			>
				<CheckCircle class="h-28 w-28" />
			</div>
			<div class="relative">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">Approved</div>
				<div class="mt-2 text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
					{approvedHours.toFixed(1)}
				</div>
				<p class="mt-2 text-xs font-medium text-text-muted">hours confirmed</p>
			</div>
		</div>

		<div
			class="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-gray-500/30"
		>
			<div
				class="absolute -right-4 -bottom-4 text-gray-500 opacity-[0.03] transition-opacity group-hover:opacity-10"
			>
				<FileText class="h-28 w-28" />
			</div>
			<div class="relative">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">Concepts</div>
				<div class="mt-2 text-2xl font-bold tracking-tight text-gray-600 sm:text-3xl">
					{draftHours.toFixed(1)}
				</div>
				<p class="mt-2 text-xs font-medium text-text-muted">draft hours</p>
			</div>
		</div>
	</div>

	{#if loadError}
		<InlineErrorBanner message={loadError} />
	{/if}

	<DataTable
		{columns}
		rows={entries}
		{loading}
		title="Time Entries"
		description="Review and manage employee time logs."
		filters={tableFilters}
		{currentPage}
		{pageSize}
		{totalCount}
		onPageChange={handlePageChange}
		cells={{
			employee_name: cellEmployee,
			entry_date: cellDate,
			schedule: cellSchedule,
			status: cellStatus,
			hours: cellHours,
			client_name: cellClient,
			actions: actionsCell
		}}
	/>
</div>

<AddTimeEntryModal bind:open={showAddModal} onSaved={handleEntrySaved} />
