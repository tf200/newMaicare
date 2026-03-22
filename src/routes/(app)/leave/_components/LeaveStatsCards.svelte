<script lang="ts">
	import { CheckCircle, Clock, Stethoscope, XCircle } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	type Props = {
		pendingCount: number;
		approvedCount: number;
		rejectedCount: number;
		sickCount: number;
	};

	let { pendingCount, approvedCount, rejectedCount, sickCount }: Props = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	<div class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm">
		<div class="absolute -right-4 -bottom-4 text-warning opacity-[0.04]">
			<Clock class="h-32 w-32" />
		</div>
		<div class="relative">
			<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				{m.leave_stats_open()}
			</div>
			<div class="mt-2 text-3xl font-bold tracking-tight text-text">{pendingCount}</div>
			<p class="mt-1 text-xs font-medium text-text-muted">{m.leave_stats_open_sub()}</p>
		</div>
	</div>
	<div class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm">
		<div class="absolute -right-4 -bottom-4 text-success opacity-[0.04]">
			<CheckCircle class="h-32 w-32" />
		</div>
		<div class="relative">
			<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				{m.leave_stats_approved()}
			</div>
			<div class="mt-2 text-3xl font-bold tracking-tight text-text">{approvedCount}</div>
			<p class="mt-1 text-xs font-medium text-text-muted">{m.leave_stats_approved_sub()}</p>
		</div>
	</div>
	<div class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm">
		<div class="absolute -right-4 -bottom-4 text-error opacity-[0.04]">
			<XCircle class="h-32 w-32" />
		</div>
		<div class="relative">
			<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				{m.leave_stats_rejected()}
			</div>
			<div class="mt-2 text-3xl font-bold tracking-tight text-text">{rejectedCount}</div>
			<p class="mt-1 text-xs font-medium text-text-muted">{m.leave_stats_rejected_sub()}</p>
		</div>
	</div>
	<div class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm">
		<div class="absolute -right-4 -bottom-4 text-error opacity-[0.04]">
			<Stethoscope class="h-32 w-32" />
		</div>
		<div class="relative">
			<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				{m.leave_stats_sick()}
			</div>
			<div class="mt-2 text-3xl font-bold tracking-tight text-text">{sickCount}</div>
			<p class="mt-1 text-xs font-medium text-text-muted">{m.leave_stats_sick_sub()}</p>
		</div>
	</div>
</div>
