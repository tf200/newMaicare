<script lang="ts">
	import { fly } from 'svelte/transition';
	import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		message: string | null;
		type?: 'success' | 'warning' | 'error';
		onClose?: () => void;
	}

	let { message, type = 'success', onClose }: Props = $props();

	const icons = {
		success: CheckCircle2,
		warning: AlertTriangle,
		error: AlertCircle
	};

	const styles = {
		success:
			'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-400',
		warning:
			'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/90 dark:text-amber-400',
		error:
			'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/90 dark:text-red-400'
	};

	const iconStyles = {
		success: 'text-emerald-600 dark:text-emerald-500',
		warning: 'text-amber-600 dark:text-amber-500',
		error: 'text-red-600 dark:text-red-500'
	};
</script>

{#if message}
	{@const Icon = icons[type]}
	<div
		role="alert"
		class="fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-medium shadow-xl {styles[
			type
		]}"
		transition:fly={{ y: 20, duration: 300 }}
	>
		<Icon class="h-5 w-5 {iconStyles[type]}" />
		<span>{message}</span>

		{#if onClose}
			<button
				type="button"
				onclick={onClose}
				class="-mr-1 ml-1 rounded-full p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
				aria-label={m.close()}
			>
				<X class="h-4 w-4" />
			</button>
		{/if}
	</div>
{/if}
