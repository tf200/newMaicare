<script lang="ts">
	import { Bell, ChevronRight, Moon, PanelLeft, Plus, Search, Sun } from 'lucide-svelte';
	import LanguageSwitcher from '$lib/components/ui/LanguageSwitcher.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getAuthState } from '$lib/state/auth.svelte';

	interface Props {
		title?: string;
		section?: string;
		collapsed?: boolean;
		onOpenSidebar?: () => void;
	}

	let {
		title = m.dashboard(),
		section = m.overview(),
		collapsed = false,
		onOpenSidebar
	}: Props = $props();

	const auth = getAuthState();

	const displayName = $derived.by(() => {
		const user = auth.user;
		if (!user) return '';
		return [user.first_name, user.last_name].filter(Boolean).join(' ');
	});

	const displaySubtitle = $derived.by(() => auth.user?.email ?? m.admin());

	const displayInitials = $derived.by(() => {
		const user = auth.user;
		if (!user) return 'MC';
		const nameParts = [user.first_name, user.last_name].filter(Boolean);
		if (nameParts.length > 0) {
			return nameParts
				.map((part) => part.trim()[0])
				.filter(Boolean)
				.join('')
				.slice(0, 2)
				.toUpperCase();
		}
		return user.email?.slice(0, 2).toUpperCase() ?? 'MC';
	});

	const resolveInitialTheme = () => {
		if (typeof window === 'undefined') {
			return false;
		}

		const stored = window.localStorage.getItem('theme');
		if (stored === 'dark') {
			return true;
		}
		if (stored === 'light') {
			return false;
		}

		return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
	};

	let isDark = $state(resolveInitialTheme());

	$effect(() => {
		if (typeof document === 'undefined') {
			return;
		}

		const root = document.documentElement;
		root.className = isDark ? 'dark' : '';
		root.style.colorScheme = isDark ? 'dark' : 'light';
		window.localStorage.theme = isDark ? 'dark' : 'light';
	});

	const headerBase =
		'fixed top-0 right-0 left-0 z-30 flex h-16 items-center border-b border-zinc-200/50 bg-white/80 px-4 backdrop-blur-xl transition-[left,background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none lg:px-8 dark:border-zinc-800/50 dark:bg-black/80';
	const headerOffset = () => (collapsed ? 'lg:left-20' : 'lg:left-72');
</script>

<header class="{headerBase} {headerOffset()}">
	<div class="flex w-full items-center justify-between">
		<div class="flex min-w-0 items-center gap-3">
			<button
				onclick={() => onOpenSidebar?.()}
				class="inline-flex items-center justify-center rounded-2xl border border-zinc-200/60 bg-white/80 p-2 text-zinc-700 shadow-sm backdrop-blur-xl transition hover:bg-white focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none motion-reduce:transition-none dark:border-zinc-800/60 dark:bg-zinc-900/80 dark:text-zinc-200 dark:focus-visible:ring-offset-zinc-900"
				aria-label="Toggle navigation"
			>
				<PanelLeft class="h-4 w-4" />
			</button>
			<div
				class="hidden min-w-0 items-center gap-2 text-sm font-medium text-zinc-500 sm:flex dark:text-zinc-400"
				class:lg:hidden={collapsed}
			>
				<span class="truncate">{section}</span>
				<ChevronRight class="h-4 w-4 shrink-0 opacity-50" />
				<span class="truncate font-semibold text-zinc-900 dark:text-white">{title}</span>
			</div>
			<div
				class="hidden min-w-0 items-center text-sm font-semibold text-zinc-900 dark:text-white"
				class:lg:flex={collapsed}
			>
				<span class="truncate">{title}</span>
			</div>
			<h1 class="truncate text-lg font-bold tracking-tight text-zinc-900 sm:hidden dark:text-white">
				{title}
			</h1>
		</div>

		<div class="flex shrink-0 items-center gap-2 sm:gap-4">
			<div class="relative hidden max-w-lg md:block">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
				<input
					type="text"
					placeholder={m.search_placeholder()}
					class="h-10 w-64 rounded-xl border border-zinc-200/60 bg-zinc-50/50 pl-10 text-sm text-zinc-900 outline-hidden transition-[border-color,box-shadow,background-color] duration-300 placeholder:text-zinc-400 focus:border-teal-500/50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 motion-reduce:transition-none dark:border-zinc-800/60 dark:bg-zinc-900/50 dark:text-zinc-200 dark:focus:border-teal-500/50 dark:focus:bg-zinc-900"
				/>
			</div>

			<button
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm transition hover:bg-zinc-800 hover:shadow-md focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none active:scale-95 motion-reduce:transition-none sm:h-auto sm:w-auto sm:px-4 sm:py-2 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:focus-visible:ring-offset-zinc-900"
				aria-label={m.new_action()}
			>
				<Plus class="h-5 w-5 sm:mr-2" />
				<span class="hidden text-sm font-bold sm:inline">{m.new_action()}</span>
			</button>

			<div class="mx-1 h-6 w-px bg-zinc-200/50 sm:mx-0 dark:bg-zinc-800/50"></div>

			<div class="flex items-center gap-1.5 sm:gap-3">
				<button
					class="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200/70 bg-white/70 text-zinc-600 shadow-sm transition hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none motion-reduce:transition-none dark:border-zinc-800/70 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-900"
					aria-label={m.toggle_theme()}
					onclick={() => {
						isDark = !isDark;
					}}
				>
					{#if isDark}
						<Sun class="h-4 w-4" />
					{:else}
						<Moon class="h-4 w-4" />
					{/if}
				</button>
				<button
					class="relative rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none motion-reduce:transition-none dark:text-zinc-400 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-900"
					aria-label={m.notifications()}
				>
					<Bell class="h-5 w-5" />
					<span
						class="absolute top-2.5 right-2.5 flex h-2 w-2 animate-pulse rounded-full border-2 border-white bg-teal-500 motion-reduce:animate-none dark:border-black"
					></span>
				</button>
				<LanguageSwitcher />

				<button
					class="group flex items-center gap-2 rounded-full p-0.5 transition-[box-shadow,transform] duration-300 hover:ring-4 hover:ring-zinc-100 focus-visible:ring-4 focus-visible:ring-teal-500/15 focus-visible:outline-none active:scale-95 motion-reduce:transition-none dark:hover:ring-zinc-800/50"
					aria-label={m.profile()}
				>
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-teal-400 to-emerald-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-900"
					>
						{displayInitials}
					</div>
					<div class="hidden flex-col items-start text-left sm:flex">
						<span class="text-xs leading-none font-bold text-zinc-900 dark:text-white"
							>{displayName || m.dashboard()}</span
						>
						<span class="text-[10px] font-medium text-zinc-500 dark:text-zinc-400"
							>{displaySubtitle}</span
						>
					</div>
				</button>
			</div>
		</div>
	</div>
</header>
