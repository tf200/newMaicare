<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		LayoutDashboard,
		Users,
		UsersRound,
		X,
		HelpCircle,
		ChevronDown,
		HeartHandshake
	} from 'lucide-svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import { m } from '$lib/paraglide/messages';
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
		{ label: 'Clients', href: '/clients', icon: UsersRound, permission: 'CLIENT.VIEW' },
		{ label: m.employees(), href: '/employees', icon: Users, permission: 'EMPLOYEE.VIEW' },
		{
			label: m.care_coordination(),
			icon: HeartHandshake,
			permission: 'CARE_COORDINATION.VIEW',
			children: [
				{ label: m.organization(), href: '/organization', permission: 'ORGANISATION.VIEW' },
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
	const baseItem = `group relative flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium ${transitionClass} active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-brand/20`;

	// UIUX.md: Active: bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400
	const activeItem = 'bg-brand/10 text-brand';

	// UIUX.md: Inactive hover:bg-zinc-100 dark:hover:bg-zinc-800
	const inactiveItem = 'text-text-muted hover:bg-border/50 hover:text-text';

	const isActive = (href: string) => {
		const path = page.url.pathname;
		return path === href || path.startsWith(`${href}/`);
	};

	const isItemActive = (item: NavItem) => {
		if (item.href && isActive(item.href)) return true;
		if (item.children) {
			return item.children.some((child) => isActive(child.href));
		}
		return false;
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
			onclick={() => goto('/dashboard')}
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
		{#if title && !collapsed}
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

				<PermissionGuard permission={item.permission}>
					<div class="space-y-1">
						<Tooltip content={item.label} position="right" disabled={!collapsed}>
							<button
								onclick={() => {
									if (hasChildren) {
										toggleExpand(item.label);
									} else if (item.href) {
										goto(item.href);
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
										{@const childActive = isActive(child.href)}
										<button
											onclick={() => goto(child.href)}
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
