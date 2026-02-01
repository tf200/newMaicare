<script lang="ts">
	import { page } from '$app/state';
	import { locales, getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { Globe, Check, ChevronDown } from 'lucide-svelte';
	import { fly, fade } from 'svelte/transition';

	/**
	 * LanguageSwitcher component
	 * Polished dropdown for switching between available locales using Paraglide.
	 */

	let isOpen = $state(false);

	// Get the current locale from Paraglide runtime
	const currentLocale = $derived(getLocale());

	// Map of locale codes to display names
	const localeNames: Record<string, string> = {
		en: 'English',
		nl: 'Nederlands'
	};

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	// Handle clicks outside and Escape key to close the dropdown
	function handleOutsideClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (isOpen && !target.closest('.language-switcher')) {
			closeDropdown();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (isOpen && event.key === 'Escape') {
			closeDropdown();
		}
	}
</script>

<svelte:window onclick={handleOutsideClick} onkeydown={handleKeydown} />

<div class="language-switcher relative inline-block text-left">
	<button
		type="button"
		class="group flex items-center gap-2.5 rounded-xl border border-zinc-200/50 bg-white/40 px-3.5 py-2 text-sm font-bold tracking-wide text-zinc-700 shadow-sm backdrop-blur-md transition-all hover:border-teal-500/30 hover:bg-white/60 hover:text-zinc-900 focus:ring-4 focus:ring-teal-500 focus:outline-none dark:border-zinc-800/50 dark:bg-zinc-900/40 dark:text-zinc-300 dark:hover:border-teal-400/30 dark:hover:bg-zinc-900/60 dark:hover:text-white"
		onclick={toggleDropdown}
		aria-expanded={isOpen}
		aria-haspopup="true"
		aria-label="Select language"
	>
		<div class="relative flex items-center justify-center">
			<Globe
				class="h-4 w-4 text-zinc-400 transition-colors duration-300 group-hover:text-teal-500 dark:text-zinc-500 dark:group-hover:text-teal-400"
			/>
			{#if isOpen}
				<span
					class="absolute -top-1 -right-1 h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]"
				></span>
			{/if}
		</div>

		<span class="uppercase">{currentLocale}</span>

		<ChevronDown
			class="h-3.5 w-3.5 text-zinc-400 transition-transform duration-300 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 {isOpen
				? 'rotate-180'
				: ''}"
		/>
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 mt-2.5 w-48 origin-top-right overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/90 p-1.5 shadow-2xl backdrop-blur-2xl focus:outline-none dark:border-zinc-800/60 dark:bg-zinc-900/95"
			role="menu"
			aria-orientation="vertical"
			in:fly={{ y: -8, duration: 250, opacity: 0 }}
			out:fade={{ duration: 150 }}
		>
			<div
				class="mb-1 px-3 py-2 text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500"
			>
				Select Language
			</div>

			{#each locales as locale (locale)}
				{@const active = currentLocale === locale}
				<a
					href={localizeHref(page.url.pathname, { locale })}
					class="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all {active
						? 'bg-teal-50/80 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400'
						: 'text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100'}"
					role="menuitem"
					onclick={closeDropdown}
				>
					<div class="flex items-center gap-3">
						<div
							class="flex h-6 w-6 items-center justify-center rounded-lg border border-zinc-200/50 bg-white/50 text-[10px] font-bold uppercase transition-colors group-hover:border-teal-500/20 dark:border-zinc-700/50 dark:bg-zinc-800/50"
						>
							{locale}
						</div>
						<span class="font-bold">{localeNames[locale] || locale}</span>
					</div>
					{#if active}
						<Check class="h-4 w-4" />
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Custom focus ring for browsers that support focus-visible */
	.language-switcher button:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 4px rgba(20, 184, 166, 0.1),
			0 1px 2px 0 rgba(0, 0, 0, 0.05);
	}
</style>
