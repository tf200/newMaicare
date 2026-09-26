<script lang="ts">
	import type { ComponentType } from 'svelte';

	type StatCardColor =
		'neutral' | 'emerald' | 'amber' | 'rose' | 'slate' | 'brand' | 'secondary' | 'blue' | 'cyan';

	interface ColorConfig {
		hoverBorder: string;
		iconColor: string;
		valueColor: string;
		iconOpacity: string;
	}

	const colorMap: Record<StatCardColor, ColorConfig> = {
		neutral: {
			hoverBorder: '',
			iconColor: 'text-text',
			valueColor: 'text-text',
			iconOpacity: 'opacity-[0.03]'
		},
		emerald: {
			hoverBorder: 'hover:border-success/30',
			iconColor: 'text-success-strong',
			valueColor: 'text-success-strong',
			iconOpacity: 'opacity-[0.03] group-hover:opacity-10'
		},
		amber: {
			hoverBorder: 'hover:border-warning/30',
			iconColor: 'text-warning-strong',
			valueColor: 'text-warning-strong',
			iconOpacity: 'opacity-[0.03] group-hover:opacity-10'
		},
		rose: {
			hoverBorder: 'hover:border-error/30',
			iconColor: 'text-error-strong',
			valueColor: 'text-error-strong',
			iconOpacity: 'opacity-[0.03] group-hover:opacity-10'
		},
		slate: {
			hoverBorder: 'hover:border-border',
			iconColor: 'text-text-muted',
			valueColor: 'text-text',
			iconOpacity: 'opacity-[0.03] group-hover:opacity-10'
		},
		brand: {
			hoverBorder: 'hover:border-brand/30',
			iconColor: 'text-brand-strong',
			valueColor: 'text-text',
			iconOpacity: 'opacity-[0.03] group-hover:opacity-10'
		},
		secondary: {
			hoverBorder: 'hover:border-secondary/30',
			iconColor: 'text-secondary-strong',
			valueColor: 'text-text',
			iconOpacity: 'opacity-[0.03] group-hover:opacity-10'
		},
		blue: {
			hoverBorder: 'hover:border-info/30',
			iconColor: 'text-info-strong',
			valueColor: 'text-text',
			iconOpacity: 'opacity-[0.03] group-hover:opacity-10'
		},
		cyan: {
			hoverBorder: 'hover:border-info/30',
			iconColor: 'text-info-strong',
			valueColor: 'text-text',
			iconOpacity: 'opacity-[0.03] group-hover:opacity-10'
		}
	};

	interface Props {
		label: string;
		value: string | number;
		description?: string;
		icon?: ComponentType;
		color?: StatCardColor;
		valueAccent?: boolean;
		children?: import('svelte').Snippet;
	}

	let {
		label,
		value,
		description,
		icon: Icon,
		color = 'neutral',
		valueAccent,
		children
	}: Props = $props();

	const colors = $derived(colorMap[color]);
	const hasHover = $derived(color !== 'neutral');
	const resolvedValueAccent = $derived(valueAccent ?? color !== 'neutral');
</script>

<div
	class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm {hasHover
		? 'group transition-colors ' + colors.hoverBorder
		: ''}"
>
	{#if Icon}
		<div
			class="absolute -right-4 -bottom-4 {colors.iconColor} {colors.iconOpacity} transition-opacity"
		>
			<Icon class="h-32 w-32" />
		</div>
	{/if}
	<div class="relative">
		<div class="text-xs font-semibold text-text-muted">
			{label}
		</div>
		<div
			class="mt-2 text-2xl font-bold tracking-tight sm:text-3xl {resolvedValueAccent
				? colors.valueColor
				: 'text-text'}"
		>
			{value}
		</div>
		{#if description}
			<p class="mt-2 text-xs font-medium text-text-muted">{description}</p>
		{/if}
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
