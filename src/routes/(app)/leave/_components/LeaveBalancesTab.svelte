<script lang="ts">
	import { Users } from 'lucide-svelte';
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

<div class="animate-in fade-in slide-in-from-bottom-2 space-y-5">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
				<Users class="h-5 w-5" />
			</div>
			<div>
				<h2 class="text-base font-semibold text-text">{m.leave_balance_title()}</h2>
				<p class="text-xs text-text-muted">{m.leave_balance_subtitle()}</p>
			</div>
		</div>
	</div>

	<div class="grid gap-4 md:grid-cols-2">
		{#each leaveBalances as balance, i (balance.name)}
			{@const available = balance.budget - balance.used}
			{@const usagePercent = (balance.used / balance.budget) * 100}
			{@const isHigh = usagePercent > 80}
			{@const isMedium = usagePercent > 50 && usagePercent <= 80}
			<div
				class="animate-in fade-in slide-in-from-bottom-2 group overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-sm transition-shadow hover:shadow-md"
				style="animation-delay: {i * 75}ms"
			>
				<div class="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
					<div class="flex items-center gap-2.5">
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
							<span class="text-xs font-bold">{balance.name.charAt(0)}</span>
						</div>
						<div>
							<p class="text-sm font-semibold text-text">{balance.name}</p>
							<p class="text-[10px] text-text-subtle">{balance.department}</p>
						</div>
					</div>
					<span
						class="rounded-lg px-2.5 py-1 text-xs font-bold {isHigh
							? 'bg-error/10 text-error'
							: isMedium
								? 'bg-warning/10 text-warning'
								: 'bg-success/10 text-success'}"
					>
						{available}
						{m.leave_hours_short()}
					</span>
				</div>

				<div class="p-5">
					<div class="mb-4">
						<div class="mb-1.5 flex items-center justify-between text-[11px]">
							<span class="font-medium text-text-muted">{m.leave_balance_usage_label()}</span>
							<span
								class="font-bold {isHigh ? 'text-error' : isMedium ? 'text-warning' : 'text-text'}"
								>{usagePercent.toFixed(0)}%</span
							>
						</div>
						<div class="h-2 w-full overflow-hidden rounded-full bg-border/30">
							<div
								class="h-full rounded-full transition-all duration-500 ease-out {isHigh
									? 'bg-gradient-to-r from-error to-error/70'
									: isMedium
										? 'bg-gradient-to-r from-warning to-warning/70'
										: 'bg-gradient-to-r from-brand to-brand/60'}"
								style="width: {Math.min(usagePercent, 100)}%"
							></div>
						</div>
					</div>

					<div class="bg-surface-subtle/50 grid grid-cols-3 gap-2 rounded-xl p-2.5 text-center">
						<div>
							<p class="text-lg font-bold text-text">{balance.budget}</p>
							<p class="text-[10px] text-text-subtle">{m.leave_balance_total_budget()}</p>
						</div>
						<div class="border-x border-border/40">
							<p class="text-lg font-bold text-text">{balance.used}</p>
							<p class="text-[10px] text-text-subtle">{m.leave_balance_used()}</p>
						</div>
						<div>
							<p class="text-lg font-bold {isHigh ? 'text-error' : 'text-success'}">{available}</p>
							<p class="text-[10px] text-text-subtle">{m.leave_balance_available_label()}</p>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
