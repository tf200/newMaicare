<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		icon?: any;
		title: string;
		description?: string;
		primaryAction?: {
			label: string;
			onclick: () => void;
			disabled?: boolean;
		};
		secondaryAction?: {
			label: string;
			onclick: () => void;
		};
		variant?: 'default' | 'subtle' | 'dashed';
		size?: 'sm' | 'md' | 'lg';
		children?: Snippet;
	}

	let {
		icon: Icon,
		title,
		description,
		primaryAction,
		secondaryAction,
		variant = 'default',
		size = 'md',
		children
	}: Props = $props();

	const sizeClasses = {
		sm: {
			container: 'py-10',
			icon: 'h-12 w-12',
			iconBox: 'h-14 w-14',
			title: 'text-lg',
			desc: 'text-xs'
		},
		md: {
			container: 'py-16',
			icon: 'h-14 w-14',
			iconBox: 'h-20 w-20',
			title: 'text-xl',
			desc: 'text-sm'
		},
		lg: {
			container: 'py-24',
			icon: 'h-16 w-16',
			iconBox: 'h-24 w-24',
			title: 'text-2xl',
			desc: 'text-sm'
		}
	};

	const classes = $derived(sizeClasses[size]);
</script>

<div
	class="flex flex-col items-center justify-center text-center {classes.container} {variant ===
	'dashed'
		? 'rounded-3xl border border-dashed border-border bg-surface'
		: variant === 'subtle'
			? 'rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30'
			: ''}"
>
	{#if Icon}
		<div
			class="mb-5 flex items-center justify-center rounded-3xl border border-zinc-100 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-800/50 {classes.iconBox}"
		>
			<Icon class="text-text-muted {classes.icon}" />
		</div>
	{/if}

	<h3 class="font-bold tracking-tight text-text {classes.title}">
		{title}
	</h3>

	{#if description}
		<p class="mt-2 max-w-sm text-text-muted {classes.desc}">
			{description}
		</p>
	{/if}

	{#if children}
		<div class="mt-4">
			{@render children()}
		</div>
	{/if}

	{#if primaryAction || secondaryAction}
		<div class="mt-5 flex items-center gap-3">
			{#if primaryAction}
				<button
					onclick={primaryAction.onclick}
					disabled={primaryAction.disabled}
					class="inline-flex h-10 items-center gap-2 rounded-xl bg-btn-primary-bg px-5 text-sm font-semibold text-btn-primary-text shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
				>
					{primaryAction.label}
				</button>
			{/if}
			{#if secondaryAction}
				<button
					onclick={secondaryAction.onclick}
					class="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold text-text-muted transition-all hover:bg-border/30 hover:text-text active:scale-95"
				>
					{secondaryAction.label}
				</button>
			{/if}
		</div>
	{/if}
</div>
