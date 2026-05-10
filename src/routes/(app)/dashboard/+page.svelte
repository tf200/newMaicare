<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import {
		AlertTriangle,
		BadgeEuro,
		BriefcaseMedical,
		Building2,
		CalendarClock,
		ChevronRight,
		Clock3,
		FileText,
		Plus,
		ReceiptText,
		ShieldAlert,
		Sparkles,
		UsersRound,
		UserRoundPlus,
		WalletCards
	} from 'lucide-svelte';
	import type { ComponentType } from 'svelte';

	type Tone = 'brand' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'secondary';
	type DateRange = 'Today' | '7 days' | '30 days';

	interface KpiCard {
		label: string;
		value: string;
		helper: string;
		tone: Tone;
		icon: ComponentType;
		risk?: boolean;
	}

	interface AttentionItem {
		title: string;
		meta: string;
		cta: string;
		tone: 'rose' | 'amber' | 'secondary';
	}

	interface LocationOccupancy {
		location: string;
		clients: number;
		capacity: number;
	}

	interface QuickAction {
		label: string;
		icon: ComponentType;
		href?: string;
	}

	const summary = {
		totalClients: 184,
		clientsInCare: 126,
		scheduledInCare: 12,
		waitingList: 31,
		outOfCare: 15,
		contractsEndingSoon: 8,
		activeEmployees: 74,
		subcontractors: 18,
		outOfService: 5,
		openLeaveRequests: 11,
		pendingIncidentConfirmations: 6,
		seriousFatalIncidents: 3,
		incidentsPast24h: 2,
		outstandingInvoiceBalance: 42850,
		overdueInvoices: 9
	};

	let selectedRange: DateRange = $state('Today');
	const dateRanges: DateRange[] = ['Today', '7 days', '30 days'];

	const kpis: KpiCard[] = [
		{
			label: 'Clients',
			value: String(summary.totalClients),
			helper: `${summary.clientsInCare} in care · ${summary.waitingList} waiting`,
			tone: 'brand',
			icon: UsersRound
		},
		{
			label: 'In care',
			value: String(summary.clientsInCare),
			helper: `${summary.scheduledInCare} scheduled admissions`,
			tone: 'emerald',
			icon: BriefcaseMedical
		},
		{
			label: 'Waiting list',
			value: String(summary.waitingList),
			helper: '5 waiting over 30 days',
			tone: 'amber',
			icon: Clock3,
			risk: true
		},
		{
			label: 'Employees',
			value: String(summary.activeEmployees),
			helper: `${summary.subcontractors} subcontractors · ${summary.outOfService} unavailable`,
			tone: 'cyan',
			icon: UserRoundPlus
		},
		{
			label: 'Safety',
			value: String(summary.pendingIncidentConfirmations),
			helper: `${summary.seriousFatalIncidents} serious/fatal · ${summary.incidentsPast24h} today`,
			tone: 'rose',
			icon: ShieldAlert,
			risk: true
		},
		{
			label: 'Billing',
			value: '€42.9k',
			helper: `${summary.overdueInvoices} overdue invoices`,
			tone: 'secondary',
			icon: BadgeEuro,
			risk: true
		}
	];

	const attentionItems: AttentionItem[] = [
		{
			title: 'Medication incident needs confirmation',
			meta: 'Yara Smit · Rotterdam Noord · 2 hours ago',
			cta: 'Confirm incident',
			tone: 'rose'
		},
		{
			title: 'Weekend leave creates coverage gap',
			meta: 'Aisha El Amrani · 3 shifts affected',
			cta: 'Review leave',
			tone: 'amber'
		},
		{
			title: 'INV-2026-0147 is 18 days overdue',
			meta: 'Gemeente Utrecht · €7,420',
			cta: 'Send reminder',
			tone: 'secondary'
		},
		{
			title: 'Bram van Dijk contract ends in 6 days',
			meta: 'Residential care · Amsterdam Centrum',
			cta: 'View contract',
			tone: 'amber'
		}
	];

	const locations: LocationOccupancy[] = [
		{ location: 'Amsterdam', clients: 31, capacity: 34 },
		{ location: 'Rotterdam', clients: 27, capacity: 30 },
		{ location: 'Utrecht', clients: 24, capacity: 28 },
		{ location: 'Den Haag', clients: 22, capacity: 24 },
		{ location: 'Eindhoven', clients: 16, capacity: 22 },
		{ location: 'Haarlem', clients: 18, capacity: 22 }
	];

	const quickActions: QuickAction[] = [
		{ label: 'Create client', icon: UserRoundPlus, href: '/clients' },
		{ label: 'Create employee', icon: UsersRound, href: '/employees' },
		{ label: 'Review leave', icon: CalendarClock },
		{ label: 'Create invoice', icon: ReceiptText, href: '/finances/invoices/new' },
		{ label: 'Generate invoices', icon: WalletCards },
		{ label: 'Auto-schedule', icon: Sparkles, href: '/schedules' },
		{ label: 'Create incident', icon: ShieldAlert, href: '/incidents' },
		{ label: 'Add location', icon: Building2, href: '/organization' }
	];

	const clientDistribution = [
		{ label: 'In care', value: 126, className: 'bg-emerald-500' },
		{ label: 'Scheduled', value: 12, className: 'bg-cyan-500' },
		{ label: 'Waiting', value: 31, className: 'bg-amber-500' },
		{ label: 'Out', value: 15, className: 'bg-zinc-400' }
	];

	const totalClientDistribution = clientDistribution.reduce((total, item) => total + item.value, 0);
	const maxLocationCapacity = Math.max(...locations.map((location) => location.capacity));
	const actionCount =
		summary.openLeaveRequests +
		summary.pendingIncidentConfirmations +
		summary.contractsEndingSoon +
		summary.overdueInvoices;

	const toneClasses: Record<Tone, string> = {
		brand: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400',
		emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
		amber: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
		rose: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
		cyan: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-700 dark:text-cyan-300',
		secondary: 'border-secondary/30 bg-secondary/10 text-secondary'
	};

	const attentionToneClasses: Record<AttentionItem['tone'], string> = {
		rose: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
		amber: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
		secondary: 'border-secondary/30 bg-secondary/10 text-secondary'
	};

	function occupancyPercent(location: LocationOccupancy): number {
		return Math.round((location.clients / location.capacity) * 100);
	}

	function capacityTone(location: LocationOccupancy): string {
		const occupancy = occupancyPercent(location);
		if (occupancy >= 90) return 'bg-rose-500';
		if (occupancy >= 80) return 'bg-amber-500';
		return 'bg-emerald-500';
	}
