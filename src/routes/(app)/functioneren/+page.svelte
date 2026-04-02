<script lang="ts">
	import Toast from '$lib/components/ui/Toast.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import type { Assessment, WorkAssignment, UpcomingAssessment } from '$lib/types/api/functioneren';
	import FunctionerenStats from './_components/FunctionerenStats.svelte';
	import AssessmentsOverview from './_components/AssessmentsOverview.svelte';
	import UpcomingAssessmentsTab from './_components/UpcomingAssessments.svelte';
	import WerkadviesTab from './_components/WerkadviesTab.svelte';
	import AssessmentDetail from './_components/AssessmentDetail.svelte';
	import AssessmentWizard from './_components/AssessmentWizard.svelte';
	import FunctionerenPageHeader from './_components/FunctionerenPageHeader.svelte';
	import {
		listMockAssessments,
		listMockAssessmentScores,
		listMockWorkAssignments,
		listMockFunctionerenEmployees
	} from '$lib/api/functioneren.mock';
	import { m } from '$lib/paraglide/messages';

	type TabId = 'overzicht' | 'nieuw' | 'aankomend' | 'werkadvies';
	let activeTab = $state<TabId>('overzicht');

	let assessments = $state<Assessment[]>([]);
	let workAssignments = $state<WorkAssignment[]>([]);
	let employees = $state<{ id: string; name: string }[]>([]);
	let loading = $state(true);
	let dataSequence = 0;

	let detailOpen = $state(false);
	let selectedAssessment = $state<Assessment | null>(null);
	let detailScores = $state<any[]>([]);

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
			const [assessRes, assignRes, empRes] = await Promise.all([
				listMockAssessments(),
				listMockWorkAssignments(),
				listMockFunctionerenEmployees()
			]);
			if (reqId !== dataSequence) return;
			assessments = assessRes.data;
			workAssignments = assignRes.data;
			employees = empRes.data;
		} catch (e) {
			if (reqId !== dataSequence) return;
			setToast('Kon data niet laden.', 'error');
		} finally {
			if (reqId === dataSequence) loading = false;
		}
	}

	$effect(() => { void loadData(); });

	const completedAssessments = $derived(assessments.filter((a) => a.status === 'completed'));
	const thisMonth = new Date();
	const thisMonthCount = $derived(
		completedAssessments.filter((a) => {
			const d = new Date(a.assessment_date);
			return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
		}).length
	);
	const avgScore = $derived(
		completedAssessments.length > 0
			? completedAssessments.reduce((s, a) => s + (a.total_score ?? 0), 0) / completedAssessments.length
			: null
	);
	const coveredIds = new Set(completedAssessments.map((a) => a.employee_id));
	const coveragePercent = $derived(
		employees.length > 0 ? Math.round((coveredIds.size / employees.length) * 100) : 0
	);

	const upcomingItems = $derived.by<UpcomingAssessment[]>(() => {
		const today = new Date();
		const byEmployee = new Map<string, { date: string; name: string }>();
		for (const a of completedAssessments) {
			const existing = byEmployee.get(a.employee_id);
			if (!existing || new Date(a.assessment_date) > new Date(existing.date)) {
				byEmployee.set(a.employee_id, {
					date: a.assessment_date,
					name: a.employee?.name ?? 'Onbekend'
				});
			}
		}
		const items: UpcomingAssessment[] = [];
		for (const [empId, data] of byEmployee) {
			const last = new Date(data.date);
			const next = new Date(last);
			next.setDate(next.getDate() + 42);
			const isOverdue = next < today;
			const isDueSoon = !isOverdue && next <= new Date(today.getTime() + 14 * 86400000);
			items.push({
				employeeId: empId,
				employeeName: data.name,
				lastAssessmentDate: data.date,
				nextAssessmentDate: next.toISOString().split('T')[0],
				isOverdue,
				isDueSoon
			});
		}
		return items.sort((a, b) => {
			if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
			return new Date(a.nextAssessmentDate).getTime() - new Date(b.nextAssessmentDate).getTime();
		});
	});

	async function handleView(id: string) {
		selectedAssessment = assessments.find((a) => a.id === id) ?? null;
		if (!selectedAssessment) return;
		try {
			const res = await listMockAssessmentScores(id);
			detailScores = res.data;
		} catch {
			detailScores = [];
		}
		detailOpen = true;
	}

	function handleDelete(id: string, name: string) {
		setToast(`Beoordeling van ${name} verwijderd.`, 'warning');
	}

	const tabs: { id: TabId; label: string; count?: number }[] = $derived([
		{ id: 'overzicht', label: m.func_overview(), count: assessments.length },
		{ id: 'nieuw', label: m.func_new() },
		{ id: 'aankomend', label: m.func_upcoming(), count: upcomingItems.length },
		{ id: 'werkadvies', label: m.func_advice(), count: workAssignments.length }
	]);
</script>

<svelte:head>
	<title>{m.func_label()} | MaiCare</title>
</svelte:head>

<section class="space-y-6">
	<FunctionerenPageHeader />

	<FunctionerenStats
		totalEmployees={employees.length}
		completedCount={completedAssessments.length}
		{thisMonthCount}
		{avgScore}
		{coveragePercent}
		coveredCount={coveredIds.size}
	/>

	<!-- Main Content Container -->
	<div class="animate-in fade-in overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-sm">
		<div class="p-6">
			<div class="space-y-6">
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
								<span class="inline-flex h-5 min-w-[20px] items-center justify-center rounded-md px-1 text-[10px] font-bold tabular-nums {activeTab === tab.id ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-border/40 text-text-muted'}">
									{tab.count}
								</span>
							{/if}
						</button>
					{/each}
				</div>

				<!-- Content -->
				<div>
					{#if activeTab === 'overzicht'}
						<AssessmentsOverview {assessments} {loading} onView={handleView} onDelete={handleDelete} />
					{:else if activeTab === 'nieuw'}
						<AssessmentWizard {employees} />
					{:else if activeTab === 'aankomend'}
						<UpcomingAssessmentsTab items={upcomingItems} {loading} />
					{:else if activeTab === 'werkadvies'}
						<WerkadviesTab assignments={workAssignments} {loading} />
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Detail Modal -->
<Modal bind:open={detailOpen} title={m.func_detail_title()} description={m.func_detail_desc()} size="lg">
	{#snippet children()}
		{#if selectedAssessment}
			<AssessmentDetail assessment={selectedAssessment} scores={detailScores} onClose={() => (detailOpen = false)} />
		{/if}
	{/snippet}
</Modal>

<Toast message={toast?.message ?? null} type={toast?.type ?? 'success'} onClose={() => (toast = null)} />
