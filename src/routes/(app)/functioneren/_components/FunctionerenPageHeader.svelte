<script lang="ts">
	import { ClipboardCheck } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
</script>

<header class="rounded-3xl border border-border bg-surface/90 p-6 shadow-sm">
	<div class="flex flex-col gap-6">
		<div class="flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-2">
				<div class="flex items-center gap-3 text-sm font-semibold text-rose-600 dark:text-rose-400">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10">
						<ClipboardCheck class="h-5 w-5" />
					</span>
					<span>{m.func_hr_dev()}</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">{m.func_label()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					{m.func_subtitle()}
				</p>
			</div>
		</div>
	</div>
</header>
