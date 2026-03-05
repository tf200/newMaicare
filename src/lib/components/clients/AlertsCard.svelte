<script lang="ts">
	import { ShieldAlert } from 'lucide-svelte';
	import type { ClientOverviewData } from '$lib/mock/client-overview';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		alerts: ClientOverviewData['alerts'];
	}

	let { alerts }: Props = $props();
</script>

<div class="space-y-3 rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-1 flex items-center gap-2">
		<ShieldAlert class="h-5 w-5 text-text-subtle" />
		<h3 class="text-lg font-bold text-text">{m.critical_alerts()}</h3>
	</div>
	{#if alerts.length > 0}
		<div class="space-y-2">
			{#each alerts as alert (alert.label)}
				<div
					class={`flex items-center justify-between rounded-xl border p-3 ${
						alert.tone === 'danger'
							? 'border-rose-200 bg-rose-50 text-rose-700'
							: alert.tone === 'warning'
								? 'border-amber-200 bg-amber-50 text-amber-700'
								: 'border-brand-200 bg-brand-50 text-brand-700'
					}`}
				>
					<span class="text-xs font-bold">{alert.label}</span>
					<span class="rounded-full bg-white/50 px-2 py-0.5 text-[10px] font-black"
						>{alert.count}</span
					>
				</div>
			{/each}
		</div>
	{:else}
		<p class="py-4 text-center text-sm text-text-subtle italic">
			{m.no_active_alerts()}
		</p>
	{/if}
</div>
