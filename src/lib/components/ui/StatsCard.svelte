<script lang="ts">
	import type { Component } from 'svelte';

	type Variant = 'watermark' | 'accent-line';

	interface Props {
		label: string;
		value: string | number;
		sub?: string;
		icon: any;
		color?: string;
		valueColor?: string;
		hoverBorder?: string;
		variant?: Variant;
		accentLineColor?: string;
		class?: string;
	}

	let {
		label,
		value,
		sub,
		icon: Icon,
		color = 'text-brand',
		valueColor = 'text-text',
		hoverBorder = 'hover:border-brand/30',
		variant = 'watermark',
		accentLineColor = 'bg-brand',
		class: className = ''
	}: Props = $props();
</script>

{#if variant === 'accent-line'}
	<div
		class="group relative overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:shadow-md {className}"
	>
		<!-- Top accent line -->
		<div class="h-1 {accentLineColor} opacity-60"></div>

		<div class="p-5">
			<div class="flex items-start justify-between">
				<div class="space-y-1.5">
					<div class="text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">
						{label}
					</div>
					<div class="flex items-baseline gap-1.5">
						<span class="text-2xl font-extrabold tracking-tight {valueColor}">{value}</span>
					</div>
					{#if sub}
						<div class="text-[11px] font-medium text-text-subtle">{sub}</div>
					{/if}
				</div>
				<div
					class="flex h-9 w-9 items-center justify-center rounded-xl bg-border/40 {color} opacity-50 transition-opacity group-hover:opacity-100"
				>
					<Icon class="h-4 w-4" />
				</div>
			</div>
		</div>
	</div>
{:else}
	<div
		class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors {hoverBorder} {className}"
	>
		<div
			class="absolute -right-4 -bottom-4 {color} opacity-[0.03] transition-opacity group-hover:opacity-10 dark:opacity-5"
		>
			<Icon class="h-32 w-32" />
		</div>
		<div class="relative">
			<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				{label}
			</div>
			<div class="mt-2 text-2xl font-bold tracking-tight sm:text-3xl {valueColor}">
				{value}
			</div>
			{#if sub}
				<p class="mt-2 text-xs font-medium text-text-muted">{sub}</p>
			{/if}
		</div>
	</div>
{/if}
