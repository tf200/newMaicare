<script lang="ts">
	import { scale, fade } from 'svelte/transition';
	import type { Snippet } from 'svelte';

	interface Props {
		trigger: Snippet;
		content: Snippet;
		align?: 'left' | 'right';
		width?: string;
		class?: string;
	}

	let {
		trigger,
		content,
		align = 'right',
		width = 'w-56',
		class: className = ''
	}: Props = $props();

	let isOpen = $state(false);
	let container: HTMLDivElement;

	function toggle() {
		isOpen = !isOpen;
	}

	function close() {
		isOpen = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			close();
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (isOpen && container && !container.contains(event.target as Node)) {
			close();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} onclick={handleClickOutside} />

<div class="relative inline-block {className}" bind:this={container}>
	<div
		role="button"
		tabindex="0"
		onclick={toggle}
		onkeydown={(e) => e.key === 'Enter' && toggle()}
		class="cursor-pointer focus:outline-none"
	>
		{@render trigger()}
	</div>

	{#if isOpen}
		<div
			transition:scale={{ start: 0.95, duration: 150, opacity: 0 }}
			class="absolute top-full z-50 mt-2 {width} origin-top-{align} rounded-2xl border border-border/60 bg-glass-surface p-1.5 shadow-xl backdrop-blur-xl {align ===
			'right'
				? 'right-0'
				: 'left-0'}"
		>
			<div class="flex flex-col gap-0.5" onclick={close} role="presentation">
				{@render content()}
			</div>
		</div>
	{/if}
</div>
