<script lang="ts">
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import AppHeader from '$lib/components/layout/AppHeader.svelte';

	let isSidebarCollapsed = $state(false);
	let isSidebarMobileOpen = $state(false);
	let { children } = $props();
</script>

<div class="min-h-screen bg-zinc-50 dark:bg-black">
	<div class="relative">
		<div class="pointer-events-none absolute inset-0 overflow-hidden">
			<div
				class="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-teal-500/10 blur-[140px]"
			></div>
			<div
				class="absolute right-[-8rem] -bottom-48 h-96 w-96 rounded-full bg-emerald-500/10 blur-[140px]"
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
			class={`relative px-6 pt-24 pb-12 lg:pr-12 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}
		>
			<div class="mx-auto w-full max-w-7xl">
				{@render children()}
			</div>
		</main>
	</div>
</div>
