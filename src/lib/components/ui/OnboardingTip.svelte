<script lang="ts">
	import { onboarding } from '$lib/state/onboarding.svelte';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { m } from '$lib/paraglide/messages';
	import { X } from 'lucide-svelte';

	interface Props {
		id: string;
		content: string;
		learnMoreHref?: string;
		position?: 'top' | 'bottom' | 'left' | 'right';
		children: import('svelte').Snippet;
	}

	let { id, content, learnMoreHref, position = 'bottom', children }: Props = $props();

	// svelte-ignore state_referenced_locally
	let visible = $state(!onboarding.hasSeenTooltip(id));
	let triggerNode: HTMLElement | undefined = $state();
	let tipNode: HTMLElement | undefined = $state();
	let coords = $state({ top: -9999, left: -9999 });

	function show() {
		if (!onboarding.hasSeenTooltip(id)) {
			visible = true;
			updatePosition();
		}
	}

	function dismiss() {
		visible = false;
	}

	function dismissForever() {
		onboarding.markTooltipSeen(id);
		visible = false;
	}

	function getBaseCoords(rect: DOMRect) {
		const gap = 10;
		let top = 0;
		let left = 0;

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
			top = rect.bottom + gap;
			left = rect.left + rect.width / 2;
		}

		return { top, left };
	}

	function updatePosition() {
		if (!triggerNode) return;
		coords = getBaseCoords(triggerNode.getBoundingClientRect());
	}

	$effect(() => {
		if (visible && tipNode && triggerNode) {
			const rect = tipNode.getBoundingClientRect();
			const padding = 12;
			const { innerWidth, innerHeight } = window;
			let { top, left } = getBaseCoords(triggerNode.getBoundingClientRect());

			if (position === 'left' || position === 'right') {
				const halfHeight = rect.height / 2;
				if (top - halfHeight < padding) top = padding + halfHeight;
				if (top + halfHeight > innerHeight - padding) top = innerHeight - padding - halfHeight;
			} else {
				const halfWidth = rect.width / 2;
				if (left - halfWidth < padding) left = padding + halfWidth;
				if (left + halfWidth > innerWidth - padding) left = innerWidth - padding - halfWidth;
			}

			coords = { top, left };
		}
	});

	const transformStyle = $derived(
		position === 'left'
			? '-100%, -50%'
			: position === 'right'
				? '0, -50%'
				: position === 'top'
					? '-50%, -100%'
					: '-50%, 0'
	);
</script>

<div
	class="block w-full"
	role="presentation"
	onmouseenter={show}
	onfocusin={show}
	bind:this={triggerNode}
>
	{@render children()}
</div>

{#if visible}
	<div
		role="tooltip"
		bind:this={tipNode}
		class="pointer-events-auto fixed z-[9999] max-w-xs rounded-2xl border border-border/60 bg-surface p-3.5 shadow-xl"
		style="top: {coords.top}px; left: {coords.left}px; transform: translate({transformStyle});"
		in:fly={{ y: 4, duration: 200, easing: cubicOut }}
		out:fade={{ duration: 150 }}
	>
		<button
			onclick={dismiss}
			class="absolute top-2 right-2 rounded-full p-1 text-text-subtle transition-colors hover:bg-border/50 hover:text-text"
			aria-label={m.tooltip_dismiss()}
		>
			<X class="h-3.5 w-3.5" />
		</button>

		<p class="pr-5 text-xs leading-relaxed font-medium text-text">{content}</p>

		<div class="mt-2 flex items-center gap-3">
			{#if learnMoreHref}
				<a
					href={learnMoreHref}
					class="text-xs font-semibold text-brand transition-colors hover:text-brand/80"
				>
					{m.tooltip_learn_more()}
				</a>
			{/if}
			<button
				onclick={dismissForever}
				class="text-xs font-medium text-text-subtle transition-colors hover:text-text-muted"
			>
				{m.tooltip_dont_show()}
			</button>
		</div>
	</div>
{/if}
