<script lang="ts">
	import { Palmtree, Clock, HeartPulse, Sparkles } from 'lucide-svelte';
	import type { LeaveRequest, LeaveType } from '$lib/types/api/vakantiekalender';

	interface Props {
		leaveRequests: LeaveRequest[];
		loading: boolean;
		currentMonth: Date;
		selectedDepartment: string;
	}

	let { leaveRequests, loading, currentMonth, selectedDepartment }: Props = $props();

	const DAY_NAMES = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

	function getDaysInMonth(date: Date): Date[] {
		const year = date.getFullYear();
		const month = date.getMonth();
		const days: Date[] = [];
		const lastDay = new Date(year, month + 1, 0).getDate();
		for (let d = 1; d <= lastDay; d++) {
			days.push(new Date(year, month, d));
		}
		return days;
	}

	function getMondayFirstOffset(date: Date): number {
		const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
		return day === 0 ? 6 : day - 1;
	}

	function isSameDay(a: Date, b: Date): boolean {
		return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
	}

	function isWeekend(d: Date): boolean {
		const day = d.getDay();
		return day === 0 || day === 6;
	}

	function dateInRange(day: Date, start: string, end: string): boolean {
		const s = new Date(start);
		const e = new Date(end);
		s.setHours(0, 0, 0, 0);
		e.setHours(0, 0, 0, 0);
		const d = new Date(day);
		d.setHours(0, 0, 0, 0);
		return d >= s && d <= e;
	}

	const calendarDays = $derived(getDaysInMonth(currentMonth));
	const startOffset = $derived(getMondayFirstOffset(currentMonth));

	const approvedLeave = $derived(
		leaveRequests.filter((lr) => {
			if (lr.status !== 'approved') return false;
			if (selectedDepartment !== 'all' && lr.department !== selectedDepartment) return false;
			// Check overlap with current month
			const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
			const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
			const lrStart = new Date(lr.start_date);
			const lrEnd = new Date(lr.end_date);
			return lrStart <= monthEnd && lrEnd >= monthStart;
		})
	);

	const employeeNames = $derived(
		[...new Set(approvedLeave.map((lr) => `${lr.employee_id}|${lr.employee_name}`))].sort()
	);

	function getLeaveForEmployeeOnDay(empId: string, day: Date): LeaveRequest | undefined {
		return approvedLeave.find(
			(lr) => lr.employee_id === empId && dateInRange(day, lr.start_date, lr.end_date)
		);
	}

	const typeConfig: Record<LeaveType, { icon: any; color: string; border: string; label: string }> = {
		vakantie: { icon: Palmtree, color: 'bg-emerald-500', border: 'border-emerald-500/40', label: 'Vakantie' },
		verlofbudget: { icon: Clock, color: 'bg-blue-500', border: 'border-blue-500/40', label: 'Verlofbudget' },
		ziekte: { icon: HeartPulse, color: 'bg-red-500', border: 'border-red-500/40', label: 'Ziekte' },
		bijzonder: { icon: Sparkles, color: 'bg-violet-500', border: 'border-violet-500/40', label: 'Bijzonder' }
	};

	function getInitials(name: string): string {
		return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
	}
</script>

