<script lang="ts">
	import type { Snippet } from 'svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';

	export interface DataTableColumn {
		key: string;
		label: string;
		align?: 'left' | 'center' | 'right';
		width?: string;
		class?: string;
		headerClass?: string;
		cellClass?: string;
	}

	type RowData = Record<string, unknown>;

	export interface Props {
		columns?: DataTableColumn[];
		rows?: Array<any>;
		title?: string;
		description?: string;
		emptyTitle?: string;
		emptyDescription?: string;
		rowKey?: string | ((row: any, index: number) => string);
		actions?: Snippet;
		filters?: Snippet;
		cells?: Record<string, Snippet<[any]>>;
		currentPage?: number;
		pageSize?: number;
		totalCount?: number;
		onPageChange?: (page: number) => void;
		class?: string;
	}

	let {
		columns = [],
		rows = [],
		title,
		description,
		emptyTitle = 'No records found',
		emptyDescription = 'Try adjusting your filters or add a new record.',
		rowKey,
		actions,
		filters,
		cells,
		currentPage = $bindable(1),
		pageSize = 10,
		totalCount,
		onPageChange,
		class: className = ''
	}: Props = $props();

	const alignClass = (align: DataTableColumn['align'] = 'left') => {
		if (align === 'center') return 'text-center';
		if (align === 'right') return 'text-right';
		return 'text-left';
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

	const effectiveTotal = $derived.by(() => totalCount ?? rows.length);
	const paginatedRows = $derived.by(() =>
		totalCount == null ? rows.slice((currentPage - 1) * pageSize, currentPage * pageSize) : rows
	);
</script>

<section class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm {className}">
	{#if showHeader()}
		<div class="mb-2 flex items-end justify-between px-6 pb-6">
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
			<div class="flex items-center gap-2">
				{#if filters}
					<div>
						{@render filters?.()}
					</div>
				{/if}
				{#if actions}
					{@render actions?.()}
				{/if}
			</div>
		</div>
	{/if}

	<div class="overflow-x-auto px-6">
		<table class="min-w-full text-left">
			<thead class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				<tr>
					{#each columns as column (column.key)}
						<th
							class="px-6 py-4 {alignClass(column.align)} {column.headerClass ??
								column.class ??
								''}"
							style={column.width ? `width:${column.width}` : undefined}
						>
							{column.label}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if rows.length === 0}
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
									class="rounded-xl bg-btn-primary-bg px-4 py-2 text-sm font-semibold text-btn-primary-text"
								>
									Add record
								</button>
							</div>
						</td>
					</tr>
				{:else}
					{#each paginatedRows as row, index (getRowKey(row, index))}
						<tr
							class="border-b border-border/50 py-4 transition-colors duration-200 last:border-0 hover:bg-border/20"
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
			totalCount={effectiveTotal}
			onPageChange={handlePageChange}
		/>
	</div>
</section>
