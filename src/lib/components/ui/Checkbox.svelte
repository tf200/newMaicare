<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'type' | 'checked'> {
		label?: string;
		error?: string;
		checked?: boolean;
	}

	let { label, error, checked = $bindable(false), class: className, ...props }: Props = $props();
</script>

<div class="space-y-2">
	<label class="flex cursor-pointer items-center gap-3">
		<div class="relative flex h-6 w-6 shrink-0 items-center justify-center">
			<input
				{...props}
				type="checkbox"
				bind:checked
				class="peer h-full w-full appearance-none rounded-lg border-2 border-border bg-surface transition-all checked:border-brand checked:bg-brand focus:ring-2 focus:ring-brand/20 {className}"
			/>
			<svg
				class="pointer-events-none absolute h-4 w-4 scale-0 text-white transition-transform peer-checked:scale-100"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="3"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
			</svg>
		</div>
		{#if label}
			<span class="text-sm font-semibold text-text-muted">
				{label}
			</span>
		{/if}
	</label>
	{#if error}
		<p class="ml-1 text-xs font-medium text-error">{error}</p>
	{/if}
</div>
