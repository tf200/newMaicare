<script lang="ts">
	import type { Snippet } from 'svelte';

	export interface DataTableColumn {
		key: string;
		label: string;
		align?: 'left' | 'center' | 'right';
		width?: string;
		class?: string;
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

	const paginatedRows = $derived(() =>
		rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);
	const totalPages = $derived(() => Math.max(Math.ceil(rows.length / pageSize), 1));

	const previousPage = () => {
		if (currentPage > 1) currentPage -= 1;
	};

	const nextPage = () => {
		if (currentPage < totalPages()) currentPage += 1;
	};
</script>

<section
	class="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 {className}"
>
	{#if showHeader()}
		<div class="mb-2 flex items-end justify-between px-6 pb-6">
			<div>
				{#if title}
					<h2 class="text-2xl font-bold tracking-tighter text-zinc-900 dark:text-white">
						{title}
					</h2>
				{/if}
				{#if description}
					<p class="text-sm font-medium text-zinc-500 dark:text-zinc-400">
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
			<thead class="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
				<tr>
					{#each columns as column}
						<th
							class="py-4 {alignClass(column.align)} {column.class ?? ''}"
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
								<div class="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800"></div>
								<p class="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
									{emptyTitle}
								</p>
								<p class="text-sm text-zinc-500 dark:text-zinc-400">
									{emptyDescription}
								</p>
								<button class="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
									Add record
								</button>
							</div>
						</td>
					</tr>
				{:else}
					{#each paginatedRows() as row, index (getRowKey(row, index))}
						<tr
							class="border-b border-zinc-100/80 py-4 transition-colors duration-200 last:border-0 hover:bg-zinc-50/50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30"
						>
							{#each columns as column}
								<td
									class="px-6 py-4 text-sm font-medium text-zinc-600 tabular-nums dark:text-zinc-400 {alignClass(
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

	<div
		class="flex items-center justify-between border-t border-zinc-100 px-6 py-4 dark:border-zinc-800"
	>
		<button
			class="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100/70"
			onclick={previousPage}
			disabled={currentPage <= 1}
		>
			Previous
		</button>
		<span class="font-mono text-xs tracking-tighter text-zinc-400">
			{(currentPage - 1) * pageSize + 1}
			—
			{Math.min(currentPage * pageSize, rows.length)}
			of {rows.length}
		</span>
		<button
			class="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100/70"
			onclick={nextPage}
			disabled={currentPage >= totalPages()}
		>
			Next
		</button>
	</div>
</section>
