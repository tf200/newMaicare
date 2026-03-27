<script lang="ts">
	import { Euro } from 'lucide-svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { m } from '$lib/paraglide/messages';
</script>

<div class="animate-in fade-in slide-in-from-bottom-2 space-y-5">
	<div class="flex items-center gap-3">
		<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
			<Euro class="h-5 w-5" />
		</div>
		<div>
			<h2 class="text-base font-semibold text-text">{m.leave_payout_title()}</h2>
			<p class="text-xs text-text-muted">{m.leave_payout_subtitle()}</p>
		</div>
	</div>

	<div class="overflow-hidden rounded-2xl border border-border/60 bg-surface p-4">
		<EmptyState
			icon={Euro}
			title={m.not_available()}
			description={m.empty_general_description()}
			variant="dashed"
			size="sm"
		/>
	</div>
</div>
