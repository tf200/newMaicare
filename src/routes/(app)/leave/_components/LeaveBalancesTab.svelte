<script lang="ts">
	import { m } from '$lib/paraglide/messages';

	type LeaveBalance = {
		year: number;
		legal_total_days: number;
		legal_used_days: number;
		legal_remaining_days: number;
		extra_total_days: number;
		extra_used_days: number;
		extra_remaining_days: number;
		total_remaining_days: number;
	};

	type Props = {
		balances: LeaveBalance[];
	};

	let { balances }: Props = $props();

	const formatDays = (n: number) =>
		new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n);

	function barColor(remaining: number, total: number): string {
		if (total === 0) return 'bg-border';
		const pct = remaining / total;
		if (pct <= 0.2) return 'bg-error';
		if (pct <= 0.4) return 'bg-warning';
		return 'bg-brand';
	}

	function textColor(remaining: number, total: number): string {
		if (total === 0) return 'text-text-muted';
		const pct = remaining / total;
		if (pct <= 0.2) return 'text-error';
		if (pct <= 0.4) return 'text-warning';
		return 'text-text';
	}
</script>

{#if balances.length > 0}
	<div class="animate-in fade-in slide-in-from-bottom-2 space-y-6">
		<h2 class="text-sm font-semibold text-text">{m.leave_balance_heading()}</h2>

		<div class="space-y-4">
			{#each balances as balance (balance.year)}
				<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
					<div class="flex items-baseline justify-between">
						<div class="flex-1 text-center">
							<p
								class="{textColor(
									balance.total_remaining_days,
									balance.legal_total_days + balance.extra_total_days
								)} text-5xl font-bold tracking-tight"
							>
								{formatDays(balance.total_remaining_days)}
							</p>
							<p class="mt-1 text-sm text-text-muted">{m.leave_balance_days_remaining()}</p>
						</div>
						<span
							class="bg-surface-subtle inline-flex items-center rounded-lg border border-border px-2 py-0.5 text-xs font-semibold text-text-muted"
						>
							{balance.year}
						</span>
					</div>

					<div class="mt-6 grid gap-5 sm:grid-cols-2">
						{@render balanceBlock(
							m.leave_balance_legal(),
							balance.legal_remaining_days,
							balance.legal_total_days,
							balance.legal_used_days
						)}
						{@render balanceBlock(
							m.leave_balance_extra(),
							balance.extra_remaining_days,
							balance.extra_total_days,
							balance.extra_used_days
						)}
					</div>
				</div>
			{/each}
		</div>
	</div>
{:else}
	<div class="animate-in fade-in slide-in-from-bottom-2">
		<div class="rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
			<p class="text-sm text-text-muted">{m.leave_balance_heading()}</p>
		</div>
	</div>
{/if}

{#snippet balanceBlock(label: string, remaining: number, total: number, used: number)}
	{@const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0}
	<div class="space-y-3">
		<div class="flex items-baseline justify-between">
			<span class="text-sm font-semibold text-text">{label}</span>
			<span class="text-xs text-text-muted"
				>{formatDays(remaining)} {m.leave_balance_remaining()}</span
			>
		</div>
		<div class="h-3 w-full overflow-hidden rounded-full bg-border/30">
			<div
				class="h-full rounded-full transition-all duration-500 {barColor(remaining, total)}"
				style="width: {pct}%"
			></div>
		</div>
		<div class="flex items-center justify-between text-xs text-text-muted">
			<span>
				<span class="font-semibold text-text">{formatDays(used)}</span>
				{m.leave_balance_used_label()}
			</span>
			<span>
				<span class="font-semibold text-text">{formatDays(total)}</span>
				{m.leave_balance_total()}
			</span>
		</div>
	</div>
{/snippet}
