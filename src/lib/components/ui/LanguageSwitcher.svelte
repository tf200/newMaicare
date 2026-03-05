<script lang="ts">
	import { page } from '$app/state';
	import { locales, getLocale, localizeHref, setLocale } from '$lib/paraglide/runtime';
	import { Globe, Check, ChevronDown } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
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
		en: m.language_name_en(),
		nl: m.language_name_nl()
	};

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	function handleLocaleSwitch(event: MouseEvent, locale: string) {
		event.preventDefault();
		closeDropdown();

		if (locale === currentLocale) {
			return;
		}

		setLocale(locale as (typeof locales)[number]);
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
		class="group flex items-center gap-2.5 rounded-xl border border-border/50 bg-glass-surface px-3.5 py-2 text-sm font-bold tracking-wide text-text-muted shadow-sm backdrop-blur-md transition-all hover:border-brand/30 hover:text-text focus:ring-4 focus:ring-brand focus:outline-none"
		onclick={toggleDropdown}
		aria-expanded={isOpen}
		aria-haspopup="true"
		aria-label={m.select_language()}
	>
		<div class="relative flex items-center justify-center">
			<Globe
				class="h-4 w-4 text-text-subtle transition-colors duration-300 group-hover:text-brand"
			/>
			{#if isOpen}
				<span
					class="absolute -top-1 -right-1 h-1.5 w-1.5 animate-pulse rounded-full bg-brand shadow-[0_0_8px_theme(colors.brand-strong/60%)]"
				></span>
			{/if}
		</div>

		<span class="uppercase">{currentLocale}</span>

		<ChevronDown
			class="h-3.5 w-3.5 text-text-subtle transition-transform duration-300 group-hover:text-text {isOpen
				? 'rotate-180'
				: ''}"
		/>
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 mt-2.5 w-48 origin-top-right overflow-hidden rounded-2xl border border-border/60 bg-glass-surface p-1.5 shadow-2xl backdrop-blur-2xl focus:outline-none"
			role="menu"
			aria-orientation="vertical"
			in:fly={{ y: -8, duration: 250, opacity: 0 }}
			out:fade={{ duration: 150 }}
		>
			<div class="mb-1 px-3 py-2 text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				{m.select_language()}
			</div>

			{#each locales as locale (locale)}
				{@const active = currentLocale === locale}
				<a
					href={localizeHref(page.url.pathname, { locale })}
					class="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all {active
						? 'bg-brand/10 text-brand'
						: 'text-text-muted hover:bg-border/50 hover:text-text'}"
					role="menuitem"
					onclick={(event) => handleLocaleSwitch(event, locale)}
				>
					<div class="flex items-center gap-3">
						<div
							class="flex h-6 w-6 items-center justify-center rounded-lg border border-border/50 bg-surface/50 text-[10px] font-bold uppercase transition-colors group-hover:border-brand/20"
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
			0 0 0 4px color-mix(in srgb, var(--color-brand) 10%, transparent),
			0 1px 2px 0 rgba(0, 0, 0, 0.05);
	}
</style>
