<script lang="ts">
	import { AlertTriangle, Bell, BellOff, ChevronRight } from 'lucide-svelte';
	import type { ClientOverviewData } from '$lib/mock/client-overview';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		alerts: ClientOverviewData['alerts'];
	}

	let { alerts }: Props = $props();

	const toneStyles = {
		danger: 'bg-rose-500 text-white ring-rose-500/20',
		warning: 'bg-amber-500 text-white ring-amber-500/20',
		brand: 'bg-brand text-white ring-brand/20'
	};

	const iconStyles = {
		danger: 'text-rose-600 bg-rose-50',
		warning: 'text-amber-600 bg-amber-50',
		brand: 'text-brand bg-brand/10'
	};

	const arrowStyles = {
		danger: 'text-rose-300 group-hover:text-rose-500',
		warning: 'text-amber-300 group-hover:text-amber-500',
		brand: 'text-brand/30 group-hover:text-brand'
	};
</script>

<div
	class="flex flex-col rounded-3xl border border-rose-200 bg-rose-50/30 p-6 shadow-sm ring-1 ring-rose-500/5"
>
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
				<Bell class="h-5 w-5" />
			</div>
			<h3 class="text-lg font-bold text-text">{m.critical_alerts()}</h3>
		</div>
		{#if alerts.length > 0}
			<span class="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
				{alerts.length}
			</span>
		{/if}
	</div>

	{#if alerts.length > 0}
		<div class="flex-1 space-y-1">
			{#each alerts as alert (alert.id)}
				<div
					class="group flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-white/50"
				>
					<div
						class={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyles[alert.tone]}`}
					>
						<AlertTriangle class="h-5 w-5" />
					</div>
					<div class="flex flex-1 flex-col min-w-0">
						<span class="truncate text-sm font-bold text-text">{alert.label}</span>
						<span class="text-xs text-text-subtle">Requires attention</span>
					</div>
					<div class="flex items-center gap-3">
						{#if alert.count > 1}
							<span
								class={`flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ring-4 ${toneStyles[alert.tone]}`}
							>
								{alert.count}
							</span>
						{/if}
						<ChevronRight
							class={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${arrowStyles[alert.tone]}`}
						/>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex flex-1 flex-col items-center justify-center py-8 text-center">
			<div
				class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-500"
			>
				<BellOff class="h-6 w-6" />
			</div>
			<p class="text-sm font-medium text-text-subtle">
				{m.no_active_alerts()}
			</p>
		</div>
	{/if}
</div>
