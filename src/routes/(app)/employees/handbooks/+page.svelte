<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onDestroy } from 'svelte';
	import { User, Building2, FileText, ChevronRight } from 'lucide-svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import { formatDate } from '$lib/utils/date';
	import { handbookStatusConfig } from '$lib/config/handbook-status';
	import {
		createHandbookAssignment,
		getEmployeeHandbookAssignment,
		getEmployeeHandbookHistory,
		listDepartmentTemplates,
		waiveHandbookAssignment
	} from '$lib/api/handbooks';
	import { _mapAssignmentDetail, _mapAssignmentHistoryEntry } from './+page';
	import type {
		DropdownFilters,
		FilterOption,
		EmployeeHandbookAssignment,
		EmployeeHandbookAssignmentDetail,
		HandbookAssignmentHistoryEntry,
		HandbooksFilters,
		HandbooksLoadResult,
		HandbookTemplate
	} from './+page';

	import HandbooksPageHeader from './_components/HandbooksPageHeader.svelte';
	import HandbooksTableFilters from './_components/HandbooksTableFilters.svelte';
	import AssignHandbookModal from './_components/AssignHandbookModal.svelte';
	import AssignmentDetailSheet from './_components/AssignmentDetailSheet.svelte';
	import WaiveHandbookModal from './_components/WaiveHandbookModal.svelte';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
				filters: HandbooksFilters;
				departmentOptions: Array<{ id: string; name: string }>;
			};
			handbooksData: Promise<HandbooksLoadResult>;
		};
	}>();

	type DetailTab = 'steps' | 'timeline';

	const defaultFilters: HandbooksFilters = { search: '', departmentId: '', status: '' };

	const columns: DataTableColumn[] = [
		{ key: 'employee', label: 'Employee', width: '280px' },
		{ key: 'status', label: 'Status', width: '160px' },
		{ key: 'template', label: 'Assigned Template', width: '240px' },
		{ key: 'progress', label: 'Progress', width: '220px' },
		{ key: 'assigned_at', label: 'Assigned', width: '140px' },
		{ key: 'actions', label: '', align: 'right', width: '140px' }
	];

	const handbooksDataPromise = $derived(data.handbooksData);
	const initial = $derived(data.initial);
	const currentPage = $derived(initial.page);
	const pageSize = $derived(initial.pageSize);
	const appliedFilters = $derived(initial.filters);
	const appliedSearch = $derived(appliedFilters.search);
	const appliedDepartment = $derived(appliedFilters.departmentId);
	const availableDepartmentOptions = $derived(
		initial.departmentOptions.map((department: { id: string; name: string }) => ({
			value: department.id,
			label: department.name
		}))
	);
	const departmentOptions = $derived([
		{ value: '', label: 'All Departments' },
		...availableDepartmentOptions
	]);

	let searchTerm = $derived(appliedSearch);
	let selectedAssignment = $state<EmployeeHandbookAssignment | null>(null);
	let assignmentDetail = $state<EmployeeHandbookAssignmentDetail | null>(null);
	let assignmentHistory = $state<HandbookAssignmentHistoryEntry[]>([]);
	let assignmentDetailLoadError = $state<string | null>(null);
	let assignmentHistoryLoadError = $state<string | null>(null);
	let isLoadingAssignmentDetail = $state(false);
	let isLoadingAssignmentHistory = $state(false);
	let activeDetailTab = $state<DetailTab>('steps');
	let isDetailOpen = $state(false);
	let isAssignModalOpen = $state(false);
	let isWaiveModalOpen = $state(false);
	let assignModalKey = $state(0);

	// Assignment form state
	let selectedEmployeeId = $state('');
	let selectedTemplateId = $state('');
	let availableTemplates = $state<HandbookTemplate[]>([]);
	let assignLoadError = $state<string | null>(null);
	let waiveLoadError = $state<string | null>(null);
	let waiveReason = $state('');
	let isAssigning = $state(false);
	let isWaiving = $state(false);
	let isLoadingTemplates = $state(false);
	let toast = $state<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;
	let templateLoadRequestSeq = $state(0);

	const statusFilterItems: FilterOption[] = [
		{ key: 'status_unassigned', value: 'unassigned', label: 'Unassigned' },
		{ key: 'status_not_started', value: 'not_started', label: 'Not Started' },
		{ key: 'status_in_progress', value: 'in_progress', label: 'In Progress' },
		{ key: 'status_completed', value: 'completed', label: 'Completed' },
		{ key: 'status_waived', value: 'waived', label: 'Waived' }
	];

	const filterGroups = $derived([{ label: 'Status', items: statusFilterItems }]);

	const activeFilters = $derived.by(() => {
		const filters: DropdownFilters = {};
		if (appliedFilters.status) {
			filters[`status_${appliedFilters.status}`] = true;
		}
		return filters;
	});

	const buildQuery = (pageValue: number, filters: HandbooksFilters) => {
		const params = new URLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));
		if (filters.search) params.set('search', filters.search);
		if (filters.departmentId) params.set('department_id', filters.departmentId);
		if (filters.status) params.set('status', filters.status);
		return params.toString();
	};

	const updateQuery = (pageValue: number, filters: HandbooksFilters) => {
		goto(resolve('/(app)/employees/handbooks') + `?${buildQuery(pageValue, filters)}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	};

	const setFilters = (filters: HandbooksFilters) => updateQuery(1, filters);
	const withPendingSearch = (filters: HandbooksFilters): HandbooksFilters => ({
		...filters,
		search: searchTerm.trim()
	});

	const updateActiveFilters = (nextFilters: DropdownFilters) => {
		const activeStatusKey = [...statusFilterItems]
			.reverse()
			.find((item) => Boolean(nextFilters[item.key]))?.key;
		const nextStatus = statusFilterItems.find((item) => item.key === activeStatusKey)?.value ?? '';

		setFilters({
			...withPendingSearch(appliedFilters),
			status: nextStatus as HandbooksFilters['status']
		});
	};

	const applySearch = () => setFilters(withPendingSearch(appliedFilters));

	const resetFilters = () => {
		searchTerm = '';
		setFilters(defaultFilters);
	};

	const toTemplateOption = (template: {
		id: string;
		title: string;
		version: number;
		description: string | null;
		status: string;
		steps_count?: number;
	}) => ({
		id: template.id,
		title: template.title,
		version: String(template.version),
		description: template.description?.trim() || '',
		steps_count: template.steps_count ?? 0
	});

	function showToast(message: string, type: 'success' | 'warning' | 'error' = 'success') {
		toast = { message, type };
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			toast = null;
			toastTimer = null;
		}, 4000);
	}

	function closeToast() {
		if (toastTimer) {
			clearTimeout(toastTimer);
			toastTimer = null;
		}
		toast = null;
	}

	onDestroy(() => {
		if (toastTimer) clearTimeout(toastTimer);
	});

	const loadTemplatesForEmployee = async (employeeId: string, departmentId: string | null) => {
		const requestSeq = ++templateLoadRequestSeq;
		selectedTemplateId = '';
		availableTemplates = [];
		assignLoadError = null;

		if (!employeeId) {
			isLoadingTemplates = false;
			return;
		}
		if (!departmentId) {
			if (selectedEmployeeId === employeeId && requestSeq === templateLoadRequestSeq) {
				assignLoadError = 'This employee is not linked to a department with handbook templates.';
				isLoadingTemplates = false;
			}
			return;
		}

		isLoadingTemplates = true;

		try {
			const response = await listDepartmentTemplates(departmentId, {
				page: 1,
				pageSize: 100
			});
			if (selectedEmployeeId !== employeeId || requestSeq !== templateLoadRequestSeq) return;

			availableTemplates = response.data
				.filter((template) => template.status === 'published')
				.map(toTemplateOption);

			if (availableTemplates.length === 0) {
				assignLoadError = 'No published handbook templates are available for this department.';
			}
		} catch (error) {
			if (selectedEmployeeId !== employeeId || requestSeq !== templateLoadRequestSeq) return;
			assignLoadError =
				error instanceof Error ? error.message : 'Failed to load handbook templates.';
		} finally {
			if (selectedEmployeeId === employeeId && requestSeq === templateLoadRequestSeq) {
				isLoadingTemplates = false;
			}
		}
	};

	const loadAssignmentPanel = async (assignment: EmployeeHandbookAssignment) => {
		if (!assignment.employee_handbook_id) {
			assignmentDetailLoadError = 'This employee does not have a handbook assignment yet.';
			return;
		}

		const handbookId = assignment.employee_handbook_id;
		const employeeId = assignment.employee_id;
		isLoadingAssignmentDetail = true;
		isLoadingAssignmentHistory = true;

		try {
			const [detailResult, historyResult] = await Promise.allSettled([
				getEmployeeHandbookAssignment(handbookId),
				getEmployeeHandbookHistory(employeeId)
			]);
			if (selectedAssignment?.employee_handbook_id !== handbookId) return;

			if (detailResult.status === 'fulfilled') {
				assignmentDetail = _mapAssignmentDetail(detailResult.value.data);
				assignmentDetailLoadError = null;
			} else {
				assignmentDetailLoadError =
					detailResult.reason instanceof Error
						? detailResult.reason.message
						: 'Failed to load handbook assignment details.';
			}

			if (historyResult.status === 'fulfilled') {
				assignmentHistory = historyResult.value.data.map(_mapAssignmentHistoryEntry);
				assignmentHistoryLoadError = null;
			} else {
				assignmentHistoryLoadError =
					historyResult.reason instanceof Error
						? historyResult.reason.message
						: 'Failed to load handbook assignment history.';
			}
		} finally {
			if (selectedAssignment?.employee_handbook_id === handbookId) {
				isLoadingAssignmentDetail = false;
				isLoadingAssignmentHistory = false;
			}
		}
	};

	const handleViewDetail = async (assignment: EmployeeHandbookAssignment) => {
		selectedAssignment = assignment;
		assignmentDetail = null;
		assignmentHistory = [];
		assignmentDetailLoadError = null;
		assignmentHistoryLoadError = null;
		waiveLoadError = null;
		activeDetailTab = 'steps';
		isDetailOpen = true;

		await loadAssignmentPanel(assignment);
	};

	const handleOpenAssign = async (
		assignment: EmployeeHandbookAssignment | null = selectedAssignment
	) => {
		selectedEmployeeId = assignment?.employee_id || '';
		selectedTemplateId = '';
		availableTemplates = [];
		assignLoadError = null;
		waiveLoadError = null;
		assignModalKey += 1;
		isAssignModalOpen = true;

		if (selectedEmployeeId) {
			await loadTemplatesForEmployee(selectedEmployeeId, assignment?.department_id ?? null);
		}
	};

	const handleEmployeeChange = async (employeeId: string, departmentId: string | null) => {
		selectedEmployeeId = employeeId;
		await loadTemplatesForEmployee(employeeId, departmentId);
	};

	const handleAssign = async () => {
		if (!selectedEmployeeId || !selectedTemplateId) return;
		assignLoadError = null;
		isAssigning = true;

		try {
			const response = await createHandbookAssignment({
				employee_id: selectedEmployeeId,
				template_id: selectedTemplateId
			});

			const selectedTemplate = availableTemplates.find(
				(template) => template.id === selectedTemplateId
			);
			const shouldRefreshDrawer =
				isDetailOpen && selectedAssignment?.employee_id === selectedEmployeeId;

			isAssignModalOpen = false;
			selectedTemplateId = '';
			availableTemplates = [];
			assignLoadError = null;

			if (shouldRefreshDrawer) {
				const updatedAssignment: EmployeeHandbookAssignment = {
					...(selectedAssignment as EmployeeHandbookAssignment),
					employee_handbook_id: response.data.employee_handbook_id,
					status: response.data.status,
					template_id: response.data.template_id,
					template_title: selectedTemplate?.title ?? selectedAssignment?.template_title ?? '',
					template_version: selectedTemplate?.version ?? selectedAssignment?.template_version ?? '',
					assigned_at: response.data.assigned_at,
					started_at: null,
					completed_at: null,
					due_at: null,
					completed_steps: 0,
					total_steps: 0
				};

				selectedAssignment = updatedAssignment;
				assignmentDetail = null;
				assignmentHistory = [];
				await loadAssignmentPanel(updatedAssignment);
			}

			showToast('Handbook assigned successfully.', 'success');

			await invalidateAll();
		} catch (error) {
			assignLoadError = error instanceof Error ? error.message : 'Failed to assign handbook.';
		} finally {
			isAssigning = false;
		}
	};

	const handleOpenWaiveModal = () => {
		waiveReason = '';
		waiveLoadError = null;
		isWaiveModalOpen = true;
	};

	const handleWaive = async () => {
		const handbookId = selectedAssignment?.employee_handbook_id;
		if (!handbookId) return;

		waiveLoadError = null;
		isWaiving = true;

		try {
			const response = await waiveHandbookAssignment(handbookId, {
				reason: waiveReason.trim() || null
			});

			isWaiveModalOpen = false;
			waiveReason = '';

			if (selectedAssignment) {
				const updatedAssignment: EmployeeHandbookAssignment = {
					...selectedAssignment,
					status: response.data.status,
					completed_at: response.data.completed_at
				};

				selectedAssignment = updatedAssignment;
				assignmentDetail = null;
				assignmentHistory = [];
				await loadAssignmentPanel(updatedAssignment);
			}

			showToast('Handbook waived successfully.', 'success');

			await invalidateAll();
		} catch (error) {
			waiveLoadError = error instanceof Error ? error.message : 'Failed to waive handbook.';
		} finally {
			isWaiving = false;
		}
	};

	const getProgressColor = (progress: number) => {
		if (progress >= 100) return 'bg-emerald-500';
		if (progress > 0) return 'bg-blue-500';
		return 'bg-zinc-200';
	};

	const getAssignActionLabel = (assignment: EmployeeHandbookAssignment | null) =>
		assignment?.employee_handbook_id ? 'Reassign handbook' : 'Assign handbook';

	const hasActiveFilters = $derived.by(
		() =>
			searchTerm.trim().length > 0 || appliedDepartment.length > 0 || Boolean(appliedFilters.status)
	);
</script>

<svelte:head>
	<title>Employee Handbooks | MaiCare</title>
</svelte:head>

<section class="space-y-6">
	<HandbooksPageHeader onAssign={() => handleOpenAssign(null)} />

	{#snippet tableFilters()}
		<HandbooksTableFilters
			{searchTerm}
			{appliedFilters}
			{departmentOptions}
			{hasActiveFilters}
			{filterGroups}
			{activeFilters}
			onSearchTermChange={(v) => (searchTerm = v)}
			onSearchApply={applySearch}
			onFilterUpdate={updateActiveFilters}
			onDepartmentChange={(value) =>
				setFilters({
					...withPendingSearch(appliedFilters),
					departmentId: value
				})}
			onReset={resetFilters}
		/>
	{/snippet}

	{#snippet employeeCell(row: EmployeeHandbookAssignment)}
		<div class="flex min-w-[15rem] items-center gap-3">
			<div
				class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand shadow-sm"
			>
				<User class="h-5 w-5" />
			</div>
			<div class="min-w-0 space-y-1">
				<p class="truncate text-sm font-semibold text-text">{row.employee_name}</p>
				<div class="flex flex-wrap items-center gap-2 text-xs text-text-muted">
					<span
						class="bg-surface-alt/70 inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 font-medium text-text-muted"
					>
						<Building2 class="h-3.5 w-3.5" />
						{row.department_name}
					</span>
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet statusCell(row: EmployeeHandbookAssignment)}
		{@const cfg = handbookStatusConfig[row.status]}
		<span
			class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold {cfg.badgeClass}"
		>
			<span class="h-2 w-2 rounded-full {cfg.dotClass}"></span>
			{cfg.label}
		</span>
	{/snippet}

	{#snippet templateCell(row: EmployeeHandbookAssignment)}
		{#if row.template_title}
			<div class="min-w-[13rem] space-y-1">
				<div class="flex items-center gap-2">
					<span
						class="bg-surface-alt/80 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-text-muted"
					>
						<FileText class="h-4 w-4" />
					</span>
					<p class="line-clamp-2 text-sm font-semibold text-text">{row.template_title}</p>
				</div>
				<p class="pl-10 text-xs font-medium text-text-muted">Version {row.template_version}</p>
			</div>
		{:else}
			<span
				class="inline-flex items-center rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-text-subtle"
			>
				Awaiting assignment
			</span>
		{/if}
	{/snippet}

	{#snippet progressCell(row: EmployeeHandbookAssignment)}
		{#if row.status !== 'unassigned' && row.status !== 'waived' && row.total_steps > 0}
			{@const percent = Math.round((row.completed_steps / row.total_steps) * 100)}
			<div class="w-full space-y-2">
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-semibold text-text">
						{row.completed_steps} of {row.total_steps} steps
					</span>
					<span class="text-[11px] font-bold text-text-muted">{percent}%</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-border/50">
					<div
						class="h-full transition-all duration-500 {getProgressColor(percent)}"
						style="width: {percent}%"
					></div>
				</div>
				<p class="text-[11px] font-medium text-text-muted">
					{percent === 100 ? 'Ready to archive' : 'Keep nudging completion'}
				</p>
			</div>
		{:else}
			<span class="text-xs font-medium text-text-subtle">
				{row.status === 'waived' ? 'Not required' : 'Not started'}
			</span>
		{/if}
	{/snippet}

	{#snippet assignedAtCell(row: EmployeeHandbookAssignment)}
		<div class="space-y-0.5">
			<p class="text-sm font-semibold text-text">{formatDate(row.assigned_at, '-')}</p>
			<p class="text-[11px] font-medium text-text-muted">Latest assignment</p>
		</div>
	{/snippet}

	{#snippet actionsCell(row: EmployeeHandbookAssignment)}
		<div class="flex items-center justify-end gap-2">
			{#if row.employee_handbook_id == null}
				<Button
					variant="secondary"
					class="rounded-lg px-3 py-1.5 text-xs font-semibold"
					onclick={() => handleOpenAssign(row)}
				>
					Assign handbook
				</Button>
			{:else}
				<button
					class="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-border/50 hover:text-brand"
					onclick={() => handleViewDetail(row)}
					title="View Progress"
				>
					View
					<ChevronRight class="h-4 w-4" />
				</button>
			{/if}
		</div>
	{/snippet}

	{#await handbooksDataPromise}
		<DataTable
			{columns}
			rows={[]}
			loading
			{currentPage}
			{pageSize}
			totalCount={0}
			onPageChange={(nextPage) => updateQuery(nextPage, appliedFilters)}
			rowKey="id"
			title="Employee Handbook Roster"
			description="Track who still needs an assignment, which handbook is active, and how close each employee is to completion."
			filters={tableFilters}
			cells={{
				employee: employeeCell,
				status: statusCell,
				template: templateCell,
				progress: progressCell,
				assigned_at: assignedAtCell,
				actions: actionsCell
			}}
		/>
	{:then handbooksData}
		{#if handbooksData.loadError}
			<div class="mb-4">
				<InlineErrorBanner message={handbooksData.loadError} />
			</div>
		{/if}

		<DataTable
			{columns}
			rows={handbooksData.assignments}
			currentPage={handbooksData.pagination.page}
			pageSize={handbooksData.pagination.pageSize}
			totalCount={handbooksData.pagination.count}
			onPageChange={(nextPage) => updateQuery(nextPage, appliedFilters)}
			rowKey="id"
			title="Employee Handbook Roster"
			description="Track who still needs an assignment, which handbook is active, and how close each employee is to completion."
			emptyTitle="No handbooks match these filters"
			emptyDescription="Try a different employee, department, or handbook status."
			emptyActionLabel="Reset filters"
			emptyAction={resetFilters}
			filters={tableFilters}
			cells={{
				employee: employeeCell,
				status: statusCell,
				template: templateCell,
				progress: progressCell,
				assigned_at: assignedAtCell,
				actions: actionsCell
			}}
		/>

		{@const selectedEmployeeAssignment =
			(selectedAssignment?.employee_id === selectedEmployeeId
				? selectedAssignment
				: handbooksData.assignments.find(
						(assignment: EmployeeHandbookAssignment) =>
							assignment.employee_id === selectedEmployeeId
					)) ?? null}
		{#key assignModalKey}
			<AssignHandbookModal
				bind:open={isAssignModalOpen}
				assignments={handbooksData.assignments}
				departmentOptions={availableDepartmentOptions}
				templates={availableTemplates}
				{selectedEmployeeId}
				selectedEmployeeName={selectedEmployeeAssignment?.employee_name ?? ''}
				selectedDepartmentId={selectedEmployeeAssignment?.department_id ?? ''}
				{selectedTemplateId}
				{isAssigning}
				{isLoadingTemplates}
				loadErrorMessage={assignLoadError}
				submitLabel={getAssignActionLabel(selectedEmployeeAssignment)}
				onEmployeeChange={handleEmployeeChange}
				onTemplateChange={(v) => (selectedTemplateId = v)}
				onAssign={handleAssign}
			/>
		{/key}
	{/await}

	<AssignmentDetailSheet
		bind:open={isDetailOpen}
		{selectedAssignment}
		{assignmentDetail}
		{assignmentHistory}
		{assignmentDetailLoadError}
		{assignmentHistoryLoadError}
		{isLoadingAssignmentDetail}
		{isLoadingAssignmentHistory}
		{activeDetailTab}
		{isWaiving}
		waiveErrorMessage={waiveLoadError}
		onTabChange={(tab) => (activeDetailTab = tab)}
		onReassign={() => handleOpenAssign(selectedAssignment)}
		onWaiveRequest={handleOpenWaiveModal}
	/>

	<WaiveHandbookModal
		open={isWaiveModalOpen}
		reason={waiveReason}
		errorMessage={waiveLoadError}
		isSubmitting={isWaiving}
		onOpenChange={(open) => {
			isWaiveModalOpen = open;
			if (!open && !isWaiving) {
				waiveReason = '';
				waiveLoadError = null;
			}
		}}
		onReasonChange={(value) => (waiveReason = value)}
		onSubmit={handleWaive}
	/>

	<Toast message={toast?.message ?? null} type={toast?.type ?? 'success'} onClose={closeToast} />
</section>
