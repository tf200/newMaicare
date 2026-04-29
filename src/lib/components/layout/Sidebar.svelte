<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		LayoutDashboard,
		UsersRound,
		Calendar,
		CalendarCheck,
		Clock,
		X,
		HelpCircle,
		ChevronDown,
		HeartHandshake,
		ArrowLeft,
		CircleUser,
		BadgeEuro
	} from 'lucide-svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref, deLocalizeUrl } from '$lib/paraglide/runtime';
	import { slide } from 'svelte/transition';
	import { sidebarState } from '$lib/state/sidebar.svelte';

	interface NavItem {
		label: string;
		href?: string;
		icon: any;
		permission?: string;
		children?: { label: string; href: string; permission?: string }[];
	}

	const defaultItems: NavItem[] = [
		{
			label: m.dashboard(),
			href: '/dashboard',
			icon: LayoutDashboard,
			permission: 'DASHBOARD.VIEW'
		},
		{ label: m.clients(), href: '/clients', icon: UsersRound, permission: 'CLIENT.VIEW' },
		{ label: m.calendar(), href: '/calendar', icon: Calendar, permission: 'DASHBOARD.VIEW' },
		{
			label: m.employees(),
			href: '/employees',
			icon: CircleUser,
			permission: 'EMPLOYEE.VIEW'
		},
		{
			label: m.appointments(),
			href: '/appointments',
			icon: CalendarCheck,
			permission: 'DASHBOARD.VIEW'
		},
		{
			label: m.schedules(),
			href: '/schedules',
			icon: Clock,
			permission: 'DASHBOARD.VIEW'
		},
		{
			label: m.care_coordination(),
			icon: HeartHandshake,
			permission: 'CARE_COORDINATION.VIEW',
			children: [
				{ label: m.organization(), href: '/organization', permission: 'ORGANISATION.VIEW' },
				{ label: m.contracts(), href: '/contracts', permission: 'CARE_COORDINATION.VIEW' },
				{ label: m.senders(), href: '/senders', permission: 'SENDER.VIEW' },
				{ label: m.registrations(), href: '/registrations', permission: 'CARE_COORDINATION.VIEW' },
				{
					label: m.intake(),
					href: '/intakes',
					permission: 'CARE_COORDINATION.VIEW'
				},
				{
					label: m.waiting_for_selection(),
					href: '/waiting-list',
					permission: 'CARE_COORDINATION.VIEW'
				},
				{
					label: m.in_care(),
					href: '/in-care',
					permission: 'CARE_COORDINATION.VIEW'
				},
				{
					label: m.evaluations(),
					href: '/evaluations',
					permission: 'CARE_COORDINATION.VIEW'
				},
				{
					label: m.incidents(),
					href: '/incidents',
					permission: 'CARE_COORDINATION.VIEW'
				}
			]
		},
		{
			label: m.finances(),
			icon: BadgeEuro,
			permission: 'FINANCE.VIEW',
			children: [
				{
					label: m.invoices(),
					href: '/finances/invoices',
					permission: 'INVOICE.VIEW'
				}
			]
		}
	];

	const items = $derived(sidebarState.scopedConfig?.items ?? defaultItems);
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
	const baseItem = `group relative flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium ${transitionClass} active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-white/30`;

	// UIUX.md: Active: bg-white/10 text-white
	const activeItem = 'bg-white/10 text-white';

	// UIUX.md: Inactive: text-white/80 hover:bg-white/10 hover:text-white
	const inactiveItem = 'text-white/80 hover:bg-white/10 hover:text-white';

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
<aside
	class="fixed top-3 bottom-3 left-3 z-50 flex flex-col rounded-2xl bg-brand/90 shadow-2xl ring-1 ring-white/15 backdrop-blur-xl {transitionClass}"
	class:w-[calc(18rem-24px)]={!collapsed}
	class:translate-x-0={mobileOpen}
	class:-translate-x-full={!mobileOpen}
	class:lg:translate-x-0={true}
	class:lg:w-[calc(5rem-12px)]={collapsed}
