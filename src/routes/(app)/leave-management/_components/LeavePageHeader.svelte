<script lang="ts">
	import { Calendar } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
</script>

<header
	class="relative overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white p-8 shadow-sm transition-all dark:border-zinc-800 dark:bg-zinc-900"
>
	<!-- Decorative background element -->
	<div class="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl"></div>
	<div class="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl"></div>

	<div class="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
		<div class="space-y-3">
			<div class="flex items-center gap-3">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-teal-600 shadow-inner dark:bg-zinc-800 dark:text-teal-400"
				>
					<Calendar class="h-6 w-6" />
				</div>
				<div>
					<span
						class="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase dark:text-zinc-500"
					>
						{m.leave_management_label()}
					</span>
					<h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
						{m.leave_page_heading()}
					</h1>
				</div>
			</div>
			<p class="max-w-xl text-sm leading-relaxed font-medium text-zinc-500 dark:text-zinc-400">
				{m.leave_page_subtitle()}
			</p>
		</div>
	</div>
</header>
