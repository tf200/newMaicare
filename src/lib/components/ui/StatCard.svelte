<script lang="ts">
	interface Props {
		label: string;
		value: string | number;
		description?: string;
		icon?: any;
		iconPosition?: 'background' | 'inline';
		valueColor?: string;
		iconColor?: string;
		hoverBorderColor?: string;
		loading?: boolean;
	}

	let {
		label,
		value,
		description,
		icon: Icon,
		iconPosition = 'background',
		valueColor = 'text-text',
		iconColor = 'text-brand',
		hoverBorderColor = '',
		loading = false
	}: Props = $props();

	const containerClass = $derived(
		[
			'group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm',
			hoverBorderColor ? `transition-colors ${hoverBorderColor}` : ''
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

{#if loading}
	<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
		<div class="h-3 w-24 animate-pulse rounded bg-border/70"></div>
		<div class="mt-3 h-8 w-16 animate-pulse rounded bg-border/70"></div>
		{#if description}
			<div class="mt-3 h-3 w-36 animate-pulse rounded bg-border/70"></div>
		{/if}
	</div>
{:else}
	<div class={containerClass}>
		{#if Icon && iconPosition === 'background'}
			<div
				class="absolute -right-4 -bottom-4 {iconColor} opacity-[0.03] transition-opacity group-hover:opacity-10"
			>
				<Icon class="h-32 w-32" />
			</div>
		{/if}
		<div class="relative">
			{#if Icon && iconPosition === 'inline'}
				<div class="flex items-center justify-between">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{label}
					</div>
					<Icon class="h-4 w-4 {iconColor}" />
				</div>
			{:else}
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					{label}
				</div>
			{/if}
			<div class="mt-2 text-2xl font-bold tracking-tight {valueColor} sm:text-3xl">
				{value}
			</div>
			{#if description}
				<p class="mt-2 text-xs font-medium text-text-muted">{description}</p>
			{/if}
		</div>
	</div>
{/if}
