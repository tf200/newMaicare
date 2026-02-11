<script lang="ts">
	import type { Snippet } from 'svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';

	import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-svelte';

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

	type RowData = Record<string, unknown>;

	export interface Props {
		columns?: DataTableColumn[];
		rows?: Array<any>;
		loading?: boolean;
		title?: string;
		description?: string;
		emptyTitle?: string;
		emptyDescription?: string;
		emptyActionLabel?: string;
		emptyAction?: () => void;
		emptyActionDisabled?: boolean;
		rowKey?: string | ((row: any, index: number) => string);
		actions?: Snippet;
		filters?: Snippet;
		cells?: Record<string, Snippet<[any]>>;
		currentPage?: number;
		pageSize?: number;
		totalCount?: number;
		sortColumn?: string;
		sortDirection?: 'asc' | 'desc';
		onPageChange?: (page: number) => void;
		onRowClick?: (row: any) => void;
		onSort?: (column: string, direction: 'asc' | 'desc') => void;
		class?: string;
	}

	let {
		columns = [],
		rows = [],
		loading = false,
		title,
		description,
		emptyTitle = 'No records found',
		emptyDescription = 'Try adjusting your filters or add a new record.',
		emptyActionLabel = 'Add record',
		emptyAction,
		emptyActionDisabled = false,
		rowKey,
		actions,
		filters,
		cells,
		currentPage = $bindable(1),
		pageSize = 10,
		totalCount,
		sortColumn,
		sortDirection,
		onPageChange,
		onRowClick,
		onSort,
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

	const getRecordValue = (row: any, key: string) => (row as RowData)?.[key];

	const getRowKey = (row: any, index: number) => {
		if (typeof rowKey === 'function') return rowKey(row, index);
		if (typeof rowKey === 'string' && getRecordValue(row, rowKey) != null) {
			return String(getRecordValue(row, rowKey));
		}
		return `${index}`;
	};

	const showHeader = () => Boolean(title || description || actions || filters);

	const handlePageChange = (nextPage: number) => {
		if (onPageChange) {
			onPageChange(nextPage);
			return;
		}
		currentPage = nextPage;
	};

	const handleEmptyAction = () => {
		if (emptyAction) emptyAction();
	};

	const handleSort = (columnKey: string) => {
		if (!onSort) return;

		const direction = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';

		onSort(columnKey, direction);
	};

	const effectiveTotal = $derived.by(() => totalCount ?? rows.length);
	const paginatedRows = $derived.by(() =>
		totalCount == null ? rows.slice((currentPage - 1) * pageSize, currentPage * pageSize) : rows
	);
	const loadingRows = $derived.by(() => Math.max(1, pageSize));
</script>

<section class="rounded-3xl border border-border bg-surface shadow-sm {className}">
	{#if showHeader()}
		<div
			class="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:pb-6"
		>
			<div>
				{#if title}
					<h2 class="text-2xl font-bold tracking-tighter text-text">
						{title}
					</h2>
				{/if}
				{#if description}
					<p class="text-sm font-medium text-text-muted">
						{description}
					</p>
				{/if}
			</div>
			<div class="flex flex-wrap items-center gap-2">
				{#if filters}
					<div class="w-full sm:w-auto">
						{@render filters?.()}
					</div>
				{/if}
				{#if actions}
					{@render actions?.()}
				{/if}
			</div>
		</div>
	{/if}

	<div class="overflow-x-auto px-4 sm:px-6">
		<table class="min-w-full text-left">
			<thead class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				<tr>
					{#each columns as column (column.key)}
						<th
							class="px-6 py-4 {alignClass(column.align)} {column.headerClass ??
								column.class ??
								''} {column.sortable && onSort ? 'cursor-pointer select-none hover:text-text' : ''}"
							style={column.width ? `width:${column.width}` : undefined}
							onclick={() => column.sortable && handleSort(column.key)}
						>
							<div class="inline-flex items-center gap-1.5">
								{column.label}
								{#if column.sortable && onSort}
									{#if sortColumn === column.key}
										{#if sortDirection === 'asc'}
											<ChevronUp class="h-3 w-3" />
										{:else}
											<ChevronDown class="h-3 w-3" />
										{/if}
									{:else}
										<ChevronsUpDown class="h-3 w-3 opacity-30 group-hover:opacity-100" />
									{/if}
								{/if}
							</div>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if loading}
					{#each Array.from({ length: loadingRows }) as _, index (`loading-${index}`)}
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
				{:else if rows.length === 0}
					<tr>
						<td colspan={columns.length} class="px-6 py-12 text-center">
							<div class="flex min-h-[400px] flex-col items-center justify-center gap-4">
								<div class="h-16 w-16 rounded-full bg-border/50"></div>
								<p class="text-xl font-bold tracking-tight text-text">
									{emptyTitle}
								</p>
								<p class="text-sm text-text-muted">
									{emptyDescription}
								</p>
								<button
									onclick={handleEmptyAction}
									disabled={!emptyAction || emptyActionDisabled}
									class="rounded-xl bg-btn-primary-bg px-4 py-2 text-sm font-semibold text-btn-primary-text disabled:cursor-not-allowed disabled:opacity-70"
								>
									{emptyActionLabel}
								</button>
							</div>
						</td>
					</tr>
				{:else}
					{#each paginatedRows as row, index (getRowKey(row, index))}
						<tr
							onclick={() => onRowClick?.(row)}
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

	<div class="border-t border-border px-6 py-4">
		<Pagination
			{currentPage}
			{pageSize}
			totalCount={loading ? 0 : effectiveTotal}
			onPageChange={handlePageChange}
		/>
	</div>
</section>
