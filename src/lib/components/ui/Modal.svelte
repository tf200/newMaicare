<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { X } from 'lucide-svelte';

	let {
		open = $bindable(false),
		title,
		description,
		children,
		footer,
		class: className = ''
	} = $props();

	function close() {
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
		role="dialog"
		aria-modal="true"
	>
		<!-- Backdrop -->
		<div
			class="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm transition-all"
			transition:fade={{ duration: 200 }}
			onclick={close}
			role="button"
			tabindex="-1"
			onkeydown={() => {}}
		></div>

		<!-- Content -->
		<div
			class="relative w-full max-w-lg rounded-3xl bg-surface shadow-2xl ring-1 ring-border {className}"
			transition:scale={{ start: 0.95, duration: 200 }}
		>
			<div class="flex items-center justify-between rounded-t-3xl border-b border-border px-6 py-4">
				<div>
					<h2 class="text-lg font-bold text-text">{title}</h2>
					{#if description}
						<p class="text-sm text-text-muted">{description}</p>
					{/if}
				</div>
				<button
					onclick={close}
					class="rounded-full p-2 text-text-subtle transition-colors hover:bg-border/50 hover:text-text"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<div class="p-6">
				{@render children?.()}
			</div>

			{#if footer}
				<div class="rounded-b-3xl border-t border-border bg-bg/50 px-6 py-4">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
