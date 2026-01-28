<svelte:head>
	<title>Dashboard | MaiCare</title>
</svelte:head>

<section class="grid gap-6">
	<div
		class="rounded-3xl border border-zinc-200/60 bg-white/80 p-8 shadow-sm backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/80"
	>
		<h2 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Dashboard</h2>
		<p class="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
			Your workspace is ready. Start by selecting a module from the sidebar.
		</p>
	</div>

	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		<div
			class="rounded-3xl border border-zinc-200/60 bg-white/60 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/60"
		>
			<div class="h-4 w-32 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"></div>
			<div class="mt-4 h-20 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/50"></div>
		</div>
		<div
			class="rounded-3xl border border-zinc-200/60 bg-white/60 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/60"
		>
			<div class="h-4 w-24 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"></div>
			<div class="mt-4 h-20 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/50"></div>
		</div>
		<div
			class="rounded-3xl border border-zinc-200/60 bg-white/60 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/60"
		>
			<div class="h-4 w-20 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70"></div>
			<div class="mt-4 h-20 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/50"></div>
		</div>
	</div>
</section>