{#if loading}
	<div class="space-y-2 py-6">
		{#each Array(6) as _, i}
			<div class="h-10 animate-pulse rounded-xl bg-border/20" style="animation-delay: {i * 40}ms"></div>
		{/each}
	</div>
{:else}
	<div class="overflow-x-auto rounded-2xl border border-border bg-surface">
		<div class="min-w-[800px]">
			<!-- Day headers -->
			<div class="flex border-b border-border">
				<div class="sticky left-0 z-10 w-36 shrink-0 border-r border-border bg-surface px-3 py-2">
					<span class="text-[10px] font-bold tracking-[0.14em] text-text-subtle uppercase">Medewerker</span>
				</div>
				<div class="flex flex-1">
					{#each calendarDays as day}
						{@const dayOfWeek = day.getDay()}
						{@const isWknd = isWeekend(day)}
						{@const isToday = isSameDay(day, new Date())}
						<div
							class="flex min-w-[32px] flex-1 flex-col items-center border-r border-border/40 px-0.5 py-1.5 last:border-r-0
								{isWknd ? 'bg-border/15' : ''}
								{isToday ? 'bg-emerald-500/8' : ''}"
						>
							<span class="text-[9px] font-bold text-text-subtle">{DAY_NAMES[(dayOfWeek + 6) % 7]}</span>
							<span class="text-xs font-bold tabular-nums {isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-muted'}">{day.getDate()}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Employee rows -->
			{#if employeeNames.length === 0}
				<div class="flex items-center justify-center py-12 text-sm text-text-subtle">
					Geen goedgekeurde verlofaanvragen deze maand
				</div>
			{:else}
				{#each employeeNames as empStr}
					{@const [empId, ...nameParts] = empStr.split('|')}
					{@const empName = nameParts.join('|')}
					<div class="flex border-b border-border/40 last:border-b-0 transition-colors hover:bg-emerald-500/[0.02]">
						<div class="sticky left-0 z-10 w-36 shrink-0 border-r border-border/40 bg-surface px-3 py-2">
							<div class="flex items-center gap-2">
								<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/8 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
									{getInitials(empName)}
								</div>
								<span class="truncate text-xs font-bold text-text">{empName}</span>
							</div>
						</div>
						<div class="flex flex-1">
							{#each calendarDays as day}
								{@const leave = getLeaveForEmployeeOnDay(empId, day)}
								{@const isWknd = isWeekend(day)}
								{@const isToday = isSameDay(day, new Date())}
								<div
									class="relative min-w-[32px] flex-1 border-r border-border/30 last:border-r-0
										{isWknd ? 'bg-border/15' : ''}
										{isToday ? 'bg-emerald-500/5' : ''}"
								>
									{#if leave}
										{@const cfg = typeConfig[leave.type]}
										<div
											class="group/tooltip absolute inset-0.5 flex items-center justify-center rounded-md border {cfg.border} {cfg.color}/15 cursor-default"
										>
											<svelte:component this={cfg.icon} class="h-3 w-3 {leave.type === 'vakantie' ? 'text-emerald-600 dark:text-emerald-400' : leave.type === 'ziekte' ? 'text-red-600 dark:text-red-400' : leave.type === 'verlofbudget' ? 'text-blue-600 dark:text-blue-400' : 'text-violet-600 dark:text-violet-400'}" />
											<!-- Tooltip on hover -->
											<div class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-2 text-xs opacity-0 shadow-lg transition-opacity group-hover/tooltip:opacity-100">
												<div class="font-bold text-text">{empName}</div>
												<div class="text-text-muted">{cfg.label}</div>
												<div class="text-text-subtle">{leave.start_date} — {leave.end_date}</div>
												{#if leave.reason}
													<div class="mt-0.5 italic text-text-subtle">{leave.reason}</div>
												{/if}
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Legend -->
	<div class="mt-4 flex flex-wrap items-center gap-4">
		{#each Object.entries(typeConfig) as [type, cfg]}
			<div class="flex items-center gap-1.5">
				<div class="h-3.5 w-3.5 rounded-md border {cfg.border} {cfg.color}/15"></div>
				<span class="text-[11px] font-semibold text-text-muted">{cfg.label}</span>
			</div>
		{/each}
		<div class="ml-auto flex items-center gap-1.5">
			<div class="h-3.5 w-3.5 rounded-md bg-border/15"></div>
			<span class="text-[11px] font-semibold text-text-muted">Weekend</span>
		</div>
		<div class="flex items-center gap-1.5">
			<div class="h-3.5 w-3.5 rounded-md bg-emerald-500/8 ring-1 ring-emerald-500/20"></div>
			<span class="text-[11px] font-semibold text-text-muted">Vandaag</span>
		</div>
	</div>
{/if}
