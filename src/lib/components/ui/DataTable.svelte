<script module lang="ts">
	export interface DataTableColumn {
		key: string;
		label: string;
		align?: 'left' | 'center' | 'right';
		width?: string;
		class?: string;
		headerClass?: string;
		cellClass?: string;
		sortable?: boolean;
	}

	export interface DataTablePagination {
		mode: 'local' | 'server';
		page: number;
		pageSize: number;
		totalCount?: number;
		onPageChange?: (page: number) => void;
	}

	export interface DataTableEmptyState {
		title?: string;
		description?: string;
		action?: {
			label: string;
			onClick: () => void;
		};
	}
</script>

<script lang="ts" generics="Row">
	import type { Snippet } from 'svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { m } from '$lib/paraglide/messages';

	import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-svelte';

	interface Props {
		columns?: DataTableColumn[];
		rows?: Row[];
		loading?: boolean;
		title?: string;
		description?: string;
		emptyTitle?: string;
		emptyDescription?: string;
		emptyActionLabel?: string;
		emptyAction?: () => void;
		emptyActionDisabled?: boolean;
		rowKey?: string | ((row: Row, index: number) => string);
		actions?: Snippet;
		filters?: Snippet;
		toolbar?: Snippet;
		cells?: Record<string, Snippet<[Row]>>;
		pagination?: DataTablePagination | false;
		empty?: DataTableEmptyState;
		error?: string;
		onRetry?: () => void;
		currentPage?: number;
		pageSize?: number;
		totalCount?: number;
		sortColumn?: string;
		sortDirection?: 'asc' | 'desc';
		onPageChange?: (page: number) => void;
		onRowClick?: (row: Row) => void;
		onSort?: (column: string, direction: 'asc' | 'desc') => void;
		surface?: 'card' | 'plain';
		headerInline?: boolean;
		class?: string;
	}

	let {
		columns = [],
		rows = [],
		loading = false,
		title,
		description,
		emptyTitle = m.no_records_found(),
		emptyDescription = m.adjust_filters_or_add_record(),
		emptyActionLabel = m.add_record(),
		emptyAction,
		emptyActionDisabled = false,
		rowKey,
		actions,
		filters,
		toolbar,
		cells,
		pagination,
		empty,
		error,
		onRetry,
		currentPage = $bindable(1),
		pageSize = 10,
		totalCount,
		sortColumn,
		sortDirection,
		onPageChange,
		onRowClick,
		onSort,
		surface = 'card',
		headerInline = false,
		class: className = ''
	}: Props = $props();

	const alignClass = (align: DataTableColumn['align'] = 'left') => {
		if (align === 'center') return 'text-center';
		if (align === 'right') return 'text-right';
		return 'text-left';
	};

	const skeletonAlignClass = (align: DataTableColumn['align'] = 'left') => {
		if (align === 'center') return 'mx-auto';
		if (align === 'right') return 'ml-auto';
		return '';
	};

	const getRecordValue = (row: Row, key: string) => (row as Record<string, unknown> | null)?.[key];

	const getRowKey = (row: Row, index: number) => {
		if (typeof rowKey === 'function') return rowKey(row, index);
		if (typeof rowKey === 'string' && getRecordValue(row, rowKey) != null) {
			return String(getRecordValue(row, rowKey));
		}
		return `${index}`;
	};

	const showHeader = () => Boolean(title || description || toolbar || actions || filters);
	const paginationEnabled = $derived(pagination !== false);
	const paginationMode = $derived(
		pagination ? pagination.mode : totalCount == null ? 'local' : 'server'
	);
	const displayedPage = $derived(pagination ? pagination.page : currentPage);
	const displayedPageSize = $derived(pagination ? pagination.pageSize : pageSize);
	const displayedTotalCount = $derived(
		pagination ? (pagination.totalCount ?? rows.length) : (totalCount ?? rows.length)
	);

	const handlePageChange = (nextPage: number) => {
		if (pagination) {
			pagination.onPageChange?.(nextPage);
			return;
		}

		if (onPageChange) {
			onPageChange(nextPage);
			return;
		}
		currentPage = nextPage;
	};

	const handleEmptyAction = () => {
		if (empty?.action) {
			empty.action.onClick();
			return;
		}
		emptyAction?.();
	};

	const handleRowClick = (event: MouseEvent, row: Row) => {
		// Cell controls own their interaction and must not also activate the row.
		if (
			(event.target as Element | null)?.closest(
				'a, button, input, select, textarea, [data-table-stop-row-click]'
			)
		)
			return;
		onRowClick?.(row);
	};

	const handleSort = (columnKey: string) => {
		if (!onSort) return;

		const direction = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';

		onSort(columnKey, direction);
	};

	const getAriaSort = (column: DataTableColumn) => {
		if (!column.sortable || !onSort) return undefined;
		if (sortColumn !== column.key) return 'none' as const;
		return sortDirection === 'asc' ? ('ascending' as const) : ('descending' as const);
	};

	const paginatedRows = $derived.by(() =>
		paginationMode === 'local'
			? rows.slice((displayedPage - 1) * displayedPageSize, displayedPage * displayedPageSize)
			: rows
	);
	const loadingRows = $derived.by(() => Math.max(1, displayedPageSize));
