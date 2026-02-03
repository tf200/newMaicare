<svelte:head>
	<title>Dashboard | MaiCare</title>
</svelte:head>

<section class="grid gap-6">
	<div class="rounded-3xl border border-border/60 bg-glass-surface p-8 shadow-sm backdrop-blur-xl">
		<h2 class="text-2xl font-bold tracking-tight text-text">Dashboard</h2>
		<p class="mt-2 flex items-center gap-2 text-sm font-medium text-text-muted">
			<span class="relative flex h-2 w-2">
				<span
					class="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"
				></span>
				<span class="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
			</span>
			Your workspace is ready. Start by selecting a module from the sidebar.
		</p>
	</div>

	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		<div class="rounded-3xl border border-border/60 bg-surface/60 p-6 shadow-sm backdrop-blur-xl">
			<div class="h-4 w-32 rounded-full bg-border/50"></div>
			<div class="mt-4 h-20 rounded-2xl bg-border/30"></div>
		</div>
		<div class="rounded-3xl border border-border/60 bg-surface/60 p-6 shadow-sm backdrop-blur-xl">
			<div class="h-4 w-24 rounded-full bg-border/50"></div>
			<div class="mt-4 h-20 rounded-2xl bg-border/30"></div>
		</div>
		<div class="rounded-3xl border border-border/60 bg-surface/60 p-6 shadow-sm backdrop-blur-xl">
			<div class="h-4 w-20 rounded-full bg-border/50"></div>
			<div class="mt-4 h-20 rounded-2xl bg-border/30"></div>
		</div>
	</div>
</section>
