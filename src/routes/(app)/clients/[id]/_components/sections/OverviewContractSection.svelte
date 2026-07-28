<script lang="ts">
	import { CreditCard } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import type { ClientOverviewData } from '../../overview.shared';

	interface Props {
		contractSummary: ClientOverviewData['contractSummary'];
	}

	let { contractSummary }: Props = $props();
</script>

<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-5 flex items-center gap-2">
		<CreditCard class="h-4 w-4 text-text-muted" aria-hidden="true" />
		<h2 class="text-lg font-semibold tracking-tight text-text">{m.financing_and_contract()}</h2>
	</div>
	{#if contractSummary}
		<div class="space-y-4">
			<div class="flex items-center justify-between border-b border-border/40 pb-2">
				<span class="text-xs text-text-muted">{m.status()}</span>
				<span
					class:text-success-strong={contractSummary.active}
					class:text-error-strong={!contractSummary.active}
					class="text-right text-xs font-bold">{contractSummary.status}</span
				>
			</div>
			<div class="flex items-center justify-between border-b border-border/40 pb-2">
				<span class="text-xs text-text-muted">{m.financing()}</span>
				<span class="text-right text-xs font-bold text-text"
					>{contractSummary.financing ?? m.not_available_short()}</span
				>
			</div>
			{#if contractSummary.daysUntilContractEnd !== undefined}
				<div class="flex items-center justify-between border-b border-border/40 pb-2">
					<span class="text-xs text-text-muted">{m.contract_ends_in()}</span>
					<span class="text-xs font-bold text-text">
						{#if contractSummary.daysUntilContractEnd >= 0}
							{m.contract_days_remaining({
								count: contractSummary.daysUntilContractEnd,
								unit: contractSummary.daysUntilContractEnd === 1 ? m.day_lower() : m.days_lower()
							})}
						{:else}
							{m.contract_expired_days_ago({
								count: Math.abs(contractSummary.daysUntilContractEnd),
								unit:
									Math.abs(contractSummary.daysUntilContractEnd) === 1
										? m.day_lower()
										: m.days_lower()
							})}
						{/if}
					</span>
				</div>
			{/if}
		</div>
	{:else}
		<p class="text-sm text-text-subtle italic">{m.no_contract_data_available()}</p>
	{/if}
</section>
