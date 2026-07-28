<script lang="ts">
	import { AlertTriangle, Bell, BellOff } from 'lucide-svelte';
	import type { ClientOverviewData } from '../../overview.shared';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		alerts: ClientOverviewData['alerts'];
	}

	let { alerts }: Props = $props();

	const toneStyles = {
		danger: 'bg-error text-white ring-error/20',
		warning: 'bg-warning text-text ring-warning/20',
		brand: 'bg-brand text-btn-primary-text ring-brand/20'
	};

	const iconStyles = {
		danger: 'text-error-strong bg-error/10',
		warning: 'text-warning-strong bg-warning/10',
		brand: 'text-brand bg-brand/10'
	};
</script>

<section class="flex flex-col rounded-3xl border border-border bg-surface p-6 shadow-sm">
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10 text-error-strong"
			>
				<Bell class="h-5 w-5" aria-hidden="true" />
			</div>
			<h2 class="text-lg font-semibold tracking-tight text-text">{m.client_overview_alerts()}</h2>
		</div>
		{#if alerts.length > 0}
			<span class="rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-bold text-error-strong">
				{alerts.length}
			</span>
		{/if}
	</div>

	{#if alerts.length > 0}
		<div class="flex-1 space-y-1">
			{#each alerts as alert (alert.id)}
				<div class="flex items-center gap-4 rounded-2xl p-2">
					<div
						class={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyles[alert.tone]}`}
					>
						<AlertTriangle class="h-5 w-5" aria-hidden="true" />
					</div>
					<div class="flex min-w-0 flex-1 flex-col">
						<span class="truncate text-sm font-bold text-text">{alert.label}</span>
						<span class="text-xs text-text-muted">{m.requires_attention()}</span>
					</div>
					<div class="flex items-center gap-3">
						{#if alert.count > 1}
							<span
								class={`flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ring-4 ${toneStyles[alert.tone]}`}
							>
								{alert.count}
							</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex flex-1 flex-col items-center justify-center py-8 text-center">
			<div
				class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success-strong"
			>
				<BellOff class="h-6 w-6" aria-hidden="true" />
			</div>
			<p class="text-sm font-medium text-text-subtle">
				{m.no_active_alerts()}
			</p>
		</div>
	{/if}
</section>
