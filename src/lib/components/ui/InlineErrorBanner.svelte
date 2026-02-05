<script lang="ts">
	import { AlertTriangle } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';

	type Props = {
		title?: string;
		message: string;
		actionLabel?: string;
		onRetry?: () => void;
	};

	let { title = 'Unable to load data', message, actionLabel = 'Retry', onRetry }: Props = $props();
</script>

<div class="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm">
	<div class="flex flex-wrap items-center gap-3">
		<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-error/15 text-error">
			<AlertTriangle class="h-5 w-5" />
		</div>
		<div class="min-w-[200px] flex-1 space-y-0.5">
			<p class="text-sm font-semibold text-error">{title}</p>
			<p class="text-sm text-text-muted">{message}</p>
		</div>
		{#if onRetry}
			<Button variant="ghost" class="h-9 px-4 text-sm" onclick={onRetry}>
				{actionLabel}
			</Button>
		{/if}
	</div>
</div>
