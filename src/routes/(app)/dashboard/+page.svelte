<script lang="ts">
	import { getAuthState } from '$lib/state/auth.svelte';
	import { onboarding } from '$lib/state/onboarding.svelte';
	import WelcomeModal from '$lib/components/ui/WelcomeModal.svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import {
		AlertCircle,
		ArrowRight,
		Calendar,
		Clock,
		FileText,
		Users,
		ShieldAlert
	} from 'lucide-svelte';

	const auth = getAuthState();
	let showWelcome = $state(!onboarding.welcomeCompleted);

	const userName = $derived.by(() => {
		const profile = auth.user;
		if (!profile) return 'Team';
		return (profile as any).first_name || (profile as any).name || 'Team';
	});

	function getTimeOfDay(): string {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	}

	function handleWelcomeClose() {
		onboarding.markWelcomeCompleted();
		showWelcome = false;
	}

	const today = new Date();
	const formattedDate = today.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});

	// Static Data
	const metrics = {
		present: 98,
		total: 124,
		onLeave: 12,
		sick: 4
	};

	const attentionItems = [
		{ type: 'expired', title: 'Safety Certificate Expired', person: 'Jan de Vries', time: '2 days ago' },
		{ type: 'expiring', title: 'Background Check Due', person: 'Lisa Bakker', time: 'In 3 days' },
		{ type: 'sick', title: 'Reported Sick', person: 'Thomas Visser', time: 'Today, 07:30' }
	];

	const upcomingShifts = [
		{ role: 'Caregiver', person: 'Sophie Mulder', time: '14:00 - 22:00', location: 'Team West' },
		{ role: 'Nurse', person: 'Lisa Bakker', time: '15:00 - 23:00', location: 'Team South' },
		{ role: 'Assistant', person: 'Emma de Jong', time: '22:00 - 06:00', location: 'Night Shift' }
	];
</script>

<svelte:head>
	<title>Overview | MaiCare</title>
</svelte:head>

