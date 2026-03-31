<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getAuthState } from '$lib/state/auth.svelte';
	import { onboarding } from '$lib/state/onboarding.svelte';
	import WelcomeModal from '$lib/components/ui/WelcomeModal.svelte';
	import {
		UsersRound,
		UserCheck,
		FileText,
		Clock,
		Bell,
		ChevronDown,
		AlertTriangle,
		ArrowUpRight,
		Calendar,
		ClipboardList,
		BarChart3,
		CircleDot
	} from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { localizeHref } from '$lib/paraglide/runtime';

	const auth = getAuthState();
	let showWelcome = $state(!onboarding.welcomeCompleted);
	let notificationsExpanded = $state(true);

	function getTimeOfDay(): string {
		const hour = new Date().getHours();
		if (hour < 12) return m.dashboard_welcome_morning();
		if (hour < 18) return m.dashboard_welcome_afternoon();
		return m.dashboard_welcome_evening();
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
	const formattedDate = today.toLocaleDateString('nl-NL', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	const stats = [
		{
			label: 'Totaal Medewerkers',
			value: '124',
			sub: 'Actief in systeem',
			icon: UsersRound,
			color: 'text-brand'
		},
		{
			label: 'Aanwezig Vandaag',
			value: '98',
			sub: '79% aanwezigheid',
			icon: UserCheck,
			color: 'text-emerald-600'
		},
		{
			label: 'Documenten',
			value: '342',
			sub: '12 nieuw deze week',
			icon: FileText,
			color: 'text-indigo-500'
		},
		{
			label: 'In Afwachting',
			value: '17',
			sub: 'Actie vereist',
			icon: Clock,
			color: 'text-[var(--color-secondary)]'
		}
	];

	const notifications = [
		{
			type: 'Verlopen',
			label: 'BHV Certificaat',
			employee: 'Jan de Vries',
			date: '28 mrt 2026',
			severity: 'error' as const
		},
		{
			type: 'Verlopen',
			label: 'VOG Verklaring',
			employee: 'Lisa Bakker',
			date: '25 mrt 2026',
			severity: 'error' as const
		},
		{
			type: 'Bijna verlopen',
			label: 'Medische Verklaring',
			employee: 'Pieter Jansen',
			date: '05 apr 2026',
			severity: 'warning' as const
		},
		{
			type: 'Bijna verlopen',
			label: 'EHBO Certificaat',
			employee: 'Sophie Mulder',
			date: '12 apr 2026',
			severity: 'warning' as const
		},
		{
			type: 'Bijna verlopen',
			label: 'Autorisatie Medicatie',
			employee: 'Thomas Visser',
			date: '18 apr 2026',
			severity: 'warning' as const
		}
	];

	const employees = [
		{ name: 'Jan de Vries', role: 'Verzorgende IG', team: 'Wijkteam Noord', status: 'Actief' },
		{ name: 'Lisa Bakker', role: 'Verpleegkundige', team: 'Wijkteam Zuid', status: 'Actief' },
		{ name: 'Pieter Jansen', role: 'Helpende', team: 'Wijkteam Oost', status: 'Verlof' },
		{ name: 'Sophie Mulder', role: 'Verzorgende IG', team: 'Wijkteam West', status: 'Actief' },
		{ name: 'Thomas Visser', role: 'Verpleegkundige', team: 'Wijkteam Noord', status: 'Ziek' }
	];

	const events = [
		{ title: 'Teamoverleg Wijkteam Noord', time: '09:00', date: 'Vandaag', color: 'bg-brand' },
		{ title: 'Training BHV Herhaling', time: '13:30', date: 'Morgen', color: 'bg-indigo-500' },
		{
			title: 'Functioneringsgesprek - L. Bakker',
			time: '10:00',
			date: '2 apr',
			color: 'bg-[var(--color-secondary)]'
		},
		{ title: 'Vergadering Ondernemingsraad', time: '14:00', date: '5 apr', color: 'bg-rose-500' }
	];

	const quickActions = [
		{
			label: 'Cliënten',
			href: '/clients',
			icon: UsersRound,
			color: 'text-brand',
			bg: 'bg-brand/10'
		},
		{
			label: 'Roosters',
			href: '/schedules',
			icon: Calendar,
			color: 'text-indigo-500',
			bg: 'bg-indigo-500/10'
		},
		{
			label: 'Intakes',
			href: '/intakes',
			icon: ClipboardList,
			color: 'text-[var(--color-secondary)]',
			bg: 'bg-[var(--color-secondary)]/10'
		},
		{
			label: 'Rapporten',
			href: '/evaluations',
			icon: BarChart3,
			color: 'text-emerald-600',
			bg: 'bg-emerald-500/10'
		}
	];

	const statusClasses: Record<string, string> = {
		Actief: 'bg-emerald-50 text-emerald-600 ring-emerald-500/10',
		Verlof: 'bg-amber-50 text-amber-600 ring-amber-500/10',
		Ziek: 'bg-rose-50 text-rose-600 ring-rose-500/10'
	};

	const severityClasses: Record<string, string> = {
		error: 'bg-rose-50 text-rose-600 ring-rose-500/10',
		warning: 'bg-amber-50 text-amber-600 ring-amber-500/10'
	};
</script>

<svelte:head>
	<title>{m.dashboard()} | MaiCare</title>
</svelte:head>

{#if showWelcome}
	<WelcomeModal open={showWelcome} onClose={handleWelcomeClose} />
{/if}

<section class="space-y-6">
	<!-- Header -->
	<header class="relative flex flex-wrap items-end justify-between gap-4 px-1 pt-2 pb-2">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-text">
				{userName
					? m.dashboard_welcome_title({ timeOfDay: getTimeOfDay(), name: userName })
					: m.dashboard()}
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
			<span class="text-xs font-bold text-emerald-600">Actief</span>
		</div>
	</header>

	<!-- Stats -->
	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		{#each stats as stat (stat.label)}
			<div
				class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-brand/30"
			>
				<div
					class="absolute -right-4 -bottom-4 {stat.color} opacity-[0.03] transition-opacity group-hover:opacity-10 dark:opacity-5"
				>
					<stat.icon class="h-32 w-32" />
				</div>
				<div class="relative">
					<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{stat.label}
					</div>
					<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
						{stat.value}
					</div>
					<p class="mt-2 text-xs font-medium text-text-muted">{stat.sub}</p>
				</div>
			</div>
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
					<h2 class="text-base font-bold tracking-tight text-text">Vervalwaarschuwingen</h2>
					<p class="text-xs font-medium text-text-muted">
						{notifications.length} meldingen die aandacht vereisen
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
									<th class="px-6 py-3">Medewerker</th>
									<th class="px-6 py-3">Datum</th>
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
					<h2 class="text-base font-bold tracking-tight text-text">Medewerkers</h2>
					<p class="text-xs font-medium text-text-muted">Recent actieve medewerkers</p>
				</div>
				<a
					href={localizeHref('/employees')}
					class="group flex items-center gap-1 text-[11px] font-bold text-brand transition-colors hover:text-brand/80"
				>
					Bekijk alles
					<ArrowUpRight
						class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
					/>
				</a>
			</div>
			<div class="overflow-x-auto">
				<table class="min-w-full text-left">
					<thead class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						<tr>
							<th class="px-5 py-3">Naam</th>
							<th class="px-5 py-3">Functie</th>
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
											<p class="text-[11px] text-text-muted">{emp.team}</p>
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
				<h2 class="text-base font-bold tracking-tight text-text">Snelle Acties</h2>
				<p class="text-xs font-medium text-text-muted">Veelgebruikte handelingen</p>
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
				<h2 class="text-base font-bold tracking-tight text-text">Aankomende Evenementen</h2>
				<p class="text-xs font-medium text-text-muted">Deze week gepland</p>
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
