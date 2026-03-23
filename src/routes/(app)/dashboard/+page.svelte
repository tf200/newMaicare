<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getAuthState } from '$lib/state/auth.svelte';
	import { onboarding } from '$lib/state/onboarding.svelte';
	import WelcomeModal from '$lib/components/ui/WelcomeModal.svelte';
	import {
		UsersRound,
		CalendarClock,
		ClipboardList,
		BarChart3,
		Sparkles,
		ChevronRight
	} from 'lucide-svelte';

	const auth = getAuthState();
	let showWelcome = $state(!onboarding.welcomeCompleted);

	function getTimeOfDay(): string {
		const hour = new Date().getHours();
		if (hour < 12) return m.dashboard_welcome_morning();
		if (hour < 18) return m.dashboard_welcome_afternoon();
		return m.dashboard_welcome_evening();
	}

	const userName = $derived.by(() => {
		const profile = auth.user;
		if (!profile) return '';
		const name = (profile as any).first_name || (profile as any).name || '';
		return name;
	});

	const quickStartItems = [
		{
			icon: UsersRound,
			label: m.dashboard_quick_start_add_client(),
			desc: m.dashboard_quick_start_add_client_desc(),
			href: '/clients',
			color: 'text-emerald-500',
			bg: 'bg-emerald-500/10',
			border: 'hover:border-emerald-500/30',
			permission: 'CLIENT.VIEW'
		},
		{
			icon: CalendarClock,
			label: m.dashboard_quick_start_schedule(),
			desc: m.dashboard_quick_start_schedule_desc(),
			href: '/schedules',
			color: 'text-indigo-500',
			bg: 'bg-indigo-500/10',
			border: 'hover:border-indigo-500/30',
			permission: 'DASHBOARD.VIEW'
		},
		{
			icon: ClipboardList,
			label: m.dashboard_quick_start_intake(),
			desc: m.dashboard_quick_start_intake_desc(),
			href: '/intakes',
			color: 'text-amber-500',
			bg: 'bg-amber-500/10',
			border: 'hover:border-amber-500/30',
			permission: 'CARE_COORDINATION.VIEW'
		},
		{
			icon: BarChart3,
			label: m.dashboard_quick_start_view_reports(),
			desc: m.dashboard_quick_start_view_reports_desc(),
			href: '/evaluations',
			color: 'text-sky-500',
			bg: 'bg-sky-500/10',
			border: 'hover:border-sky-500/30',
			permission: 'CARE_COORDINATION.VIEW'
		}
	];

	function handleWelcomeClose() {
		onboarding.markWelcomeCompleted();
		showWelcome = false;
	}
</script>

<svelte:head>
	<title>{m.dashboard()} | MaiCare</title>
</svelte:head>

{#if showWelcome}
	<WelcomeModal open={showWelcome} onClose={handleWelcomeClose} />
{/if}

<section class="space-y-8">
	<!-- Welcome Header -->
	<div
		class="relative overflow-hidden rounded-3xl border border-border/60 bg-glass-surface p-8 shadow-sm backdrop-blur-xl"
	>
		<div
			class="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-linear-to-br from-teal-500/10 to-emerald-500/5 blur-3xl"
		></div>
		<div class="relative">
			<div class="flex items-center gap-2 text-xs font-bold tracking-widest text-brand uppercase">
				<Sparkles class="h-4 w-4" />
				<span>{m.dashboard()}</span>
			</div>
			<h1 class="mt-2 text-3xl font-bold tracking-tight text-text">
				{userName
					? m.dashboard_welcome_title({ timeOfDay: getTimeOfDay(), name: userName })
					: m.dashboard()}
			</h1>
			<p class="mt-1 text-sm font-medium text-text-muted">{m.dashboard_welcome_subtitle()}</p>
			<div class="mt-4 flex items-center gap-2">
				<span class="relative flex h-2 w-2">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"
					></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
				</span>
				<span class="text-sm font-medium text-text-muted">{m.dashboard_workspace_ready()}</span>
			</div>
		</div>
	</div>

	<!-- Quick Start -->
	<div class="space-y-4">
		<h2 class="flex items-center gap-2 text-lg font-bold tracking-tight text-text">
			<Sparkles class="h-5 w-5 text-brand" />
			{m.dashboard_quick_start()}
		</h2>
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{#each quickStartItems as item (item.label)}
				<a
					href={item.href}
					class="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:shadow-md {item.border}"
				>
					<div class="flex items-start gap-4">
						<div
							class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl {item.bg} transition-transform duration-200 group-hover:scale-110"
						>
							<item.icon class="h-6 w-6 {item.color}" />
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1">
								<p class="text-sm font-bold text-text">{item.label}</p>
								<ChevronRight
									class="h-4 w-4 text-text-subtle opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
								/>
							</div>
							<p class="mt-1 line-clamp-2 text-xs font-medium text-text-muted">{item.desc}</p>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>

	<!-- Content Placeholder Grid (will be replaced with real data) -->
	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		<div class="rounded-3xl border border-border/60 bg-surface/60 p-6 shadow-sm backdrop-blur-xl">
			<div class="h-4 w-32 rounded-full bg-border/50"></div>
			<div class="mt-4 h-20 rounded-2xl bg-border/30"></div>
		</div>
		<div class="rounded-3xl border border-border/60 bg-surface/60 p-6 shadow-sm backdrop-blur-xl">
			<div class="h-4 w-24 rounded-full bg-border/50"></div>
			<div class="mt-4 h-20 rounded-2xl bg-border/30"></div>
		</div>
		<div class="rounded-3xl border border-border/60 bg-surface/60 p-6 shadow-sm backdrop-blur-xl">
			<div class="h-4 w-20 rounded-full bg-border/50"></div>
			<div class="mt-4 h-20 rounded-2xl bg-border/30"></div>
		</div>
	</div>
</section>
