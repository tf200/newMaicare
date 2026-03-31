<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		LayoutDashboard,
		UsersRound,
		Calendar,
		FileText,
		BookMarked,
		Clock3,
		RefreshCw,
		Plane,
		ClipboardCheck,
		X,
		HelpCircle,
		ChevronDown,
		HeartHandshake,
		ArrowLeft,
		CircleUser,
		BadgeEuro,
		BookOpen,
		Target
	} from 'lucide-svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref, deLocalizeUrl } from '$lib/paraglide/runtime';
	import { slide } from 'svelte/transition';
	import { sidebarState } from '$lib/state/sidebar.svelte';
	import { PEOPLE_APP_MODE } from '$lib/config/sidebar';

	interface NavItem {
		label: string;
		href?: string;
		icon: typeof LayoutDashboard;
		permission?: string;
		children?: { label: string; href: string; permission?: string }[];
	}

	const peopleAppItems: NavItem[] = [
		{
			label: m.dashboard(),
			href: '/dashboard',
			icon: LayoutDashboard
		},

		{
			label: m.my_handbook(),
			href: '/handbook',
			icon: BookOpen
		},
		{ label: m.employees(), href: '/employees', icon: UsersRound, permission: 'EMPLOYEE.VIEW' },
		{
			label: m.appointments(),
			href: '/appointments',
			icon: Calendar,
			permission: 'DASHBOARD.VIEW'
		},
		{
			label: m.organization(),
			href: '/organization',
			icon: HeartHandshake,
			permission: 'ORGANISATION.VIEW'
		},
		{ label: 'Templates', href: '/settings/handbooks', icon: FileText },
		{
			label: 'Handbooks',
			href: '/employees/handbooks',
			icon: BookMarked,
			permission: 'EMPLOYEE.VIEW'
		},
		{
			label: m.schedules(),
			href: '/schedules',
			icon: Clock3,
			permission: 'DASHBOARD.VIEW'
		},
		{ label: m.swap_page_title(), href: '/shift-swaps', icon: RefreshCw },
		{ label: m.leave(), href: '/leave', icon: Plane },
		{
			label: m.leave_management_label(),
			href: '/leave-management',
			icon: ClipboardCheck,
			permission: 'EMPLOYEE.VIEW'
		},
		{
			label: 'Salarisadministratie',
			href: '/salary-administration',
			icon: BadgeEuro,
			permission: 'EMPLOYEE.VIEW'
		},
		{
			label: 'Functioneren',
			href: '/functioneren',
			icon: Target,
			permission: 'EMPLOYEE.VIEW'
		}
	];

	const items = $derived(
		sidebarState.scopedConfig?.items ?? (PEOPLE_APP_MODE ? peopleAppItems : [])
	);
	const title = $derived(sidebarState.scopedConfig?.title);

	let { collapsed = $bindable(false), mobileOpen = $bindable(false) } = $props();

	let expandedItems = $state<Record<string, boolean>>({});

	const toggleExpand = (label: string) => {
		if (collapsed) return;
		expandedItems[label] = !expandedItems[label];
	};

	// UIUX.md: transition-all duration-300
	const transitionClass = 'transition-all duration-300 ease-in-out';

	// UIUX.md: Items h-10, hover:bg-zinc-100, active:scale-95
	const baseItem = `group relative flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium ${transitionClass} active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-brand/20`;

	// UIUX.md: Active: bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400
	const activeItem = 'bg-brand/10 text-brand';

	// UIUX.md: Inactive hover:bg-zinc-100 dark:hover:bg-zinc-800
	const inactiveItem = 'text-text-muted hover:bg-border/50 hover:text-text';

	const normalizePath = (path: string) =>
		path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path;

	const isActive = (href: string, exact = false) => {
		const path = normalizePath(deLocalizeUrl(page.url).pathname);
		const normalizedHref = normalizePath(href);
		if (exact) return path === normalizedHref;
		return path === normalizedHref || path.startsWith(`${normalizedHref}/`);
	};

	const isItemActive = (item: NavItem) => {
		const exact = !!sidebarState.scopedConfig;
		if (item.href && isActive(item.href, exact)) return true;
		if (item.children) {
			return item.children.some((child) => isActive(child.href, exact));
		}
		return false;
	};

	const getActiveChildHref = (item: NavItem) => {
		if (!item.children) return null;
		const path = normalizePath(deLocalizeUrl(page.url).pathname);
		let activeHref: string | null = null;
		for (const child of item.children) {
			const childHref = normalizePath(child.href);
			if (path === childHref || path.startsWith(`${childHref}/`)) {
				if (!activeHref || child.href.length > activeHref.length) {
					activeHref = child.href;
				}
			}
		}
		return activeHref;
	};
</script>

<!-- Mobile Backdrop -->
<div
	class="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
	class:opacity-0={!mobileOpen}
	class:pointer-events-none={!mobileOpen}
	onclick={() => (mobileOpen = false)}
	aria-hidden={!mobileOpen}
></div>

<!-- Sidebar Container -->
<!-- UIUX.md: bg-white dark:bg-zinc-900 border-r -->
<aside
	class="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-surface {transitionClass}"
	class:w-72={!collapsed}
	class:translate-x-0={mobileOpen}
	class:-translate-x-full={!mobileOpen}
	class:lg:translate-x-0={true}
	class:lg:w-20={collapsed}