{#if showWelcome}
	<WelcomeModal open={showWelcome} onClose={handleWelcomeClose} />
{/if}

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Hero Section: Narrative instead of cards -->
	<header class="mb-16 max-w-4xl">
		<p class="mb-3 text-[11px] font-bold tracking-widest text-text-muted uppercase">{formattedDate}</p>
		<h1 class="mb-5 text-4xl font-light tracking-tight text-text sm:text-5xl lg:text-6xl">
			{getTimeOfDay()}, <span class="font-medium">{userName}</span>.
		</h1>
		<p class="text-lg leading-relaxed text-text-muted sm:text-xl">
			You have <strong class="font-medium text-text">{attentionItems.length} items</strong> requiring attention today.
			Currently, <strong class="font-medium text-text">{metrics.present}</strong> staff members are present, and
			<strong class="font-medium text-text">{metrics.sick}</strong> are reported sick.
		</p>
	</header>

	<div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
		<!-- Left Column: Primary Focus -->
		<div class="space-y-16 lg:col-span-7 xl:col-span-8">
			
			<!-- Attention Required -->
			<section>
				<div class="mb-6 flex items-center justify-between border-b border-border/50 pb-4">
					<h2 class="text-base font-medium text-text">Requires Attention</h2>
					<span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/10 text-[11px] font-bold text-rose-600">
						{attentionItems.length}
					</span>
				</div>
				<div class="space-y-2">
					{#each attentionItems as item}
						<div class="group relative flex items-start gap-5 rounded-3xl p-5 transition-all duration-300 hover:bg-surface border border-transparent hover:border-border hover:shadow-sm">
							<div class="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl {item.type === 'expired' ? 'bg-rose-500/10 text-rose-600' : item.type === 'sick' ? 'bg-amber-500/10 text-amber-600' : 'bg-brand/10 text-brand'}">
								{#if item.type === 'expired'}
									<ShieldAlert class="h-6 w-6" />
								{:else if item.type === 'sick'}
									<AlertCircle class="h-6 w-6" />
								{:else}
									<Clock class="h-6 w-6" />
								{/if}
							</div>
							<div class="flex-1">
								<h3 class="text-[15px] font-medium text-text">{item.title}</h3>
								<div class="mt-1.5 flex items-center gap-2 text-[13px] text-text-muted">
									<span class="font-medium text-text">{item.person}</span>
									<span class="text-border">•</span>
									<span>{item.time}</span>
								</div>
							</div>
							<button class="opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 flex h-9 w-9 items-center justify-center rounded-full hover:bg-border/50 text-text-muted hover:text-text" aria-label="View Details">
								<ArrowRight class="h-4 w-4" />
							</button>
						</div>
					{/each}
				</div>
			</section>

			<!-- Today's Attendance Overview -->
			<section>
				<div class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
					<h2 class="text-base font-medium text-text">Attendance Pulse</h2>
					<a href={localizeHref('/employees')} class="group flex items-center gap-1.5 text-[11px] font-bold text-brand uppercase tracking-wider transition-colors hover:text-brand/80">
						View all staff
						<ArrowRight class="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
					</a>
				</div>
				
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div class="rounded-3xl bg-surface p-6 border border-border transition-all hover:border-border/80 hover:shadow-sm">
						<p class="text-[13px] font-medium text-text-muted mb-3">Present</p>
						<p class="text-4xl font-light text-text">{metrics.present}<span class="text-lg text-text-muted ml-1">/{metrics.total}</span></p>
					</div>
					<div class="rounded-3xl bg-surface p-6 border border-border transition-all hover:border-border/80 hover:shadow-sm">
						<p class="text-[13px] font-medium text-text-muted mb-3">On Leave</p>
						<p class="text-4xl font-light text-text">{metrics.onLeave}</p>
					</div>
					<div class="rounded-3xl bg-surface p-6 border border-border transition-all hover:border-border/80 hover:shadow-sm">
						<p class="text-[13px] font-medium text-text-muted mb-3">Sick</p>
						<p class="text-4xl font-light text-rose-600">{metrics.sick}</p>
					</div>
					<div class="rounded-3xl bg-brand/5 p-6 border border-brand/10 transition-all hover:border-brand/20">
						<p class="text-[13px] font-medium text-brand/80 mb-3">Coverage</p>
						<p class="text-4xl font-light text-brand">92%</p>
					</div>
				</div>
			</section>
		</div>

		<!-- Right Column: Secondary Information -->
		<div class="space-y-8 lg:col-span-5 xl:col-span-4">
			
			<!-- Quick Actions -->
			<div class="rounded-[2rem] bg-surface p-8 border border-border/60">
				<h3 class="mb-6 text-[11px] font-bold tracking-widest text-text-muted uppercase">Quick Actions</h3>
				<div class="flex flex-col gap-2">
					<a href={localizeHref('/schedules')} class="group flex items-center justify-between rounded-2xl p-3 -mx-3 hover:bg-border/30 transition-colors">
						<div class="flex items-center gap-4">
							<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 transition-transform group-hover:scale-105">
								<Calendar class="h-4.5 w-4.5" />
							</div>
							<span class="text-[14px] font-medium text-text">Manage Schedules</span>
						</div>
						<ArrowRight class="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
					</a>
					<a href={localizeHref('/leave-management')} class="group flex items-center justify-between rounded-2xl p-3 -mx-3 hover:bg-border/30 transition-colors">
						<div class="flex items-center gap-4">
							<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-105">
								<Users class="h-4.5 w-4.5" />
							</div>
							<span class="text-[14px] font-medium text-text">Review Leave Requests</span>
						</div>
						<ArrowRight class="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
					</a>
					<a href={localizeHref('/employees/handbooks')} class="group flex items-center justify-between rounded-2xl p-3 -mx-3 hover:bg-border/30 transition-colors">
						<div class="flex items-center gap-4">
							<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 transition-transform group-hover:scale-105">
								<FileText class="h-4.5 w-4.5" />
							</div>
							<span class="text-[14px] font-medium text-text">Update Handbooks</span>
						</div>
						<ArrowRight class="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
					</a>
				</div>
			</div>

			<!-- Upcoming Shifts -->
			<div class="rounded-[2rem] bg-surface p-8 border border-border/60">
				<div class="mb-8 flex flex-wrap items-end justify-between gap-2">
					<h3 class="text-[11px] font-bold tracking-widest text-text-muted uppercase">Upcoming Shifts</h3>
					<span class="text-[11px] font-medium text-text-muted">Later Today</span>
				</div>
				<div class="space-y-6">
					{#each upcomingShifts as shift, i}
						<div class="group relative flex items-start gap-5">
							<div class="flex flex-col items-center">
								<div class="h-3 w-3 rounded-full border-[2px] border-brand bg-surface mt-1.5 transition-colors group-hover:bg-brand"></div>
								{#if i !== upcomingShifts.length - 1}
									<div class="my-2 h-full min-h-12 w-[2px] rounded-full bg-border/50"></div>
								{/if}
							</div>
							<div class="pb-1">
								<p class="text-[13px] font-bold text-text">{shift.time}</p>
								<p class="mt-1 text-[14px] text-text-muted">
									<span class="font-medium text-text">{shift.person}</span> <span class="text-border mx-1.5">•</span> {shift.role}
								</p>
								<p class="mt-1 text-[12px] text-text-subtle">{shift.location}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

		</div>
	</div>
</div>
