<script lang="ts">
	import StatsCard from '$lib/components/ui/StatsCard.svelte';
	import { getAuthState } from '$lib/state/auth.svelte';
	import { onboarding } from '$lib/state/onboarding.svelte';
	import WelcomeModal from '$lib/components/ui/WelcomeModal.svelte';
	import {
		UsersRound,
		UserCheck,
		FileWarning,
		Bell,
		ChevronDown,
		AlertTriangle,
		ArrowUpRight,
		Calendar,
		Clock,
		CircleDot,
		Plane,
		BookOpen
	} from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { localizeHref } from '$lib/paraglide/runtime';

	const auth = getAuthState();
	let showWelcome = $state(!onboarding.welcomeCompleted);
	let notificationsExpanded = $state(true);

	function getTimeOfDay(): string {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	}

	const userName = $derived.by(() => {
		const profile = auth.user;
		if (!profile) return '';
		return (profile as any).first_name || (profile as any).name || '';
	});

	function handleWelcomeClose() {
		onboarding.markWelcomeCompleted();
		showWelcome = false;
	}

	const today = new Date();
	const formattedDate = today.toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	const stats = [
		{
			label: 'Total Employees',
			value: '124',
			sub: 'Active in system',
			icon: UsersRound,
			color: 'text-brand'
		},
		{
			label: 'Present Today',
			value: '98',
			sub: '79% attendance',
			icon: UserCheck,
			color: 'text-emerald-600'
		},
		{
			label: 'On Leave',
			value: '12',
			sub: '3 returning this week',
			icon: Plane,
			color: 'text-indigo-500'
		},
		{
			label: 'Expiring Soon',
			value: '17',
			sub: 'Documents & certifications',
			icon: FileWarning,
			color: 'text-[var(--color-secondary)]'
		}
	];

	const notifications = [
		{
			type: 'Expired',
			label: 'Safety Certificate',
			employee: 'Jan de Vries',
			date: 'Mar 28, 2026',
			severity: 'error' as const
		},
		{
			type: 'Expired',
			label: 'Background Check',
			employee: 'Lisa Bakker',
			date: 'Mar 25, 2026',
			severity: 'error' as const
		},
		{
			type: 'Expiring',
			label: 'Medical Certificate',
			employee: 'Pieter Jansen',
			date: 'Apr 5, 2026',
			severity: 'warning' as const
		},
		{
			type: 'Expiring',
			label: 'First Aid Qualification',
			employee: 'Sophie Mulder',
			date: 'Apr 12, 2026',
			severity: 'warning' as const
		},
		{
			type: 'Expiring',
			label: 'Medication Authorization',
			employee: 'Thomas Visser',
			date: 'Apr 18, 2026',
			severity: 'warning' as const
		}
	];

	const employees = [
		{ name: 'Jan de Vries', role: 'Caregiver', department: 'Team North', status: 'Active' },
		{ name: 'Lisa Bakker', role: 'Nurse', department: 'Team South', status: 'Active' },
		{ name: 'Pieter Jansen', role: 'Assistant', department: 'Team East', status: 'On Leave' },
		{ name: 'Sophie Mulder', role: 'Caregiver', department: 'Team West', status: 'Active' },
		{ name: 'Thomas Visser', role: 'Nurse', department: 'Team North', status: 'Sick' }
	];

	const events = [
		{ title: 'Team Standup - Team North', time: '09:00', date: 'Today', color: 'bg-brand' },
		{ title: 'Safety Training Refresher', time: '13:30', date: 'Tomorrow', color: 'bg-indigo-500' },
		{
			title: 'Performance Review - L. Bakker',
			time: '10:00',
			date: 'Apr 2',
			color: 'bg-[var(--color-secondary)]'
		},
		{ title: 'Works Council Meeting', time: '14:00', date: 'Apr 5', color: 'bg-rose-500' }
	];

	const quickActions = [
		{
			label: 'Employees',
			href: '/employees',
			icon: UsersRound,
			color: 'text-brand',
			bg: 'bg-brand/10'
		},
		{
			label: 'Schedules',
			href: '/schedules',
			icon: Calendar,
			color: 'text-indigo-500',
			bg: 'bg-indigo-500/10'
		},
		{
			label: 'Leave',
			href: '/leave-management',
			icon: Plane,
			color: 'text-[var(--color-secondary)]',
			bg: 'bg-[var(--color-secondary)]/10'
		},
		{
			label: 'Handbooks',
			href: '/employees/handbooks',
			icon: BookOpen,
			color: 'text-emerald-600',
			bg: 'bg-emerald-500/10'
		}
	];

	const statusClasses: Record<string, string> = {
		Active: 'bg-emerald-50 text-emerald-600 ring-emerald-500/10',
		'On Leave': 'bg-amber-50 text-amber-600 ring-amber-500/10',
		Sick: 'bg-rose-50 text-rose-600 ring-rose-500/10'
	};

	const severityClasses: Record<string, string> = {
		error: 'bg-rose-50 text-rose-600 ring-rose-500/10',
		warning: 'bg-amber-50 text-amber-600 ring-amber-500/10'
	};
