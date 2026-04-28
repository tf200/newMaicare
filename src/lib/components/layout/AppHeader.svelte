<script lang="ts">
	import {
		Bell,
		ChevronRight,
		Moon,
		PanelLeft,
		Plus,
		Search,
		Sun,
		User,
		LogOut,
		Settings
	} from 'lucide-svelte';
	import LanguageSwitcher from '$lib/components/ui/LanguageSwitcher.svelte';
	import Dropdown from '$lib/components/ui/Dropdown.svelte';
	import DropdownItem from '$lib/components/ui/DropdownItem.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getAuthState } from '$lib/state/auth.svelte';
	import { goto } from '$app/navigation';
	import { localizeHref } from '$lib/paraglide/runtime';
	import Breadcrumbs from '$lib/components/ui/Breadcrumbs.svelte';
	import { getBreadcrumbsState } from '$lib/state/breadcrumbs.svelte';
	import { page } from '$app/state';

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
	const breadcrumbsState = getBreadcrumbsState();

	const fallbackBreadcrumbs = $derived.by(() => {
		const segments = page.url.pathname.split('/').filter(Boolean);
		if (segments.length === 0) {
			return [{ label: m.breadcrumb_home(), href: '/dashboard' }, { label: m.dashboard() }];
		}

		const items: any[] = [{ label: m.breadcrumb_home(), href: '/dashboard' }];
		let currentPath = '';

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			if (segment.length === 36 && segment.includes('-')) {
				currentPath += `/${segment}`;
				items.push({ label: 'Detail' as any });
				continue;
			}
			currentPath += `/${segment}`;
			const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

			items.push({
				label: label as any,
				...(i === segments.length - 1 ? {} : { href: currentPath })
			});
		}
		return items;
	});

	const activeBreadcrumbs = $derived(
		breadcrumbsState.items.length > 0 ? breadcrumbsState.items : fallbackBreadcrumbs
	);

	const handleLogout = async () => {
		await auth.logout();
		await goto(localizeHref('/login'));
	};

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
		'fixed top-3 inset-x-3 z-30 flex h-16 items-center rounded-2xl bg-glass-surface px-4 backdrop-blur-xl ring-1 ring-border/50 shadow-sm transition-[left,background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none lg:px-8';
	const headerOffset = () =>
		collapsed ? 'lg:left-[calc(5rem+12px)]' : 'lg:left-[calc(18rem+12px)]';
</script>

<header class="{headerBase} {headerOffset()}">
	<div class="flex w-full items-center justify-between">
		<div class="flex min-w-0 items-center gap-3">
			<button
				onclick={() => onOpenSidebar?.()}
				class="inline-flex items-center justify-center rounded-2xl border border-border/60 bg-glass-surface p-2 text-text-muted shadow-sm backdrop-blur-xl transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none motion-reduce:transition-none dark:focus-visible:ring-offset-zinc-900"
				aria-label={m.toggle_navigation()}
			>
				<PanelLeft class="h-4 w-4" />
			</button>
			<div class="hidden min-w-0 sm:block" class:lg:hidden={collapsed}>
				<Breadcrumbs items={activeBreadcrumbs} />
			</div>
		</div>

		<div class="flex shrink-0 items-center gap-2 sm:gap-4">
			<div class="relative hidden max-w-lg md:block">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle" />
				<input
					type="text"
					placeholder={m.search_placeholder()}
					class="h-10 w-64 rounded-xl border border-border/60 bg-bg/50 pl-10 text-sm text-text outline-hidden transition-[border-color,box-shadow,background-color] duration-300 placeholder:text-text-subtle focus:border-brand/50 focus:ring-4 focus:ring-brand/10 motion-reduce:transition-none"
				/>
			</div>

			<button
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-btn-primary-bg text-btn-primary-text shadow-sm transition hover:opacity-90 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none active:scale-95 motion-reduce:transition-none sm:h-auto sm:w-auto sm:px-4 sm:py-2 dark:focus-visible:ring-offset-zinc-900"
				aria-label={m.new_action()}
			>
				<Plus class="h-5 w-5 sm:mr-2" />
				<span class="hidden text-sm font-bold sm:inline">{m.new_action()}</span>
			</button>

			<div class="mx-1 h-6 w-px bg-border/50 sm:mx-0"></div>

			<div class="flex items-center gap-1.5 sm:gap-3">
				<button
					class="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-surface/70 text-text-muted shadow-sm transition hover:bg-border/50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none motion-reduce:transition-none dark:focus-visible:ring-offset-zinc-900"
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
					class="relative rounded-xl p-2 text-text-muted transition hover:bg-border/50 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none motion-reduce:transition-none dark:focus-visible:ring-offset-zinc-900"
					aria-label={m.notifications()}
				>
					<Bell class="h-5 w-5" />
					<span
						class="absolute top-2.5 right-2.5 flex h-2 w-2 animate-pulse rounded-full border-2 border-white bg-[var(--color-secondary)] motion-reduce:animate-none dark:border-black"
					></span>
				</button>
				<LanguageSwitcher />

				<Dropdown align="right" width="w-64">
					{#snippet trigger()}
						<div
							class="group flex items-center gap-2 rounded-full p-0.5 transition-[box-shadow,transform] duration-300 hover:ring-4 hover:ring-border/50 focus-visible:ring-4 focus-visible:ring-brand/15 focus-visible:outline-none active:scale-95 motion-reduce:transition-none"
							aria-label={m.profile()}
						>
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-brand to-success text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-900"
							>
								{displayInitials}
							</div>
							<div class="hidden flex-col items-start text-left sm:flex">
								<span class="text-xs leading-none font-bold text-text"
									>{displayName || m.dashboard()}</span
								>
								<span class="text-[10px] font-medium text-text-muted">{displaySubtitle}</span>
							</div>
						</div>
					{/snippet}

					{#snippet content()}
						<div class="mb-1 border-b border-border/50 px-3 py-2">
							<p class="text-xs font-bold text-text">{displayName || m.dashboard()}</p>
							<p class="truncate text-[10px] text-text-muted">{displaySubtitle}</p>
						</div>
						<DropdownItem label="User Preferences" icon={User} href={localizeHref('/profile')} />
						<DropdownItem
							label={m.settings()}
							icon={Settings}
							href={localizeHref('/settings/system')}
						/>
						<div class="my-1 h-px bg-border/50"></div>
						<DropdownItem
							label={m.logout()}
							icon={LogOut}
							variant="destructive"
							onclick={handleLogout}
						/>
					{/snippet}
				</Dropdown>
			</div>
		</div>
	</div>
</header>
