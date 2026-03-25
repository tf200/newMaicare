<script lang="ts">
	import { CalendarClock, ClipboardList, CreditCard, Flag, TimerReset, UserRoundCog } from 'lucide-svelte';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import type { ClientOverviewStatus } from '$lib/mock/client-overview';
	import type { ClientOverviewViewModel, OverviewMetric, OverviewMetricKind } from '../../overview.shared';

	interface Props {
		overview: ClientOverviewViewModel;
	}

	let { overview }: Props = $props();

	const resolveLocale = () => (getLocale() === 'nl' ? 'nl-NL' : 'en-GB');
	const formatDate = (dateString?: string) => {
		if (!dateString || dateString === '—') return m.not_available_short();
		const date = new Date(dateString);
		if (Number.isNaN(date.getTime())) return dateString;
		return date.toLocaleDateString(resolveLocale(), {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};
	const formatDayCount = (dateString: string) => {
		const waitlistDate = new Date(dateString);
		if (Number.isNaN(waitlistDate.getTime())) return m.not_available_short();
		const days = Math.max(0, Math.floor((Date.now() - waitlistDate.getTime()) / 86400000));
		return m.days_on_waitlist_value({ count: days, unit: days === 1 ? m.day_lower() : m.days_lower() });
	};

	const metricLabel = (kind: OverviewMetricKind) => {
		switch (kind) {
			case 'waitlist_since': return m.waitlist_since();
			case 'days_on_waitlist': return m.days_on_waitlist();
			case 'start_date': return m.start_date();
			case 'last_evaluation': return m.last_evaluation_short();
			case 'next_evaluation': return m.next_evaluation_short();
			case 'discharge_date': return m.discharge_date();
			case 'coordinator': return m.care_coordinator();
			case 'contract_status': return m.status();
			case 'intake_conclusion': return m.intake_conclusion();
		}
	};

	const metricValue = (metric: OverviewMetric) => {
		if (metric.kind === 'days_on_waitlist') return metric.value === '—' ? m.not_available_short() : formatDayCount(metric.value);
		if (metric.kind === 'coordinator' || metric.kind === 'contract_status' || metric.kind === 'intake_conclusion') return metric.value;
		return formatDate(metric.value);
	};

	const metricIcon = (kind: OverviewMetricKind) => {
		switch (kind) {
			case 'waitlist_since': return CalendarClock;
			case 'days_on_waitlist': return TimerReset;
			case 'start_date': return Flag;
			case 'last_evaluation': return ClipboardList;
			case 'next_evaluation': return ClipboardList;
			case 'discharge_date': return Flag;
			case 'coordinator': return UserRoundCog;
			case 'contract_status': return CreditCard;
			case 'intake_conclusion': return ClipboardList;
		}
	};

	const panelContent: Record<ClientOverviewStatus, { title: string; description: string; accent: string }> = {
		on_waiting_list: {
			title: 'Waitlist readiness',
			description: 'Keep intake, waitlist timing, and onboarding blockers in one place instead of scattering this across the hero and cards.',
			accent: 'from-amber-500/10 to-orange-500/5'
		},
		scheduled_in_care: {
			title: 'Admission readiness',
			description: 'Focus the scheduled-in-care state on coordinator assignment, start timing, and remaining onboarding context.',
			accent: 'from-blue-500/10 to-cyan-500/5'
		},
		in_care: {
			title: 'Active care rhythm',
			description: 'The in-care version emphasizes evaluation cadence and contract health instead of onboarding details.',
			accent: 'from-emerald-500/10 to-teal-500/5'
		},
		scheduled_out_of_care: {
			title: 'Discharge preparation',
			description: 'This version centers discharge timing and closure readiness without changing the rest of the page layout.',
			accent: 'from-purple-500/10 to-fuchsia-500/5'
		},
		out_of_care: {
			title: 'Closure snapshot',
			description: 'Keep the same shell, but switch the summary to closure and archival context once the client is out of care.',
			accent: 'from-zinc-500/10 to-zinc-500/5'
		}
	};
	const config = $derived(panelContent[overview.status]);
</script>
<section class={`overflow-hidden rounded-3xl border border-border bg-gradient-to-br ${config.accent} shadow-sm`}>
	<div class="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)] lg:p-8">
		<div>
			<p class="text-[11px] font-bold tracking-[0.18em] text-text-subtle uppercase">Lifecycle Panel</p>
			<h2 class="mt-3 text-2xl font-bold tracking-tight text-text">{config.title}</h2>
			<p class="mt-3 max-w-xl text-sm leading-6 text-text-muted">{config.description}</p>
		</div>

		<div class="grid gap-3 sm:grid-cols-3">
			{#each overview.lifecycleMetrics as metric (`${metric.kind}-${metric.value}`)}
				{@const Icon = metricIcon(metric.kind)}
				<div class="rounded-2xl border border-border/60 bg-surface/90 p-4 shadow-sm">
					<div class="flex items-center gap-2 text-text-subtle">
						<Icon class="h-4 w-4" />
						<span class="text-[10px] font-bold tracking-[0.16em] uppercase">{metricLabel(metric.kind)}</span>
					</div>
					<p class="mt-3 text-sm font-bold text-text">{metricValue(metric)}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
