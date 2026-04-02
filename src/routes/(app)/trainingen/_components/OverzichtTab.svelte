<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { Search, CheckCircle2, Clock, Calendar, XCircle, GraduationCap } from 'lucide-svelte';
	import type { EmployeeTraining, TrainingStatus } from '$lib/types/api/trainingen';

	interface Props {
		employeeTrainings: EmployeeTraining[];
		loading: boolean;
	}

	let { employeeTrainings, loading }: Props = $props();

	let searchQuery = $state('');
	let statusFilter = $state('all');

	const statusConfig: Record<TrainingStatus, { label: string; color: string; icon: any }> = {
		planned: {
			label: m.train_status_planned(),
			color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
			icon: Calendar
		},
		in_progress: {
			label: m.train_status_progress(),
			color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
			icon: Clock
		},
		completed: {
			label: m.train_status_completed(),
			color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
			icon: CheckCircle2
		},
		expired: {
			label: m.train_status_expired(),
			color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
			icon: XCircle
		}
	};

	const filtered = $derived(
		employeeTrainings.filter((et) => {
			const matchesSearch =
				et.training_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				et.employee_name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus = statusFilter === 'all' || et.status === statusFilter;
			return matchesSearch && matchesStatus;
		})
	);

	function getExpiryClass(date: string | null): string {
		if (!date) return '';
		const days = Math.ceil((new Date(date).getTime() - new Date().getTime()) / 86400000);
		if (days < 0) return 'text-rose-600 dark:text-rose-400 font-bold';
		if (days <= 30) return 'text-amber-600 dark:text-amber-400 font-semibold';
		return 'text-text-muted';
	}
</script>

<div>
	<!-- Filters -->
	<div class="mb-5 flex flex-col gap-3 sm:flex-row">
		<div class="relative flex-1">
			<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle" />
			<input
				type="text"
				placeholder={m.train_search()}
				bind:value={searchQuery}
				class="h-9 w-full rounded-xl border border-border bg-surface px-3 pl-9 text-sm text-text transition-colors placeholder:text-text-subtle focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none"
			/>
		</div>
		<select
			class="h-9 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-text focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none"
			value={statusFilter}
			onchange={(e) => (statusFilter = (e.target as HTMLSelectElement).value)}
		>
			<option value="all">{m.train_all_statuses()}</option>
			{#each Object.entries(statusConfig) as [key, cfg]}
				<option value={key}>{cfg.label}</option>
			{/each}
		</select>
	</div>

	{#if loading}
		<div class="space-y-2 py-4">
			{#each Array(6) as _, i}
				<div
					class="h-[56px] animate-pulse rounded-xl bg-border/20"
					style="animation-delay: {i * 50}ms"
				></div>
			{/each}
		</div>
	{:else if filtered.length === 0}
		<div class="flex flex-col items-center rounded-2xl border border-dashed border-border py-16">
			<div
				class="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/8 dark:bg-indigo-500/5"
			>
				<GraduationCap class="h-6 w-6 text-indigo-400 dark:text-indigo-500" />
			</div>
			<p class="mt-4 text-sm font-bold text-text">{m.train_no_results()}</p>
			<p class="mt-1 max-w-[280px] text-center text-xs text-text-subtle">
				{m.train_no_results_desc()}
			</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each filtered as et, idx (et.id)}
				{@const cfg = statusConfig[et.status]}
				{@const StatusIcon = cfg.icon}
				<div
					class="group flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-surface px-4 py-3 transition-all hover:border-border hover:shadow-sm {et.status ===
					'expired'
						? '!border-rose-200/60 dark:!border-rose-800/30'
						: ''}"
					style="animation: fade-in 300ms cubic-bezier(0.22,1,0.36,1) both; animation-delay: {idx *
						30}ms"
				>
					<div class="flex min-w-0 flex-1 items-center gap-3">
						<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl {cfg.color}">
							<StatusIcon class="h-4 w-4" />
						</div>
						<div class="min-w-0">
							<div class="flex items-center gap-2">
								<span class="truncate text-[13px] font-bold text-text">{et.training_name}</span>
								{#if et.status === 'planned' || et.status === 'in_progress'}
									<span
										class="inline-flex items-center rounded-md {cfg.color} px-1.5 py-0.5 text-[9px] font-bold"
										>{cfg.label}</span
									>
								{/if}
							</div>
							<div class="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-subtle">
								<span class="font-semibold">{et.employee_name}</span>
								<span>&middot;</span>
								<span>{et.employee_department}</span>
								<span>&middot;</span>
								<span class="capitalize">{et.training_category}</span>
							</div>
						</div>
					</div>

					<div class="flex shrink-0 items-center gap-4">
						{#if et.expiry_date}
							<div class="hidden text-right sm:block">
								<div class="text-[10px] font-bold tracking-[0.1em] text-text-subtle uppercase">
									{m.train_expires()}
								</div>
								<div class="text-[12px] tabular-nums {getExpiryClass(et.expiry_date)}">
									{new Intl.DateTimeFormat('nl-NL', {
										day: 'numeric',
										month: 'short',
										year: 'numeric'
									}).format(new Date(et.expiry_date))}
								</div>
							</div>
						{/if}
						{#if et.completed_date}
							<div class="hidden text-right md:block">
								<div class="text-[10px] font-bold tracking-[0.1em] text-text-subtle uppercase">
									{m.train_finished()}
								</div>
								<div class="text-[12px] text-text-muted tabular-nums">
									{new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(
										new Date(et.completed_date)
									)}
								</div>
							</div>
						{/if}
						<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							{#if et.status !== 'completed'}
								<button
									class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition-all hover:bg-emerald-500/8 hover:text-emerald-600"
									title={m.train_mark_complete()}
								>
									<CheckCircle2 class="h-[15px] w-[15px]" />
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