</script>

<section
	class="{surface === 'card'
		? 'rounded-3xl border border-border bg-surface shadow-sm'
		: ''} {className}"
>
	{#if showHeader()}
		<div
			class="flex flex-col gap-4 p-4 sm:px-6 sm:pb-6 {surface === 'card'
				? 'sm:flex-row sm:items-end sm:justify-between'
				: ''} {headerInline ? 'sm:flex-row sm:items-end sm:justify-between' : ''}"
		>
			<div class="max-w-[260px] shrink-0">
				{#if title}
					<h2 class="text-2xl font-bold tracking-tighter text-text">
						{title}
					</h2>
				{/if}
				{#if description}
					<p class="max-w-[260px] text-sm font-medium text-text-muted">
						{description}
					</p>
				{/if}
			</div>
			<div class="flex flex-wrap items-center gap-2">
				{#if toolbar}
					{@render toolbar()}
				{:else}
					{#if filters}
						<div class="w-full sm:w-auto">
							{@render filters()}
						</div>
					{/if}
					{#if actions}
						{@render actions()}
					{/if}
				{/if}
			</div>
		</div>
	{/if}

	{#if error}
		<div
			class="mx-4 mb-4 flex items-center justify-between gap-3 rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error sm:mx-6"
		>
			<span>{error}</span>
			{#if onRetry}
				<button
					type="button"
					class="rounded-lg px-2 py-1 text-xs font-bold hover:bg-error/10 focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none"
					onclick={onRetry}>{m.retry()}</button
				>
			{/if}
		</div>
	{/if}

	<div class="overflow-x-auto px-4 sm:px-6">
		<table class="min-w-full text-left">
			<thead class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				<tr>
					{#each columns as column (column.key)}
						<th
							class="group px-6 py-4 {alignClass(column.align)} {column.headerClass ??
								column.class ??
								''}"
							style={column.width ? `width:${column.width}` : undefined}
							aria-sort={getAriaSort(column)}
						>
							{#if column.sortable && onSort}
								<button
									type="button"
									class="inline-flex items-center gap-1.5 rounded-lg hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
									onclick={() => handleSort(column.key)}
								>
									{column.label}
									{#if sortColumn === column.key}
										{#if sortDirection === 'asc'}
											<ChevronUp class="h-3 w-3" />
										{:else}
											<ChevronDown class="h-3 w-3" />
										{/if}
									{:else}
										<ChevronsUpDown class="h-3 w-3 opacity-30 group-hover:opacity-100" />
									{/if}
								</button>
							{:else}
								{column.label}
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if loading}
					{#each Array.from({ length: loadingRows }, (_, index) => index) as index (index)}
						<tr class="border-b border-border/50 py-4 last:border-0">
							{#each columns as column (column.key)}
								<td
									class="px-6 py-4 text-sm font-medium text-text-muted tabular-nums {alignClass(
										column.align
									)} {column.cellClass ?? ''}"
								>
									<div
										class="h-4 animate-pulse rounded-md bg-border/70 {skeletonAlignClass(
											column.align
										)}"
										style={`width:${column.width ?? (column.label ? '70%' : '40%')}`}
									></div>
								</td>
							{/each}
						</tr>
					{/each}
				{:else if error && rows.length === 0}
					<tr>
						<td colspan={columns.length} class="h-6"></td>
					</tr>
				{:else if rows.length === 0}
					<tr>
						<td colspan={columns.length} class="px-6 py-12 text-center">
							<EmptyState
								title={empty?.title ?? emptyTitle}
								description={empty?.description ?? emptyDescription}
								primaryAction={empty?.action || emptyAction
									? {
											label: empty?.action?.label ?? emptyActionLabel,
											onclick: handleEmptyAction,
											disabled: empty ? false : emptyActionDisabled
										}
									: undefined}
								size="md"
							/>
						</td>
					</tr>
				{:else}
					{#each paginatedRows as row, index (getRowKey(row, index))}
						<tr
							onclick={(event) => handleRowClick(event, row)}
							class="border-b border-border/50 py-4 transition-colors duration-200 last:border-0 hover:bg-border/20 {onRowClick
								? 'cursor-pointer'
								: ''}"
						>
							{#each columns as column (column.key)}
								<td
									class="px-6 py-4 text-sm font-medium text-text-muted tabular-nums {alignClass(
										column.align
									)} {column.cellClass ?? ''}"
								>
									{#if cells?.[column.key]}
										{@render cells[column.key](row)}
									{:else}
										<span>{getRecordValue(row, column.key) ?? '—'}</span>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if paginationEnabled && !error}
		<div class="border-t border-border px-6 py-4">
			<Pagination
				currentPage={displayedPage}
				pageSize={displayedPageSize}
				totalCount={loading ? 0 : displayedTotalCount}
				onPageChange={handlePageChange}
			/>
		</div>
	{/if}
</section>
