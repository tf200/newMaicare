<script lang="ts">
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import AppHeader from '$lib/components/layout/AppHeader.svelte';
	import { setWebSocketState } from '$lib/api/ws.svelte';
	import { getAuthState } from '$lib/state/auth.svelte';
	import { setBreadcrumbsState } from '$lib/state/breadcrumbs.svelte';

	const auth = getAuthState();
	const ws = setWebSocketState();
	const breadcrumbs = setBreadcrumbsState();

	$effect(() => {
		if (auth.isAuthenticated) {
			ws.connect();
		} else {
			ws.disconnect();
		}
	});

	$effect(() => () => ws.destroy());

	let isSidebarCollapsed = $state(false);
	let isSidebarMobileOpen = $state(false);
	let { children } = $props();
</script>

<div class="min-h-screen bg-zinc-50 dark:bg-black">
	<div class="relative">
		<div class="pointer-events-none absolute inset-0 overflow-hidden">
			<div
				class="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[140px]"
			></div>
			<div
				class="absolute -right-32 -bottom-48 h-96 w-96 rounded-full bg-secondary/10 blur-[140px]"
			></div>
		</div>
		<Sidebar bind:collapsed={isSidebarCollapsed} bind:mobileOpen={isSidebarMobileOpen} />
		<AppHeader
			collapsed={isSidebarCollapsed}
			onOpenSidebar={() => {
				if (window.innerWidth >= 1024) {
					isSidebarCollapsed = !isSidebarCollapsed;
				} else {
					isSidebarMobileOpen = true;
				}
			}}
		/>
		<main
			class={`relative px-4 pt-24 pb-12 transition-[margin] duration-300 ease-in-out lg:px-8 ${isSidebarCollapsed ? 'lg:ml-[calc(5rem+12px)]' : 'lg:ml-[calc(18rem+12px)]'}`}
		>
			<div class="mx-auto w-full max-w-7xl">
				{@render children()}
			</div>
		</main>
	</div>
</div>
