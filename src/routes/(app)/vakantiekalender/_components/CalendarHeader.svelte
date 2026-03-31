<script lang="ts">
	import type { LeaveRequest } from '$lib/types/api/vakantiekalender';

	interface Props {
		leaveRequests: LeaveRequest[];
		loading: boolean;
		departments: string[];
		selectedDepartment: string;
		onDepartmentChange: (v: string) => void;
	}

	let { leaveRequests, loading, departments, selectedDepartment, onDepartmentChange }: Props = $props();

	const todayCount = $derived(
		leaveRequests.filter((lr) => {
			if (lr.status !== 'approved') return false;
			const now = new Date();
			const start = new Date(lr.start_date);
			const end = new Date(lr.end_date);
			return now >= start && now <= end;
		}).length
	);

	const pendingCount = $derived(leaveRequests.filter((lr) => lr.status === 'pending').length);
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
	<!-- Stats inline -->
	<div class="flex gap-3">
		{#each [
			{ label: 'Vandaag afwezig', value: String(todayCount), color: 'text-emerald-600 dark:text-emerald-400', bg: 'from-emerald-500/12 to-emerald-500/3' },
			{ label: 'Openstaand', value: String(pendingCount), color: 'text-amber-600 dark:text-amber-400', bg: 'from-amber-500/12 to-amber-500/3' }
		] as stat}
			<div class="relative overflow-hidden rounded-xl border border-border/80 bg-surface px-4 py-3">
				<div class="absolute inset-0 bg-gradient-to-br {stat.bg}"></div>
				<div class="relative">
					<div class="text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">{stat.label}</div>
					<div class="mt-0.5 text-xl font-extrabold tabular-nums {stat.color}">{stat.value}</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Department filter -->
	<div class="flex items-center gap-2">
		<span class="text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">Afdeling</span>
		<select
			class="h-8 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-text focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
			value={selectedDepartment}
			onchange={(e) => onDepartmentChange((e.target as HTMLSelectElement).value)}
		>
			<option value="all">Alle</option>
			{#each departments as dept}
				<option value={dept}>{dept}</option>
			{/each}
		</select>
	</div>
</div>