</script>

<svelte:head>
	<title>Dashboard | MaiCare</title>
</svelte:head>

{#if showWelcome}
	<WelcomeModal open={showWelcome} onClose={handleWelcomeClose} />
{/if}

<section class="space-y-6">
	<!-- Header -->
	<header class="relative flex flex-wrap items-end justify-between gap-4 px-1 pt-2 pb-2">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-text">
				{userName ? `${getTimeOfDay()}, ${userName}` : 'Dashboard'}
			</h1>
			<p class="mt-1 text-sm font-medium text-text-muted">{formattedDate}</p>
		</div>
		<div
			class="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5"
		>
			<span class="relative flex h-2 w-2">
				<span
					class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
				></span>
				<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
			</span>
			<span class="text-xs font-bold text-emerald-600">Active</span>
		</div>
	</header>

	<!-- Stats -->
	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		{#each stats as stat (stat.label)}
			<StatsCard
				label={stat.label}
				value={stat.value}
				sub={stat.sub}
				icon={stat.icon}
				color={stat.color}
			/>
		{/each}
	</div>

	<!-- Notifications -->
	<div class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
		<button
			onclick={() => (notificationsExpanded = !notificationsExpanded)}
			class="flex w-full items-center justify-between p-5 text-left transition-colors duration-200 hover:bg-border/10"
		>
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10">
					<Bell class="h-5 w-5 text-rose-500" />
				</div>
				<div>
					<h2 class="text-base font-bold tracking-tight text-text">Document Alerts</h2>
					<p class="text-xs font-medium text-text-muted">
						{notifications.length} items requiring attention
					</p>
				</div>
			</div>
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-border/30">
				<ChevronDown
					class="h-4 w-4 text-text-muted transition-transform duration-300 {notificationsExpanded
						? 'rotate-180'
						: ''}"
				/>
			</div>
		</button>

		{#if notificationsExpanded}
			<div transition:slide={{ duration: 300 }}>
				<div class="border-t border-border">
					<div class="overflow-x-auto">
						<table class="min-w-full text-left">
							<thead class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
								<tr>
									<th class="px-6 py-3">Status</th>
									<th class="px-6 py-3">Document</th>
									<th class="px-6 py-3">Employee</th>
									<th class="px-6 py-3">Date</th>
								</tr>
							</thead>
							<tbody>
								{#each notifications as notif, i (`${notif.employee}-${i}`)}
									<tr
										class="border-t border-border/50 transition-colors duration-200 hover:bg-border/10"
									>
										<td class="px-6 py-3.5">
											<span
												class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold ring-1 {severityClasses[
													notif.severity
												]}"
											>
												{#if notif.severity === 'error'}
													<AlertTriangle class="h-3 w-3" />
												{:else}
													<Clock class="h-3 w-3" />
												{/if}
												{notif.type}
											</span>
										</td>
										<td class="px-6 py-3.5 text-sm font-semibold text-text">{notif.label}</td>
										<td class="px-6 py-3.5 text-sm font-medium text-text-muted">{notif.employee}</td
										>
										<td class="px-6 py-3.5 text-sm font-medium text-text-muted">{notif.date}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Content Grid -->
	<div class="grid gap-4 lg:grid-cols-3">
		<!-- Employees -->
		<div class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
			<div class="flex items-center justify-between border-b border-border p-5">
				<div>
					<h2 class="text-base font-bold tracking-tight text-text">Employees</h2>
					<p class="text-xs font-medium text-text-muted">Recently active team members</p>
				</div>
				<a
					href={localizeHref('/employees')}
					class="group flex items-center gap-1 text-[11px] font-bold text-brand transition-colors hover:text-brand/80"
				>
					View all
					<ArrowUpRight
						class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
					/>
				</a>
			</div>
			<div class="overflow-x-auto">
				<table class="min-w-full text-left">
					<thead class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						<tr>
							<th class="px-5 py-3">Name</th>
							<th class="px-5 py-3">Role</th>
							<th class="px-5 py-3">Status</th>
						</tr>
					</thead>
					<tbody>
						{#each employees as emp (emp.name)}
							<tr
								class="border-t border-border/50 transition-colors duration-200 hover:bg-border/10"
							>
								<td class="px-5 py-3.5">
									<div class="flex items-center gap-3">
										<div
											class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand ring-1 ring-brand/20"
										>
											{emp.name
												.split(' ')
												.map((n) => n[0])
												.join('')
												.slice(0, 2)}
										</div>
										<div>
											<p class="text-sm font-semibold text-text">{emp.name}</p>
											<p class="text-[11px] text-text-muted">{emp.department}</p>
										</div>
									</div>
								</td>
								<td class="px-5 py-3.5 text-sm font-medium text-text-muted">{emp.role}</td>
								<td class="px-5 py-3.5">
									<span
										class="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold ring-1 {statusClasses[
											emp.status
										] ?? 'bg-zinc-50 text-zinc-600 ring-zinc-500/10'}"
									>
										{emp.status}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
			<div class="border-b border-border p-5">
				<h2 class="text-base font-bold tracking-tight text-text">Quick Actions</h2>
				<p class="text-xs font-medium text-text-muted">Common tasks</p>
			</div>
			<div class="grid grid-cols-2 gap-3 p-5">
				{#each quickActions as action (action.label)}
					<a
						href={localizeHref(action.href)}
						class="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-5 text-center transition-all duration-200 hover:border-brand/30 hover:shadow-sm"
					>
						<div
							class="flex h-11 w-11 items-center justify-center rounded-2xl {action.bg} transition-transform duration-200 group-hover:scale-110"
						>
							<action.icon class="h-5 w-5 {action.color}" />
						</div>
						<span class="text-xs font-bold text-text">{action.label}</span>
					</a>
				{/each}
			</div>
		</div>

		<!-- Events -->
		<div class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
			<div class="border-b border-border p-5">
				<h2 class="text-base font-bold tracking-tight text-text">Upcoming Events</h2>
				<p class="text-xs font-medium text-text-muted">Scheduled this week</p>
			</div>
			<div class="p-5">
				{#each events as event, i (event.title)}
					<div class="relative flex gap-4 pb-5 last:pb-0">
						<div class="flex flex-col items-center">
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {event.color}/10"
							>
								<CircleDot class="h-4 w-4 {event.color.replace('bg-', 'text-')}" />
							</div>
							{#if i < events.length - 1}
								<div class="my-1 w-px flex-1 bg-border/50"></div>
							{/if}
						</div>
						<div class="min-w-0 flex-1 pt-1">
							<p class="text-sm font-semibold text-text">{event.title}</p>
							<div class="mt-1 flex items-center gap-2">
								<span class="text-xs font-medium text-text-muted">{event.date}</span>
								<span class="text-xs text-text-subtle">•</span>
								<span class="text-xs font-medium text-text-muted">{event.time}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
