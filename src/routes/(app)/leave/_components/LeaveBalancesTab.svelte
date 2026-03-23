<script lang="ts">
	import { m } from '$lib/paraglide/messages';

	type LeaveBalance = {
		name: string;
		department: string;
		budget: number;
		used: number;
	};

	type Props = {
		leaveBalances: LeaveBalance[];
	};

	let { leaveBalances }: Props = $props();
</script>

<div class="animate-in fade-in slide-in-from-bottom-2 space-y-4">
	<h2 class="text-sm font-semibold text-text">{m.leave_balance_title()}</h2>

	<div class="grid gap-4 md:grid-cols-2">
		{#each leaveBalances as balance}
			{@const available = balance.budget - balance.used}
			{@const usagePercent = (balance.used / balance.budget) * 100}
			{@const isHigh = usagePercent > 80}
			{@const isMedium = usagePercent > 50 && usagePercent <= 80}
			<div class="space-y-4 rounded-2xl border border-border/60 p-5">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-semibold text-text">{balance.name}</p>
						<p class="text-xs text-text-muted">{balance.department}</p>
					</div>
					<span
						class="text-xs font-bold {isHigh
							? 'text-error'
							: isMedium
								? 'text-warning'
								: 'text-success'}"
					>
						{available}
						{m.leave_hours_short()}
					</span>
				</div>

				<div>
					<div class="mb-1.5 flex items-center justify-between text-xs">
						<span class="text-text-muted">{m.leave_balance_usage_label()}</span>
						<span
							class="font-bold {isHigh ? 'text-error' : isMedium ? 'text-warning' : 'text-text'}"
							>{usagePercent.toFixed(0)}%</span
						>
					</div>
					<div class="h-1.5 w-full overflow-hidden rounded-full bg-border/30">
						<div
							class="h-full rounded-full {isHigh
								? 'bg-error'
								: isMedium
									? 'bg-warning'
									: 'bg-brand'}"
							style="width: {Math.min(usagePercent, 100)}%"
						></div>
					</div>
				</div>

				<div class="flex items-center gap-6 text-xs text-text-muted">
					<span
						><span class="font-semibold text-text">{balance.budget}</span>
						{m.leave_balance_total_budget()}</span
					>
					<span
						><span class="font-semibold text-text">{balance.used}</span>
						{m.leave_balance_used()}</span
					>
					<span
						><span class="font-semibold {isHigh ? 'text-error' : 'text-success'}">{available}</span>
						{m.leave_balance_available_label()}</span
					>
				</div>
			</div>
		{/each}
	</div>
</div>