</script>

<svelte:head>
	<title>Admin Dashboard | MaiCare</title>
</svelte:head>

<section class="space-y-5 pb-6">
	<header class="rounded-3xl border border-border bg-surface p-5 shadow-sm lg:p-6">
		<div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
			<div>
				<div class="flex flex-wrap items-center gap-2">
					<span
						class="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold tracking-widest text-indigo-600 uppercase dark:text-indigo-300"
					>
						Admin overview
					</span>
					<span
						class="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300"
					>
						<span class="h-2 w-2 rounded-full bg-rose-500"></span>
						{actionCount} open items
					</span>
				</div>
				<h1 class="mt-3 text-3xl font-bold tracking-tighter text-text sm:text-4xl">
					Admin Dashboard
				</h1>
				<p class="mt-1 text-sm font-medium text-text-muted">
					Operational overview across care, staffing, safety, and billing
				</p>
			</div>

			<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
				<div
					class="inline-flex rounded-2xl border border-border bg-zinc-50 p-1 shadow-inner dark:bg-zinc-950"
					aria-label="Date range"
				>
					{#each dateRanges as range (range)}
						<button
							type="button"
							onclick={() => (selectedRange = range)}
							class={[
								'rounded-xl px-3 py-2 text-xs font-bold transition',
								selectedRange === range
									? 'bg-surface text-text shadow-sm ring-1 ring-border'
									: 'text-text-muted hover:text-text'
							]}
							aria-pressed={selectedRange === range}
						>
							{range}
						</button>
					{/each}
				</div>
				<Button variant="secondary" class="px-3 py-2 whitespace-nowrap">
					<FileText class="h-4 w-4" />
					Generate Report
				</Button>
			</div>
		</div>
	</header>

	<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
		{#each kpis as kpi (kpi.label)}
			<article
				class={[
					'rounded-2xl border bg-surface p-4 shadow-sm',
					kpi.risk ? toneClasses[kpi.tone] : 'border-border'
				]}
			>
				<div class="flex items-center justify-between gap-3">
					<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{kpi.label}
					</p>
					<span
						class={[
							'flex h-8 w-8 items-center justify-center rounded-xl border',
							toneClasses[kpi.tone]
						]}
					>
						<kpi.icon class="h-4 w-4" />
					</span>
				</div>
				<p class="mt-1 text-2xl font-bold tracking-tight text-text">{kpi.value}</p>
				<p class="mt-1 line-clamp-1 text-xs font-medium text-text-muted">{kpi.helper}</p>
			</article>
		{/each}
	</div>

	<div class="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
		<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="flex items-center justify-between gap-4">
				<div>
					<p class="text-xs font-bold tracking-widest text-text-subtle uppercase">
						Needs Attention
					</p>
					<h2 class="mt-1 text-lg font-bold tracking-tight text-text">Top admin actions</h2>
				</div>
				<AlertTriangle class="h-5 w-5 text-secondary" />
			</div>

			<div class="mt-4 divide-y divide-border">
				{#each attentionItems as item (item.title)}
					<div class="grid gap-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
						<div class="min-w-0">
							<div class="flex items-center gap-2">
								<span class={['h-2.5 w-2.5 rounded-full border', attentionToneClasses[item.tone]]}
								></span>
								<p class="truncate text-sm font-bold text-text">{item.title}</p>
							</div>
							<p class="mt-1 truncate pl-4 text-xs font-medium text-text-muted">{item.meta}</p>
						</div>
						<button
							type="button"
							class="inline-flex items-center gap-1 text-xs font-bold text-brand transition hover:gap-2"
						>
							{item.cta}<ChevronRight class="h-3.5 w-3.5" />
						</button>
					</div>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="flex items-center justify-between gap-4">
				<div>
					<p class="text-xs font-bold tracking-widest text-text-subtle uppercase">Quick Actions</p>
					<h2 class="mt-1 text-lg font-bold tracking-tight text-text">Common tasks</h2>
				</div>
				<Plus class="h-5 w-5 text-brand" />
			</div>
			<div class="mt-4 grid grid-cols-2 gap-2">
				{#each quickActions as action (action.label)}
					{#if action.href}
						<a
							href={action.href}
							class="flex items-center gap-2 rounded-2xl border border-border bg-zinc-50/70 px-3 py-2.5 text-xs font-bold text-text transition hover:border-indigo-500/30 hover:bg-indigo-500/5 dark:bg-zinc-950/50"
						>
							<action.icon class="h-4 w-4 shrink-0 text-brand" />
							<span class="truncate">{action.label}</span>
						</a>
					{:else}
						<button
							type="button"
							class="flex items-center gap-2 rounded-2xl border border-border bg-zinc-50/70 px-3 py-2.5 text-left text-xs font-bold text-text transition hover:border-indigo-500/30 hover:bg-indigo-500/5 dark:bg-zinc-950/50"
						>
							<action.icon class="h-4 w-4 shrink-0 text-brand" />
							<span class="truncate">{action.label}</span>
						</button>
					{/if}
				{/each}
			</div>
		</section>
	</div>

	<div class="grid gap-5 xl:grid-cols-3">
		<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<p class="text-xs font-bold tracking-widest text-text-subtle uppercase">Client Mix</p>
			<h2 class="mt-1 text-lg font-bold tracking-tight text-text">Status distribution</h2>
			<div class="mt-4 space-y-3">
				{#each clientDistribution as item (item.label)}
					<div>
						<div class="mb-1 flex justify-between text-xs font-bold text-text">
							<span>{item.label}</span>
							<span>{item.value}</span>
						</div>
						<div class="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
							<div
								class={['h-2 rounded-full', item.className]}
								style:width={`${(item.value / totalClientDistribution) * 100}%`}
							></div>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<p class="text-xs font-bold tracking-widest text-text-subtle uppercase">Capacity</p>
			<h2 class="mt-1 text-lg font-bold tracking-tight text-text">Locations near limit</h2>
			<div class="mt-4 space-y-3">
				{#each locations as location (location.location)}
					<div class="grid grid-cols-[82px_1fr_42px] items-center gap-3">
						<p class="truncate text-xs font-bold text-text">{location.location}</p>
						<div class="relative h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
							<div
								class="absolute inset-y-0 left-0 rounded-full bg-indigo-500/15"
								style:width={`${(location.capacity / maxLocationCapacity) * 100}%`}
							></div>
							<div
								class={['absolute inset-y-0 left-0 rounded-full', capacityTone(location)]}
								style:width={`${occupancyPercent(location)}%`}
							></div>
						</div>
						<p class="text-right text-xs font-bold text-text">{occupancyPercent(location)}%</p>
					</div>
				{/each}
			</div>
		</section>

		<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<p class="text-xs font-bold tracking-widest text-text-subtle uppercase">Billing</p>
			<h2 class="mt-1 text-lg font-bold tracking-tight text-text">Follow-up summary</h2>
			<div class="mt-4 grid gap-3">
				<div class="rounded-2xl border border-secondary/20 bg-secondary/10 p-4">
					<p class="text-xs font-bold text-secondary">Outstanding balance</p>
					<p class="mt-1 text-2xl font-bold tracking-tight text-text">€42,850</p>
					<p class="mt-1 text-xs font-medium text-text-muted">9 overdue invoices need reminders</p>
				</div>
				<div class="grid grid-cols-2 gap-3 text-xs">
					<div class="rounded-2xl border border-border bg-zinc-50/70 p-3 dark:bg-zinc-950/50">
						<p class="font-bold text-text">Contracts</p>
						<p class="mt-1 text-text-muted">8 ending soon</p>
					</div>
					<div class="rounded-2xl border border-border bg-zinc-50/70 p-3 dark:bg-zinc-950/50">
						<p class="font-bold text-text">Leave</p>
						<p class="mt-1 text-text-muted">11 requests open</p>
					</div>
				</div>
			</div>
		</section>
	</div>
</section>
