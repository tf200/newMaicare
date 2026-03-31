<script lang="ts">
	import Toast from '$lib/components/ui/Toast.svelte';
	import type { Training, EmployeeTraining } from '$lib/types/api/trainingen';
	import TrainingenStats from './_components/TrainingenStats.svelte';
	import OverzichtTab from './_components/OverzichtTab.svelte';
	import CatalogusTab from './_components/CatalogusTab.svelte';
	import { listMockTrainings, listMockEmployeeTrainings } from '$lib/api/trainingen.mock';

	type TabId = 'overzicht' | 'catalogus';
	let activeTab = $state<TabId>('overzicht');

	let trainings = $state<Training[]>([]);
	let employeeTrainings = $state<EmployeeTraining[]>([]);
	let loading = $state(true);
	let dataSequence = 0;

	let toast = $state<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	function setToast(message: string, type: 'success' | 'warning' | 'error' = 'success') {
		toast = { message, type };
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => { toast = null; }, 3500);
	}

	async function loadData() {
		const reqId = ++dataSequence;
		loading = true;
		try {
			const [trRes, etRes] = await Promise.all([listMockTrainings(), listMockEmployeeTrainings()]);
			if (reqId !== dataSequence) return;
			trainings = trRes.data;
			employeeTrainings = etRes.data;
		} catch {
			if (reqId !== dataSequence) return;
			setToast('Kon data niet laden.', 'error');
		} finally {
			if (reqId === dataSequence) loading = false;
		}
	}

	$effect(() => { void loadData(); });

	function getExpiryStatus(date: string | null): string | null {
		if (!date) return null;
		const days = Math.ceil((new Date(date).getTime() - new Date().getTime()) / 86400000);
		if (days < 0) return 'expired';
		if (days <= 30) return 'expiring_soon';
		if (days <= 90) return 'expiring_month';
		return 'valid';
	}

	const stats = $derived({
		total: employeeTrainings.length,
		completed: employeeTrainings.filter((et) => et.status === 'completed').length,
		expired: employeeTrainings.filter((et) => et.status === 'expired' || getExpiryStatus(et.expiry_date) === 'expired').length,
		expiringSoon: employeeTrainings.filter((et) => getExpiryStatus(et.expiry_date) === 'expiring_soon').length
	});

	const tabs: { id: TabId; label: string; count?: number }[] = $derived([
		{ id: 'overzicht', label: 'Overzicht', count: employeeTrainings.length },
		{ id: 'catalogus', label: 'Catalogus', count: trainings.length }
	]);
</script>

<svelte:head>
	<title>Trainingen | MaiCare</title>
</svelte:head>

<section class="space-y-8">
	<!-- Header -->
	<header class="relative overflow-hidden rounded-3xl">
		<div class="absolute inset-0 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 dark:from-indigo-900 dark:via-indigo-950 dark:to-violet-950"></div>
		<div class="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/[0.07] blur-3xl"></div>
		<div class="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-violet-300/10 blur-2xl"></div>
		<div class="relative px-8 py-9">
			<div class="space-y-2">
				<span class="text-[10px] font-bold tracking-[0.25em] text-white/50 uppercase">HR & Ontwikkeling</span>
				<h1 class="text-[42px] leading-none font-extrabold tracking-tight text-white">
					Trainingen
				</h1>
				<p class="max-w-md text-[13px] font-medium text-white/45">
					Beheer verplichte trainingen, cursussen en certificaten
				</p>
			</div>
		</div>
	</header>

	<TrainingenStats
		total={stats.total}
		completed={stats.completed}
		expired={stats.expired}
		expiringSoon={stats.expiringSoon}
	/>

	<!-- Tabs -->
	<div class="flex items-center gap-1">
		{#each tabs as tab}
			<button
				class="relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 {activeTab === tab.id
					? 'bg-surface text-text shadow-sm border border-border/60'
					: 'text-text-subtle hover:bg-border/30 hover:text-text-muted'}"
				onclick={() => (activeTab = tab.id)}
			>
				{tab.label}
				{#if tab.count !== undefined && tab.count > 0}
					<span class="inline-flex h-5 min-w-[20px] items-center justify-center rounded-md px-1 text-[10px] font-bold tabular-nums {activeTab === tab.id ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-border/40 text-text-muted'}">
						{tab.count}
					</span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Content -->
	<div>
		{#if activeTab === 'overzicht'}
			<OverzichtTab {employeeTrainings} {loading} />
		{:else}
			<CatalogusTab {trainings} {loading} />
		{/if}
	</div>
</section>

<Toast message={toast?.message ?? null} type={toast?.type ?? 'success'} onClose={() => (toast = null)} />
