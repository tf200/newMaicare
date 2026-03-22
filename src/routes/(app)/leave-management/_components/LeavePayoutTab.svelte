<script lang="ts">
	import { Euro } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { m } from '$lib/paraglide/messages';

	type PayoutRequest = {
		id: string;
		employee: string;
		hours: number;
		status: string;
	};

	type Props = {
		payoutRequests: PayoutRequest[];
	};

	let { payoutRequests }: Props = $props();
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

	<div class="overflow-hidden rounded-2xl border border-border/60">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-border/60 bg-surface-subtle/50">
					<th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-text-muted uppercase">
						{m.employee()}
					</th>
					<th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-text-muted uppercase">
						{m.leave_hours_short()}
					</th>
					<th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-text-muted uppercase">
						Status
					</th>
					<th class="px-4 py-3 text-right text-xs font-semibold tracking-wide text-text-muted uppercase"
					></th>
				</tr>
			</thead>
			<tbody>
				{#each payoutRequests as payout, i}
					{@const isApproved = payout.status === 'Goedgekeurd'}
					<tr
						class="border-b border-border/40 transition-colors last:border-0 hover:bg-surface-subtle/30 {i % 2 === 0 ? '' : 'bg-surface-subtle/20'}"
					>
						<td class="px-4 py-3.5">
							<span class="font-semibold text-text">{payout.employee}</span>
						</td>
						<td class="px-4 py-3.5">
							<span class="rounded-lg bg-brand/8 px-2 py-0.5 text-xs font-bold text-brand"
								>{payout.hours}u</span
							>
						</td>
						<td class="px-4 py-3.5">
							<span
								class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold {isApproved ? 'border-success/20 bg-success/10 text-success' : 'border-warning/20 bg-warning/10 text-warning'}"
							>
								<span class="h-1.5 w-1.5 rounded-full {isApproved ? 'bg-success' : 'bg-warning'}"
								></span>
								{payout.status}
							</span>
						</td>
						<td class="px-4 py-3.5 text-right">
							<Button variant="ghost" class="h-8 rounded-lg px-3 text-xs"
								>{m.leave_payout_view()}</Button
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
