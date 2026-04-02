<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { addMonths, subMonths } from 'date-fns';
	import type { LeaveRequest } from '$lib/types/api/vakantiekalender';
	import CalendarHeader from './_components/CalendarHeader.svelte';
	import CalendarGrid from './_components/CalendarGrid.svelte';
	import { listMockLeaveRequests } from '$lib/api/vakantiekalender.mock';
	import { m } from '$lib/paraglide/messages';

	let leaveRequests = $state<LeaveRequest[]>([]);
	let loading = $state(true);
	let currentMonth = $state(new Date());
	let selectedDepartment = $state('all');

	async function loadData() {
		loading = true;
		try {
			const res = await listMockLeaveRequests();
			leaveRequests = res.data;
		} catch {
			leaveRequests = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void loadData();
	});

	const departments = $derived(
		[...new Set(leaveRequests.map((lr) => lr.department))].filter(Boolean).sort() as string[]
	);

	const filteredLeave = $derived(
		selectedDepartment === 'all'
			? leaveRequests
			: leaveRequests.filter((lr) => lr.department === selectedDepartment)
	);

	const monthLabel = $derived(
		new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(currentMonth)
	);

	function navigate(dir: 'prev' | 'next') {
		currentMonth = dir === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);
	}
</script>

<svelte:head>
	<title>{m.vac_label()} | MaiCare</title>
</svelte:head>

<section class="space-y-6">
	<!-- Header -->
	<header class="relative overflow-hidden rounded-3xl">
		<div
			class="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 dark:from-emerald-900 dark:via-emerald-950 dark:to-teal-950"
		></div>
		<div class="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/[0.07] blur-3xl"></div>
		<div class="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-teal-300/10 blur-2xl"></div>
		<div class="relative flex items-end justify-between px-8 py-9">
			<div class="space-y-2">
				<span class="text-[10px] font-bold tracking-[0.25em] text-white/50 uppercase"
					>{m.vac_hr_planning()}</span
				>
				<h1 class="text-[42px] leading-none font-extrabold tracking-tight text-white">
					{m.vac_label()}
				</h1>
				<p class="max-w-md text-[13px] font-medium text-white/45">
					{m.vac_subtitle()}
				</p>
			</div>
			<!-- Month nav in header -->
			<div class="hidden items-center gap-2 sm:flex">
				<button
					class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 transition-all hover:bg-white/10"
					onclick={() => navigate('prev')}
				>
					<ChevronLeft class="h-4 w-4" />
				</button>
				<div class="min-w-[160px] text-center">
					<div class="text-xl font-extrabold text-white capitalize">{monthLabel}</div>
				</div>
				<button
					class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 transition-all hover:bg-white/10"
					onclick={() => navigate('next')}
				>
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
		</div>
	</header>

	<!-- Stats + filter bar -->
	<CalendarHeader
		leaveRequests={filteredLeave}
		{loading}
		{departments}
		{selectedDepartment}
		onDepartmentChange={(v) => (selectedDepartment = v)}
	/>

	<!-- Calendar -->
	<CalendarGrid leaveRequests={filteredLeave} {loading} {currentMonth} {selectedDepartment} />
</section>
