<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type SheetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

	let {
		open = $bindable(false),
		title,
		description,
		children,
		header = undefined,
		footer = undefined,
		size = 'md',
		class: className = ''
	}: {
		open: boolean;
		title?: string;
		description?: string;
		children?: Snippet;
		header?: Snippet;
		footer?: Snippet;
		size?: SheetSize;
		class?: string;
	} = $props();

	function close() {
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	const maxWidths: Record<SheetSize, string> = {
		sm: 'sm:max-w-sm',
		md: 'sm:max-w-md',
		lg: 'sm:max-w-lg',
		xl: 'sm:max-w-xl',
		full: 'sm:max-w-full'
	};
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
		<!-- Backdrop -->
		<div
			class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-all"
			transition:fade={{ duration: 200 }}
			onclick={close}
			role="button"
			tabindex="-1"
			onkeydown={() => {}}
			aria-label="Close sheet"
		></div>

		<!-- Content -->
		<div
			class="relative flex h-full w-full flex-col bg-surface shadow-2xl {maxWidths[
				size
			]} {className}"
			transition:fly={{ x: 100, duration: 300 }}
		>
			<div class="flex items-center justify-between border-b border-border/60 px-6 py-4">
				{#if header}
					{@render header()}
				{:else}
					<div>
						<h2 class="text-lg font-bold text-text">{title}</h2>
						{#if description}
							<p class="mt-1 text-sm text-text-muted">{description}</p>
						{/if}
					</div>
				{/if}
				<button
					onclick={close}
					class="hover:bg-surface-subtle rounded-full p-2 text-text-muted transition-colors hover:text-text"
					aria-label="Close"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<div class="flex-1 overflow-y-auto px-6 py-6">
				{@render children?.()}
			</div>

			{#if footer}
				<div class="border-t border-border/60 bg-surface px-6 py-4">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
