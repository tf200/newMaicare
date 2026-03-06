<script lang="ts">
	import type { Integration } from '../types';
	import { Share2, Plus, ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { integrations }: { integrations: Integration[] } = $props();

	const cardClass =
		'group relative overflow-hidden rounded-3xl border border-border/50 bg-glass-surface p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-brand/30';
	const statusBadgeClass =
		'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ring-1';
</script>

<div class="space-y-6">
	<header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
				<Share2 class="h-5 w-5" />
			</div>
			<div>
				<h3 class="text-lg font-bold text-text">Integrations</h3>
				<p class="text-sm text-text-muted">Connect external services and sync data.</p>
			</div>
		</div>
		<Button class="gap-2">
			<Plus class="h-4 w-4" />
			Add Integration
		</Button>
	</header>

	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each integrations as integration (integration.id)}
			<div class={cardClass}>
				<div class="mb-4 flex items-start justify-between">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/5 text-brand ring-1 ring-brand/10 transition-transform group-hover:scale-110"
					>
						<Share2 class="h-6 w-6" />
					</div>

					{#if integration.status === 'connected'}
						<span
							class="{statusBadgeClass} bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400"
						>
							<CheckCircle2 class="h-3 w-3" />
							Connected
						</span>
					{:else if integration.status === 'disconnected'}
						<span
							class="{statusBadgeClass} bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400"
						>
							<AlertCircle class="h-3 w-3" />
							Disconnected
						</span>
					{:else}
						<span
							class="{statusBadgeClass} bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400"
						>
							<RefreshCw class="h-3 w-3 animate-spin" />
							Pending
						</span>
					{/if}
				</div>

				<h4 class="text-lg font-bold text-text">{integration.name}</h4>
				<p class="mt-2 text-sm text-text-muted">{integration.description}</p>

				{#if integration.lastSync}
					<div
						class="mt-4 flex items-center gap-2 text-[10px] font-bold text-text-subtle uppercase"
					>
						<RefreshCw class="h-3 w-3" />
						Last sync: {new Date(integration.lastSync).toLocaleString()}
					</div>
				{/if}

				<div class="mt-6 flex items-center gap-2">
					<Button variant="ghost" class="w-full gap-2 text-xs">
						<ExternalLink class="h-3.5 w-3.5" />
						Configure
					</Button>
				</div>
			</div>
		{/each}
	</div>
</div>
