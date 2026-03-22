<script lang="ts">
	import { FileText } from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';

	type ContractChange = {
		id: string;
		employee: string;
		fromHours: number;
		toHours: number;
		date: string;
	};

	type Props = {
		contractChanges: ContractChange[];
		formatDate: (dateText: string) => string;
	};

	let { contractChanges, formatDate }: Props = $props();
</script>

<div class="animate-in fade-in slide-in-from-bottom-2 space-y-5">
	<div class="flex items-center gap-3">
		<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
			<FileText class="h-5 w-5" />
		</div>
		<div>
			<h2 class="text-base font-semibold text-text">{m.leave_contract_changes_title()}</h2>
			<p class="text-xs text-text-muted">{m.leave_contract_changes_subtitle()}</p>
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
						Datum
					</th>
					<th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-text-muted uppercase">
						{m.leave_contract_hours_per_week()}
					</th>
					<th class="px-4 py-3 text-right text-xs font-semibold tracking-wide text-text-muted uppercase">
						Verschil
					</th>
				</tr>
			</thead>
			<tbody>
				{#each contractChanges as change, i}
					{@const isReduction = change.toHours < change.fromHours}
					{@const diff = Math.abs(change.toHours - change.fromHours)}
					<tr
						class="border-b border-border/40 transition-colors last:border-0 hover:bg-surface-subtle/30 {i % 2 === 0 ? '' : 'bg-surface-subtle/20'}"
					>
						<td class="px-4 py-3.5">
							<span class="font-semibold text-text">{change.employee}</span>
						</td>
						<td class="px-4 py-3.5 text-text-muted">
							{formatDate(change.date)}
						</td>
						<td class="px-4 py-3.5">
							<div class="flex items-center gap-2 text-sm">
								<span class="text-text-muted line-through">{change.fromHours}u</span>
								<span class="text-text-subtle">→</span>
								<span class="font-semibold {isReduction ? 'text-error' : 'text-success'}"
									>{change.toHours}u</span
								>
							</div>
						</td>
						<td class="px-4 py-3.5 text-right">
							<span
								class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold {isReduction ? 'border-error/20 bg-error/10 text-error' : 'border-success/20 bg-success/10 text-success'}"
							>
								{isReduction ? '−' : '+'}{diff}u
							</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