>
	<!-- Header -->
	<div class="flex h-16 items-center justify-between px-4">
		<button
			onclick={() => goto(localizeHref('/dashboard'))}
			class="group flex items-center gap-3 overflow-hidden outline-none"
		>
			<!-- Logo Icon -->
			<div
				class="flex h-10 w-10 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
			>
				<img
					src="/logo.webp"
					alt="MaiCare"
					class="h-10 w-10 object-contain brightness-0 invert"
					loading="eager"
				/>
			</div>

			<!-- Logo Text -->
			<span
				class="text-lg font-bold tracking-tight whitespace-nowrap text-white {transitionClass}"
				class:opacity-0={collapsed}
				class:w-0={collapsed}
				class:translate-x-[-10px]={collapsed}
			>
				MaiCare<span class="text-white/70">.</span>
			</span>
		</button>

		<!-- Mobile Close Button -->
		<button
			onclick={() => (mobileOpen = false)}
			class="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
		>
			<X class="h-5 w-5" />
		</button>
	</div>

	<!-- Navigation -->
	<div class="scrollarea flex-1 overflow-x-hidden overflow-y-auto px-3 py-6">
		{#if sidebarState.scopedConfig}
			<div class="mb-6 space-y-4 px-2" transition:slide={{ duration: 300 }}>
				<!-- Back Button -->
				<button
					onclick={() => {
						sidebarState.clearScopedSidebar();
						goto(localizeHref('/clients'));
					}}
					class="group flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white/80 transition-all hover:bg-white/10 hover:text-white active:scale-95"
					class:justify-center={collapsed}
				>
					<ArrowLeft class="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
					{#if !collapsed}
						<span class="tracking-widest uppercase">{m.back()}</span>
					{/if}
				</button>

				<!-- Client Info Card -->
				<div
					class="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-2 transition-all duration-300"
					class:p-1={collapsed}
					class:justify-center={collapsed}
				>
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-bold text-white shadow-inner ring-1 ring-white/20 transition-transform duration-300"
					>
						{sidebarState.scopedConfig.initials || 'CP'}
					</div>
					{#if !collapsed}
						<div class="flex flex-1 flex-col overflow-hidden">
							<span
								class="mb-1 text-[10px] leading-none font-bold tracking-widest text-white/50 uppercase"
							>
								{m.client()}
							</span>
							<span class="truncate text-sm font-bold text-white">
								{title || m.client_profile()}
							</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Separator -->
			<div class="mx-3 mb-6 border-b border-white/15"></div>
		{:else if title && !collapsed}
			<div class="mb-4 px-3" transition:slide={{ duration: 300 }}>
				<h2 class="text-xs font-semibold tracking-wider text-white/50 uppercase">
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
										goto(localizeHref(item.href));
									}
								}}
								class="{baseItem} {active ? activeItem : inactiveItem}"
								aria-current={active && !hasChildren ? 'page' : undefined}
							>
								<item.icon
									class="h-5 w-5 shrink-0 transition-colors duration-300 {active
										? 'text-white'
										: 'text-white/40 group-hover:text-white/60'}"
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
											onclick={() => goto(localizeHref(child.href))}
											class="group flex h-9 w-full items-center rounded-lg px-3 text-sm font-medium {transitionClass} outline-none active:scale-95
										{childActive ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}"
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
			class="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-white/20 bg-white/10 p-3 text-left transition-all duration-300 outline-none hover:border-white/40 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
		>
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white/70 shadow-sm"
			>
				<HelpCircle class="h-4 w-4" />
			</div>

			<div
				class="overflow-hidden whitespace-nowrap {transitionClass}"
				class:opacity-0={collapsed}
				class:w-0={collapsed}
				class:translate-x-[-10px]={collapsed}
			>
				<span class="block text-sm font-semibold text-white">{m.support()}</span>
				<span class="text-xs text-white/80">{m.assistance_24_7()}</span>
			</div>
		</button>
	</div>
</aside>

<style>
	.scrollarea::-webkit-scrollbar {
		width: 4px;
	}
	.scrollarea::-webkit-scrollbar-track {
		background: transparent;
	}
	.scrollarea::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 999px;
	}
	.scrollarea::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.35);
	}
	.scrollarea {
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
	}
</style>
