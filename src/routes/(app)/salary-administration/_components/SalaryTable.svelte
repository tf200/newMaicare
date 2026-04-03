<script lang="ts">
	import {
		ChevronDown,
		ChevronUp,
		Lock,
		Unlock,
		AlertCircle,
		CheckCircle2,
		Search,
		ChevronLeft,
		ChevronRight,
		Download,
		FileText
	} from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	interface MultiplierSummary {
		rate_percent: number;
		worked_minutes: number;
		paid_minutes: number;
		base_amount: number;
		premium_amount: number;
	}

	export interface SalaryAdministrationRow {
		employee_id: string;
		employee_name: string;
		month: string;
		is_current_month: boolean;
		is_locked: boolean;
		has_locked_snapshot: boolean;
		data_source: string;
		worked_minutes: number;
		paid_minutes: number;
		base_gross_amount: number;
		irregular_gross_amount: number;
		gross_amount: number;
		pending_entry_count: number;
		pending_worked_minutes: number;
		pay_period_id: string;
		pay_period_status: string;
		paid_at: string;
		multiplier_summaries: MultiplierSummary[];
	}

	interface Props {
		rows?: SalaryAdministrationRow[];
		loading?: boolean;
		currentMonth?: Date;
		onNavigate?: (direction: 'prev' | 'next') => void;
		searchQuery?: string;
		onDownloadPdf?: (row: SalaryAdministrationRow) => void;
		onPreviewPdf?: (row: SalaryAdministrationRow) => void;
	}

	let {
		rows = [],
		loading = false,
		currentMonth = new Date(),
		onNavigate = () => {},
		searchQuery = $bindable(''),
		onDownloadPdf = () => {},
		onPreviewPdf = () => {}
	}: Props = $props();

	import { SvelteSet } from 'svelte/reactivity';
	let expandedRows = new SvelteSet<string>();

	function toggleRow(id: string) {
		if (expandedRows.has(id)) {
			expandedRows.delete(id);
		} else {
			expandedRows.add(id);
		}
	}

	const fmtCurrency = (amount: number) =>
		new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);

	const fmtHours = (minutes: number) => (minutes / 60).toFixed(1) + 'h';
</script>

