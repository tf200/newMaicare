<script lang="ts">
	import { ShieldAlert, Home } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		title?: string;
		description?: string;
		actionLabel?: string;
		onAction?: () => void;
	}

	let {
		title = 'Access Denied',
		description = 'You do not have permission to access this page. Please contact your administrator if you believe this is an error.',
		actionLabel = 'Return to Dashboard',
		onAction
	}: Props = $props();

	const handleAction = () => {
		if (onAction) {
			onAction();
		} else {
			goto(resolve('/(app)/dashboard'));
		}
	};
</script>

<div class="flex min-h-[400px] w-full flex-col items-center justify-center p-6 text-center">
	<div
		class="relative flex max-w-md flex-col items-center rounded-3xl border border-border bg-surface/90 p-8 shadow-sm backdrop-blur-xl transition-all"
	>
		<!-- Ambient Glow Effect -->
		<div
			class="pointer-events-none absolute -top-12 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl"
		></div>

		<!-- Icon Container -->
		<div
			class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 shadow-inner ring-1 ring-rose-500/20"
		>
			<ShieldAlert class="h-8 w-8" />
		</div>

		<!-- Text Content -->
		<h2 class="mb-2 text-xl font-bold tracking-tight text-text">
			{title}
		</h2>
		<p class="mb-6 text-sm font-medium text-text-subtle leading-relaxed">
			{description}
		</p>

		<!-- Action Button -->
		<Button onclick={handleAction} class="w-full sm:w-auto">
			<Home class="h-4 w-4" />
			{actionLabel}
		</Button>
	</div>
</div>
