<script lang="ts">
	interface Props {
		currentPage?: number;
		pageSize?: number;
		totalCount?: number;
		onPageChange?: (page: number) => void;
		class?: string;
	}

	let {
		currentPage = 1,
		pageSize = 10,
		totalCount = 0,
		onPageChange,
		class: className = ''
	}: Props = $props();

	const totalPages = $derived.by(() => Math.max(Math.ceil(totalCount / pageSize), 1));
	const rangeStart = $derived.by(() => (totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1));
	const rangeEnd = $derived.by(() => Math.min(currentPage * pageSize, totalCount));

	const changePage = (nextPage: number) => {
		if (nextPage === currentPage) return;
		onPageChange?.(nextPage);
	};

	const previousPage = () => {
		if (currentPage > 1) changePage(currentPage - 1);
	};

	const nextPage = () => {
		if (currentPage < totalPages) changePage(currentPage + 1);
	};
</script>

<div class="flex items-center justify-between gap-4 {className}">
	<button
		class="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text-muted transition hover:bg-border/50 disabled:opacity-50"
		onclick={previousPage}
		disabled={currentPage <= 1}
	>
		Previous
	</button>
	<span class="font-mono text-xs tracking-tighter text-text-subtle">
		{rangeStart}—{rangeEnd} of {totalCount}
	</span>
	<button
		class="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text-muted transition hover:bg-border/50 disabled:opacity-50"
		onclick={nextPage}
		disabled={currentPage >= totalPages}
	>
		Next
	</button>
</div>