>
	<!-- Header -->
	<div class="flex h-16 items-center justify-between px-4">
		<button
			onclick={() => goto(resolve(localizeHref('/dashboard')))}
			class="group flex items-center gap-3 overflow-hidden outline-none"
		>
			<!-- Logo Icon -->
			<div
				class="flex h-10 w-10 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
			>
				<img src="/logo.webp" alt="MaiCare" class="h-10 w-10 object-contain" loading="eager" />
			</div>

			<!-- Logo Text -->
			<span
				class="text-lg font-bold tracking-tight whitespace-nowrap text-text {transitionClass}"
				class:opacity-0={collapsed}
				class:w-0={collapsed}
				class:translate-x-[-10px]={collapsed}
			>
				MaiCare<span class="text-secondary">.</span>
			</span>
		</button>

		<!-- Mobile Close Button -->
		<button
			onclick={() => (mobileOpen = false)}
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-border/50 hover:text-text lg:hidden"
		>
			<X class="h-5 w-5" />
		</button>
	</div>

	<!-- Navigation -->
	<div class="flex-1 overflow-x-hidden overflow-y-auto px-3 py-6">
		{#if sidebarState.scopedConfig}
			<div class="mb-6 space-y-4 px-2" transition:slide={{ duration: 300 }}>
				<!-- Back Button -->
				<button
					onclick={() => {
						sidebarState.clearScopedSidebar();
						goto(resolve(localizeHref('/clients')));
					}}
					class="group flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-text-muted transition-all hover:bg-border/30 hover:text-text active:scale-95"
					class:justify-center={collapsed}
				>
					<ArrowLeft class="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
					{#if !collapsed}
						<span class="tracking-widest uppercase">{m.back()}</span>
					{/if}
				</button>

				<!-- Client Info Card -->
				<div
					class="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-2 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-800/50"
					class:p-1={collapsed}
					class:justify-center={collapsed}
				>
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand/20 to-brand/5 text-sm font-bold text-brand shadow-inner ring-1 ring-brand/10 transition-transform duration-300"
					>
						{sidebarState.scopedConfig.initials || 'CP'}
					</div>
					{#if !collapsed}
						<div class="flex flex-1 flex-col overflow-hidden">
							<span
								class="mb-1 text-[10px] leading-none font-bold tracking-widest text-text-muted uppercase"
							>
								{m.client()}
							</span>
							<span class="truncate text-sm font-bold text-text">
								{title || m.client_profile()}
							</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Separator -->
			<div class="mx-3 mb-6 border-b border-border/50"></div>
		{:else if title && !collapsed}
			<div class="mb-4 px-3" transition:slide={{ duration: 300 }}>
				<h2 class="text-xs font-semibold tracking-wider text-text-muted uppercase">
					{title}
				</h2>
			</div>
		{/if}
		<nav class="space-y-1">
			{#each items as item (item.label)}
				{@const active = isItemActive(item)}
				{@const hasChildren = item.children && item.children.length > 0}
				{@const isExpanded = expandedItems[item.label] || (hasChildren && active && !collapsed)}
				{@const activeChildHref = hasChildren ? getActiveChildHref(item) : null}

				<PermissionGuard permission={item.permission}>
					<div class="space-y-1">
						<Tooltip content={item.label} position="right" disabled={!collapsed}>
							<button
								onclick={() => {
									if (hasChildren) {
										toggleExpand(item.label);
									} else if (item.href) {
										goto(resolve(localizeHref(item.href)));
									}
								}}
								class="{baseItem} {active ? activeItem : inactiveItem}"
								aria-current={active && !hasChildren ? 'page' : undefined}
							>
								<item.icon
									class="h-5 w-5 shrink-0 transition-colors duration-300 {active
										? 'text-brand'
										: 'text-text-subtle group-hover:text-text-muted'}"
								/>

								<span
									class="flex-1 overflow-hidden text-left whitespace-nowrap {transitionClass}"
									class:opacity-0={collapsed}
									class:w-0={collapsed}
									class:translate-x-[-10px]={collapsed}
								>
									{item.label}
								</span>

								{#if hasChildren && !collapsed}
									<ChevronDown
										class="h-4 w-4 transition-transform duration-300 {isExpanded
											? 'rotate-180'
											: ''}"
									/>
								{/if}
							</button>
						</Tooltip>

						{#if hasChildren && isExpanded && !collapsed}
							<div class="ml-9 space-y-1" transition:slide={{ duration: 300 }}>
								{#each item.children as child (child.label)}
									<PermissionGuard permission={child.permission}>
										{@const childActive = activeChildHref === child.href}
										<button
											onclick={() => goto(resolve(localizeHref(child.href)))}
											class="group flex h-9 w-full items-center rounded-lg px-3 text-sm font-medium {transitionClass} outline-none active:scale-95
										{childActive ? 'bg-brand/5 text-brand' : 'text-text-muted hover:bg-border/50 hover:text-text'}"
										>
											{child.label}
										</button>
									</PermissionGuard>
								{/each}
							</div>
						{/if}
					</div>
				</PermissionGuard>
			{/each}
		</nav>
	</div>

	<!-- Footer / Support -->
	<div class="p-3">
		<button
			class="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-border bg-border/30 p-3 text-left transition-all duration-300 outline-none hover:border-secondary hover:bg-border/50 focus-visible:ring-2 focus-visible:ring-secondary/20 active:scale-95"
		>
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-text-muted shadow-sm"
			>
				<HelpCircle class="h-4 w-4" />
			</div>

			<div
				class="overflow-hidden whitespace-nowrap {transitionClass}"
				class:opacity-0={collapsed}
				class:w-0={collapsed}
				class:translate-x-[-10px]={collapsed}
			>
				<span class="block text-sm font-semibold text-text">{m.support()}</span>
				<span class="text-xs text-text-muted">{m.assistance_24_7()}</span>
			</div>
		</button>
	</div>
</aside>
