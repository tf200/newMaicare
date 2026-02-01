<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		children?: import('svelte').Snippet;
		content: string;
		position?: 'top' | 'bottom' | 'left' | 'right';
		delay?: number;
		disabled?: boolean;
	}

	let { children, content, position = 'right', delay = 300, disabled = false }: Props = $props();

	let visible = $state(false);
	let timeout: ReturnType<typeof setTimeout>;
	let triggerNode: HTMLElement | undefined = $state();
	let tooltipNode: HTMLElement | undefined = $state();

	// Default to off-screen to avoid flash
	let coords = $state({ top: -9999, left: -9999 });

	function show() {
		if (disabled) return;
		timeout = setTimeout(() => {
			visible = true;
			// We calculate initially based on trigger
			updatePosition();
		}, delay);
	}

	function hide() {
		clearTimeout(timeout);
		visible = false;
	}

	function getBaseCoords(rect: DOMRect) {
		const gap = 10;
		let top = 0;
		let left = 0;

		// Initial placement logic
		if (position === 'right') {
			top = rect.top + rect.height / 2;
			left = rect.right + gap;
		} else if (position === 'left') {
			top = rect.top + rect.height / 2;
			left = rect.left - gap;
		} else if (position === 'top') {
			top = rect.top - gap;
			left = rect.left + rect.width / 2;
		} else {
			// bottom
			top = rect.bottom + gap;
			left = rect.left + rect.width / 2;
		}

		return { top, left };
	}

	function updatePosition() {
		if (!triggerNode) return;
		coords = getBaseCoords(triggerNode.getBoundingClientRect());
	}

	// Adjust position once rendered to prevent overflow
	$effect(() => {
		if (visible && tooltipNode && triggerNode) {
			const rect = tooltipNode.getBoundingClientRect();
			const padding = 10;
			const { innerWidth, innerHeight } = window;
			let { top, left } = getBaseCoords(triggerNode.getBoundingClientRect());

			// Horizontal Clamping
			// If positioning left/right, we are centered vertically (transform: -50% Y)
			if (position === 'left' || position === 'right') {
				const halfHeight = rect.height / 2;
				if (top - halfHeight < padding) top = padding + halfHeight;
				if (top + halfHeight > innerHeight - padding) top = innerHeight - padding - halfHeight;
			}
			// If positioning top/bottom, we are centered horizontally (transform: -50% X)
			else {
				const halfWidth = rect.width / 2;
				if (left - halfWidth < padding) left = padding + halfWidth;
				if (left + halfWidth > innerWidth - padding) left = innerWidth - padding - halfWidth;
			}

			// Screen Edge Flipping (Simple version)
			// Logic depends on the CSS transform applied (which depends on 'position' prop)

			// CASE: Prop is RIGHT (Transform: 0, -50%)
			if (position === 'right' && left + rect.width > innerWidth - padding) {
				const triggerRect = triggerNode?.getBoundingClientRect();
				if (triggerRect) {
					// Move to left of trigger
					// Since transform is 0 (anchored left), we subtract width to simulate right anchor
					left = triggerRect.left - 10 - rect.width;
				}
			}

			// CASE: Prop is LEFT (Transform: -100%, -50%)
			if (position === 'left' && left - rect.width < padding) {
				// left here is the anchor (right edge of tooltip)
				const triggerRect = triggerNode?.getBoundingClientRect();
				if (triggerRect) {
					// Move to right of trigger
					// Since transform is -100% (anchored right), we add width to simulate left anchor
					left = triggerRect.right + 10 + rect.width;
				}
			}

			// Apply adjustments
			coords = { top, left };
		}
	});
</script>

<div
	class="block w-full"
	onmouseenter={show}
	onmouseleave={hide}
	onfocusin={show}
	onfocusout={hide}
	bind:this={triggerNode}
>
	{@render children?.()}
</div>

{#if visible && !disabled}
	<div
		role="tooltip"
		bind:this={tooltipNode}
		class="pointer-events-none fixed z-[9999] rounded-lg border border-border/30 bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-xl dark:bg-zinc-100 dark:text-zinc-900"
		style="top: {coords.top}px; left: {coords.left}px; transform: translate({position === 'left'
			? '-100%, -50%'
			: position === 'right'
				? '0, -50%'
				: position === 'top'
					? '-50%, -100%'
					: '-50%, 0'});"
		in:fly={{ y: 2, duration: 200, easing: cubicOut }}
		out:fade={{ duration: 150 }}
	>
		{content}
	</div>
{/if}