<div class="flex flex-col gap-8">
	<!-- Header & Filters -->
	<div class="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="relative w-full sm:w-80">
			<Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
			<input
				type="search"
				placeholder="Search employees..."
				bind:value={searchQuery}
				class="h-11 w-full rounded-2xl border border-border/60 bg-surface/50 pl-11 pr-4 text-sm font-medium text-text backdrop-blur-md transition-all placeholder:text-text-subtle hover:border-border focus:border-brand focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand/10"
			/>
		</div>

		<div class="flex items-center gap-2">
			<button
				class="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-surface/50 text-text-muted backdrop-blur-md transition-all hover:border-border hover:bg-surface hover:text-text active:scale-95"
				onclick={() => onNavigate('prev')}
			>
				<ChevronLeft class="h-4 w-4" />
			</button>
			<div class="flex h-11 min-w-[160px] items-center justify-center rounded-2xl border border-border/60 bg-surface/50 px-5 backdrop-blur-md">
				<span class="text-sm font-bold tracking-wide text-text capitalize">
					{new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(currentMonth)}
				</span>
			</div>
			<button
				class="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-surface/50 text-text-muted backdrop-blur-md transition-all hover:border-border hover:bg-surface hover:text-text active:scale-95"
				onclick={() => onNavigate('next')}
			>
				<ChevronRight class="h-4 w-4" />
			</button>
		</div>
	</div>

	<!-- Custom Table/List -->
	<div class="flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm">
		<!-- Desktop Header Row -->
		<div class="hidden grid-cols-12 gap-6 border-b border-border/40 bg-surface-subtle/50 px-8 py-4 text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase md:grid">
			<div class="col-span-4">Employee</div>
			<div class="col-span-2 text-right">Status</div>
			<div class="col-span-2 text-right">Hours</div>
			<div class="col-span-3 text-right">Gross Total</div>
			<div class="col-span-1 text-right"></div>
		</div>

		<div class="flex flex-col divide-y divide-border/30">
			{#if loading}
				{#each Array(5) as _, i (i)}
					<div class="flex flex-col px-6 py-5 md:px-8">
						<div class="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
							<div class="col-span-1 flex items-center gap-4 md:col-span-4">
								<div class="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-surface-subtle"></div>
								<div class="flex flex-col gap-2">
									<div class="h-4 w-32 animate-pulse rounded-md bg-surface-subtle"></div>
									<div class="h-3 w-20 animate-pulse rounded-md bg-surface-subtle"></div>
								</div>
							</div>
							<div class="col-span-1 flex items-center justify-between md:col-span-2 md:justify-end">
								<div class="h-6 w-16 animate-pulse rounded-full bg-surface-subtle"></div>
							</div>
							<div class="col-span-1 flex flex-col items-end gap-1 md:col-span-2">
								<div class="h-5 w-12 animate-pulse rounded-md bg-surface-subtle"></div>
								<div class="h-3 w-10 animate-pulse rounded-md bg-surface-subtle"></div>
							</div>
							<div class="col-span-1 flex flex-col items-end gap-1 md:col-span-3">
								<div class="h-6 w-24 animate-pulse rounded-md bg-surface-subtle"></div>
								<div class="h-3 w-16 animate-pulse rounded-md bg-surface-subtle"></div>
							</div>
							<div class="col-span-1 hidden items-center justify-end md:col-span-1 md:flex">
								<div class="h-8 w-8 animate-pulse rounded-full bg-surface-subtle"></div>
							</div>
						</div>
					</div>
				{/each}
			{:else if rows.length === 0}
				<div class="flex flex-col items-center justify-center py-20 text-center">
					<div class="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-surface-subtle">
						<Search class="h-6 w-6 text-text-muted" />
					</div>
					<h3 class="text-lg font-bold text-text">No records found</h3>
					<p class="mt-2 text-sm text-text-subtle">Adjust your filters to see more results.</p>
				</div>
			{/if}

			{#each rows as row (row.employee_id)}
				{@const isExpanded = expandedRows.has(row.employee_id)}
				<div class="group flex flex-col transition-colors duration-300 {isExpanded ? 'bg-surface-subtle/20' : 'hover:bg-surface-subtle/30'}">
					
					<!-- Main Row trigger -->
					<button
						class="grid cursor-pointer grid-cols-1 items-center gap-6 px-6 py-5 text-left md:grid-cols-12 md:px-8"
						onclick={() => toggleRow(row.employee_id)}
					>
						<!-- Identity -->
						<div class="col-span-1 flex items-center gap-4 md:col-span-4">
							<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/40 bg-surface text-sm font-extrabold text-brand shadow-sm transition-transform group-hover:scale-105 group-hover:border-brand/20 group-hover:bg-brand/5">
								{row.employee_name.split(' ').map(n => n[0]).join('')}
							</div>
							<div class="flex flex-col">
								<span class="text-[15px] font-bold text-text">{row.employee_name}</span>
								<div class="mt-1 flex items-center gap-2">
									<span class="text-[11px] font-medium tracking-wide text-text-subtle uppercase">ID: {row.employee_id.split('-')[0]}</span>
									{#if row.pending_entry_count > 0}
										<span class="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
											<AlertCircle class="h-3 w-3" />
											{row.pending_entry_count} pending
										</span>
									{/if}
								</div>
							</div>
						</div>

						<!-- Status -->
						<div class="col-span-1 flex items-center justify-between md:col-span-2 md:justify-end">
							<span class="text-xs font-bold text-text-subtle md:hidden">Status</span>
							<div class="flex items-center gap-2">
								{#if row.is_locked}
									<div class="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
										<Lock class="h-3.5 w-3.5" />
										Locked
									</div>
								{:else}
									<div class="flex items-center gap-1.5 rounded-full border border-border/60 bg-surface-subtle px-3 py-1 text-xs font-bold text-text-muted">
										<Unlock class="h-3.5 w-3.5" />
										Open
									</div>
								{/if}
							</div>
						</div>

						<!-- Hours -->
						<div class="col-span-1 flex items-center justify-between md:col-span-2 md:justify-end">
							<span class="text-xs font-bold text-text-subtle md:hidden">Hours</span>
							<div class="flex flex-col items-end">
								<span class="text-base font-semibold tabular-nums text-text">{fmtHours(row.worked_minutes)}</span>
								<span class="text-[11px] font-medium text-text-subtle">worked</span>
							</div>
						</div>

						<!-- Gross Total -->
						<div class="col-span-1 flex items-center justify-between md:col-span-3 md:justify-end">
							<span class="text-xs font-bold text-text-subtle md:hidden">Gross Total</span>
							<div class="flex flex-col items-end">
								<span class="text-[17px] font-extrabold tabular-nums text-brand">{fmtCurrency(row.gross_amount)}</span>
								{#if row.irregular_gross_amount > 0}
									<span class="text-[11px] font-semibold text-indigo-500">
										Includes {fmtCurrency(row.irregular_gross_amount)} ORT
									</span>
								{/if}
							</div>
						</div>

						<!-- Chevron -->
						<div class="col-span-1 hidden items-center justify-end md:col-span-1 md:flex">
							<div class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-subtle/0 text-text-muted transition-all group-hover:bg-surface-subtle group-hover:text-text">
								<div class="transition-transform duration-300 {isExpanded ? 'rotate-180' : 'rotate-0'}">
									<ChevronDown class="h-5 w-5" />
								</div>
							</div>
						</div>
					</button>

					<!-- Expanded View -->
					{#if isExpanded}
						<div transition:slide={{ duration: 300, axis: 'y' }}>
							<div class="border-t border-border/30 bg-surface-subtle/30 px-6 pb-8 pt-6 md:px-8">
								<div class="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
									
									<!-- Multipliers Section -->
									<div class="col-span-1 lg:col-span-8">
										<h4 class="mb-5 text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">
											Hours & Multipliers Breakdown
										</h4>
										<div class="overflow-hidden rounded-2xl border border-border/50 bg-surface shadow-sm">
											<table class="w-full text-left text-sm">
												<thead class="bg-surface-subtle/50 text-[10px] font-bold uppercase tracking-wider text-text-subtle">
													<tr>
														<th class="px-5 py-3.5">Rate</th>
														<th class="px-5 py-3.5 text-right">Worked</th>
														<th class="px-5 py-3.5 text-right">Base Amt</th>
														<th class="px-5 py-3.5 text-right">Premium</th>
														<th class="px-5 py-3.5 text-right">Total</th>
													</tr>
												</thead>
												<tbody class="divide-y divide-border/30">
													{#each row.multiplier_summaries as mul (mul.rate_percent)}
														<tr class="transition-colors hover:bg-surface-subtle/30">
															<td class="px-5 py-3.5">
																<span class="inline-flex items-center rounded-lg bg-brand/10 px-2 py-1 text-xs font-bold text-brand">
																	{mul.rate_percent}%
																</span>
															</td>
															<td class="px-5 py-3.5 text-right font-medium tabular-nums text-text-muted">
																{fmtHours(mul.worked_minutes)}
															</td>
															<td class="px-5 py-3.5 text-right tabular-nums text-text-muted">
																{fmtCurrency(mul.base_amount)}
															</td>
															<td class="px-5 py-3.5 text-right font-medium tabular-nums text-indigo-500">
																{mul.premium_amount > 0 ? '+' + fmtCurrency(mul.premium_amount) : '—'}
															</td>
															<td class="px-5 py-3.5 text-right font-bold tabular-nums text-text">
																{fmtCurrency(mul.base_amount + mul.premium_amount)}
															</td>
														</tr>
													{/each}
												</tbody>
											</table>
										</div>
									</div>

									<!-- Summary Section -->
									<div class="col-span-1 lg:col-span-4 flex flex-col gap-6">
										<div>
											<h4 class="mb-5 text-[10px] font-bold tracking-[0.15em] text-text-subtle uppercase">
												Period Summary
											</h4>
											
											<div class="flex flex-col gap-3.5 rounded-2xl border border-border/50 bg-surface p-5 shadow-sm">
												<div class="flex items-center justify-between text-[13px]">
													<span class="font-medium text-text-muted">Base Gross</span>
													<span class="font-semibold tabular-nums text-text">{fmtCurrency(row.base_gross_amount)}</span>
												</div>
												<div class="flex items-center justify-between text-[13px]">
													<span class="font-medium text-text-muted">Irregular / ORT</span>
													<span class="font-semibold tabular-nums text-indigo-500">+{fmtCurrency(row.irregular_gross_amount)}</span>
												</div>
												
												<div class="my-0.5 border-t border-border/40"></div>
												
												<div class="flex items-center justify-between">
													<span class="text-sm font-bold text-text">Total Gross</span>
													<span class="text-[17px] font-extrabold tabular-nums text-brand">{fmtCurrency(row.gross_amount)}</span>
												</div>
											</div>
										</div>

										<!-- Actions -->
										<div class="flex flex-col gap-3">
											<div class="flex items-center gap-3">
												<button 
													class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface px-4 py-3 text-[13px] font-bold text-text shadow-sm transition-all hover:border-border hover:bg-surface-subtle active:scale-95"
													onclick={() => onDownloadPdf(row)}
												>
													<Download class="h-4 w-4 text-text-muted" />
													Export PDF
												</button>
												<button 
													class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface px-4 py-3 text-[13px] font-bold text-text shadow-sm transition-all hover:border-border hover:bg-surface-subtle active:scale-95"
													onclick={() => onPreviewPdf(row)}
												>
													<FileText class="h-4 w-4 text-text-muted" />
													View Details
												</button>
											</div>
											
											{#if row.pay_period_status === 'PAID'}
												<div class="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
													<CheckCircle2 class="h-3.5 w-3.5" />
													Paid out on {new Date(row.paid_at).toLocaleDateString('nl-NL')}
												</div>
											{/if}
										</div>
									</div>

								</div>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
