<script lang="ts">
	let { checked = $bindable(false), label, description, disabled = false } = $props();
</script>

<div class="flex items-center justify-between gap-4">
	{#if label}
		<div class="flex flex-col">
			<span class="text-sm font-semibold text-zinc-900 dark:text-white">{label}</span>
			{#if description}
				<span class="text-xs text-zinc-500 dark:text-zinc-400">{description}</span>
			{/if}
		</div>
	{/if}

	<button
		type="button"
		role="switch"
		aria-checked={checked}
		{disabled}
		onclick={() => !disabled && (checked = !checked)}
		class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-teal-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50
        {checked ? 'bg-teal-600' : 'bg-zinc-200 dark:bg-zinc-700'}"
	>
		<span class="sr-only">Use setting</span>
		<span
			aria-hidden="true"
			class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
            {checked ? 'translate-x-5' : 'translate-x-0'}"
		></span>
	</button>
</div>
