<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { X } from 'lucide-svelte';

	type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';

	let {
		open = $bindable(false),
		title,
		description,
		children,
		header = undefined,
		footer = undefined,
		size = 'md' as ModalSize,
		class: className = ''
	} = $props();

	function close() {
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	const maxWidths: Record<ModalSize, string> = {
		sm: 'max-w-sm',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
		'2xl': 'max-w-5xl',
		'4xl': 'max-w-7xl',
		full: 'max-w-[95vw]'
	};
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
			class="relative flex max-h-[90vh] w-full flex-col rounded-3xl bg-surface shadow-2xl ring-1 ring-border {maxWidths[
				size
			]} {className}"
			transition:scale={{ start: 0.95, duration: 200 }}
		>
			<div class="flex items-center justify-between rounded-t-3xl border-b border-border px-6 py-4">
				{#if header}
					{@render header()}
				{:else}
					<div>
						<h2 class="text-lg font-bold text-text">{title}</h2>
						{#if description}
							<p class="text-sm text-text-muted">{description}</p>
						{/if}
					</div>
				{/if}
				<button
					onclick={close}
					class="rounded-full p-2 text-text-subtle transition-colors hover:bg-border/50 hover:text-text"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<div class="flex-1 overflow-y-auto p-6">
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
