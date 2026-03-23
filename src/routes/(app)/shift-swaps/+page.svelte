<script lang="ts">
	import {
		ArrowLeftRight,
		Check,
		X,
		Clock,
		AlertCircle,
		CheckCircle2,
		XCircle,
		Search,
		Filter,
		TrendingUp,
		Zap,
		Users,
		Calendar
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { m } from '$lib/paraglide/messages';

	type SwapStatus =
		| 'pending'
		| 'accepted_by_target'
		| 'rejected_by_target'
		| 'approved'
		| 'rejected'
		| 'cancelled';

	interface ShiftInfo {
		date: string;
		service: string;
		shiftType: string;
	}

	interface SwapRequest {
		id: string;
		requesterName: string;
		targetName: string;
		requesterShift: ShiftInfo;
		targetShift: ShiftInfo;
		status: SwapStatus;
		reason?: string;
		targetResponse?: string;
		adminNotes?: string;
		createdAt: string;
	}

	const statusConfig: Record<SwapStatus, { label: () => string; className: string }> = {
		pending: {
			label: () => m.swap_stat_pending(),
			className: 'bg-warning/10 text-warning border-warning/20'
		},
		accepted_by_target: {
			label: () => m.swap_waiting_approval(),
			className: 'bg-brand/10 text-brand border-brand/20'
		},
		rejected_by_target: {
			label: () => m.swap_toast_target_rejected(),
			className: 'bg-error/10 text-error border-error/20'
		},
		approved: {
			label: () => m.leave_stats_approved(),
			className: 'bg-success/10 text-success border-success/20'
		},
		rejected: {
			label: () => m.leave_stats_rejected(),
			className: 'bg-error/10 text-error border-error/20'
		},
		cancelled: {
			label: () => m.swap_toast_cancelled(),
			className: 'bg-border/40 text-text-muted border-border'
		}
	};

	let swapRequests = $state<SwapRequest[]>([
		{
			id: 'swap-1',
			requesterName: 'Sanne Jansen',
			targetName: 'Milan de Vries',
			requesterShift: {
				date: '2026-03-18',
				service: 'Afdeling Noord',
				shiftType: 'Dagdienst'
			},
			targetShift: {
				date: '2026-03-20',
				service: 'Afdeling West',
				shiftType: 'Avonddienst'
			},
			status: 'pending',
			reason: 'Familie-afspraak die dag.',
			createdAt: '2026-03-12T09:15:00'
		},
		{
			id: 'swap-2',
			requesterName: 'Ravi Singh',
			targetName: 'Nora Bakker',
			requesterShift: {
				date: '2026-03-16',
				service: 'Afdeling Oost',
				shiftType: 'Nachtdienst'
			},
			targetShift: {
				date: '2026-03-19',
				service: 'Afdeling Oost',
				shiftType: 'Nachtdienst'
			},
			status: 'accepted_by_target',
			reason: 'Ik wil mijn rooster gelijk trekken.',
			targetResponse: 'Past goed, ik wil wel ruilen.',
			createdAt: '2026-03-11T14:40:00'
		},
		{
			id: 'swap-3',
			requesterName: 'Yasmine El Amrani',
			targetName: 'Timo Vermeer',
			requesterShift: {
				date: '2026-03-14',
				service: 'Afdeling Zuid',
				shiftType: 'Dagdienst'
			},
			targetShift: {
				date: '2026-03-14',
				service: 'Afdeling Zuid',
				shiftType: 'Late dienst'
			},
			status: 'approved',
			reason: 'Aanpassing opvang kind.',
			targetResponse: 'Graag, dank!',
			adminNotes: 'Goedgekeurd door planning.',
			createdAt: '2026-03-08T10:05:00'
		},
		{
			id: 'swap-4',
			requesterName: 'Nina Visser',
			targetName: 'Kay van Dijk',
			requesterShift: {
				date: '2026-03-10',
				service: 'Afdeling Noord',
				shiftType: 'Avonddienst'
			},
			targetShift: {
				date: '2026-03-12',
				service: 'Afdeling Noord',
				shiftType: 'Dagdienst'
			},
			status: 'rejected',
			reason: 'Ik ruil liever met iemand anders.',
			adminNotes: 'Afgewezen wegens onderbezetting.',
			createdAt: '2026-03-06T13:20:00'
		}
	]);

	let activeTab = $state<'pending' | 'approval' | 'history'>('pending');
	let selectedRequestId = $state<string | null>(null);
	let dialogAction = $state<'accept' | 'reject' | 'approve' | 'deny' | null>(null);
	let dialogOpen = $state(false);
	let responseText = $state('');
	let successDialogOpen = $state(false);
	let successAction = $state<'approved' | 'rejected' | null>(null);
	let successRequest = $state<SwapRequest | null>(null);
	let searchQuery = $state('');
	let selectedDepartmentFilter = $state<string | null>(null);
	let selectedShiftTypeFilter = $state<string | null>(null);
	let toast = $state<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	const pendingRequests = $derived.by(() => swapRequests.filter((r) => r.status === 'pending'));
	const awaitingApproval = $derived.by(() =>
		swapRequests.filter((r) => r.status === 'accepted_by_target')
	);
	const historyRequests = $derived.by(() =>
		swapRequests.filter((r) => !['pending', 'accepted_by_target'].includes(r.status))
	);
	const selectedRequest = $derived.by(
		() => swapRequests.find((r) => r.id === selectedRequestId) ?? null
	);

	// Derived filtered lists
	const filteredPendingRequests = $derived.by(() => {
		let results = pendingRequests;

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			results = results.filter(
				(r) =>
					r.requesterName.toLowerCase().includes(query) ||
					r.targetName.toLowerCase().includes(query)
			);
		}

		if (selectedDepartmentFilter) {
			results = results.filter(
				(r) =>
					r.requesterShift.service === selectedDepartmentFilter ||
					r.targetShift.service === selectedDepartmentFilter
			);
		}

		if (selectedShiftTypeFilter) {
			results = results.filter(
				(r) =>
					r.requesterShift.shiftType === selectedShiftTypeFilter ||
					r.targetShift.shiftType === selectedShiftTypeFilter
			);
		}

		return results;
	});

	const filteredApprovalRequests = $derived.by(() => {
		let results = awaitingApproval;

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			results = results.filter(
				(r) =>
					r.requesterName.toLowerCase().includes(query) ||
					r.targetName.toLowerCase().includes(query)
			);
		}

		if (selectedDepartmentFilter) {
			results = results.filter(
				(r) =>
					r.requesterShift.service === selectedDepartmentFilter ||
					r.targetShift.service === selectedDepartmentFilter
			);
		}

		return results;
	});

	const departments = $derived.by(() => {
		const depts = new Set<string>();
		swapRequests.forEach((r) => {
			depts.add(r.requesterShift.service);
			depts.add(r.targetShift.service);
		});
		return Array.from(depts).sort();
	});

	const shiftTypes = $derived.by(() => {
		const types = new Set<string>();
		swapRequests.forEach((r) => {
			types.add(r.requesterShift.shiftType);
			types.add(r.targetShift.shiftType);
		});
		return Array.from(types).sort();
	});

	const hasActiveFilters = $derived.by(
		() =>
			searchQuery.trim() !== '' ||
			selectedDepartmentFilter !== null ||
			selectedShiftTypeFilter !== null
	);

	function clearAllFilters() {
		searchQuery = '';
		selectedDepartmentFilter = null;
		selectedShiftTypeFilter = null;
	}

	const getTabItems = $derived.by(() => [
		{ value: 'pending' as const, label: m.swap_tab_pending({ count: pendingRequests.length }) },
		{ value: 'approval' as const, label: m.swap_tab_approval({ count: awaitingApproval.length }) },
		{ value: 'history' as const, label: m.swap_tab_history({ count: historyRequests.length }) }
	]);

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(value));
	}

	function formatDateTime(value: string) {
		return new Intl.DateTimeFormat('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(value));
	}

	function setToast(message: string, type: 'success' | 'warning' | 'error' = 'success') {
		toast = { message, type };
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => {
			toast = null;
		}, 3500);
	}

	function openAction(requestId: string, action: 'accept' | 'reject' | 'approve' | 'deny') {
		selectedRequestId = requestId;
		dialogAction = action;
		dialogOpen = true;
		responseText = '';
	}

	function closeDialog() {
		selectedRequestId = null;
		dialogAction = null;
		dialogOpen = false;
		responseText = '';
	}

	function updateRequest(id: string, updates: Partial<SwapRequest>) {
		swapRequests = swapRequests.map((request) =>
			request.id === id ? { ...request, ...updates } : request
		);
	}

	function confirmAction() {
		if (!selectedRequestId || !dialogAction) return;
		const request = swapRequests.find((item) => item.id === selectedRequestId) ?? null;

		if (dialogAction === 'accept') {
			updateRequest(selectedRequestId, {
				status: 'accepted_by_target',
				targetResponse: responseText || undefined
			});
			setToast(m.swap_toast_accepted(), 'success');
		} else if (dialogAction === 'reject') {
			updateRequest(selectedRequestId, {
				status: 'rejected_by_target',
				targetResponse: responseText || undefined
			});
			setToast(m.swap_toast_target_rejected(), 'warning');
		} else if (dialogAction === 'approve') {
			updateRequest(selectedRequestId, {
				status: 'approved',
				adminNotes: responseText || m.swap_modal_approve_desc()
			});
			successAction = 'approved';
			successRequest = request;
			successDialogOpen = true;
			setToast(m.swap_toast_approved(), 'success');
		} else if (dialogAction === 'deny') {
			updateRequest(selectedRequestId, {
				status: 'rejected',
				adminNotes: responseText || m.swap_modal_deny_desc()
			});
			successAction = 'rejected';
			successRequest = request;
			successDialogOpen = true;
			setToast(m.swap_toast_denied(), 'warning');
		}

		closeDialog();
	}

	function cancelSwap(requestId: string) {
		updateRequest(requestId, { status: 'cancelled' });
		setToast(m.swap_toast_cancelled(), 'warning');
	}
</script>

<svelte:head>
	<title>{m.swap_page_title()} | MaiCare</title>
</svelte:head>

<section class="flex flex-col gap-6">
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-brand/20 to-emerald-100/20 blur-2xl"
		></div>
		<div class="relative flex flex-col gap-6">
			<div class="flex flex-wrap items-start justify-between gap-6">
				<div class="space-y-3">
					<div class="flex items-center gap-3 text-sm font-semibold text-brand">
						<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
							<ArrowLeftRight class="h-5 w-5" />
						</span>
						<span>{m.swap_header_label()}</span>
					</div>
					<h1 class="text-3xl font-bold tracking-tighter text-text">{m.swap_header_title()}</h1>
					<p class="max-w-2xl text-sm font-medium text-text-muted">
						{m.swap_header_subtitle()}
					</p>
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				<div
					class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm"
				>
					<div class="absolute -right-4 -bottom-4 text-warning opacity-[0.04]">
						<Clock class="h-32 w-32" />
					</div>
					<div class="relative">
						<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
							{m.swap_stat_pending()}
						</div>
						<div class="mt-2 text-3xl font-bold tracking-tight text-text">
							{pendingRequests.length}
						</div>
						<p class="mt-1 text-xs font-medium text-text-muted">{m.swap_stat_pending_sub()}</p>
					</div>
				</div>
				<div
					class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm"
				>
					<div class="absolute -right-4 -bottom-4 text-brand opacity-[0.04]">
						<AlertCircle class="h-32 w-32" />
					</div>
					<div class="relative">
						<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
							{m.swap_stat_approval()}
						</div>
						<div class="mt-2 text-3xl font-bold tracking-tight text-text">
							{awaitingApproval.length}
						</div>
						<p class="mt-1 text-xs font-medium text-text-muted">{m.swap_stat_approval_sub()}</p>
					</div>
				</div>
				<div
					class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm"
				>
					<div class="absolute -right-4 -bottom-4 text-success opacity-[0.04]">
						<CheckCircle2 class="h-32 w-32" />
					</div>
					<div class="relative">
						<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
							{m.swap_stat_processed()}
						</div>
						<div class="mt-2 text-3xl font-bold tracking-tight text-text">
							{historyRequests.length}
						</div>
						<p class="mt-1 text-xs font-medium text-text-muted">{m.swap_stat_processed_sub()}</p>
					</div>
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
					<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.swap_workflow_label()}
					</p>
					<p class="mt-2 text-sm font-semibold text-text">{m.swap_workflow_title()}</p>
					<p class="mt-1 text-xs text-text-muted">{m.swap_workflow_sub()}</p>
				</div>
				<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
					<p class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
						{m.swap_tip_label()}
					</p>
					<p class="mt-2 text-sm font-semibold text-text">{m.swap_tip_title()}</p>
					<p class="mt-1 text-xs text-text-muted">{m.swap_tip_sub()}</p>
				</div>
			</div>
		</div>
	</header>

	<div class="animate-in fade-in rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
		<!-- Advanced filters -->
		<div class="mb-6 space-y-4">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div class="relative w-full sm:w-64">
					<Search
						class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
					/>
					<input
						type="search"
						class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
						placeholder={m.swap_search_placeholder()}
						bind:value={searchQuery}
					/>
					{#if searchQuery}
						<button
							class="absolute top-1/2 right-3 -translate-y-1/2 text-text-muted transition hover:text-text"
							onclick={() => (searchQuery = '')}
						>
							<X class="h-4 w-4" />
						</button>
					{/if}
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<select
						bind:value={selectedDepartmentFilter}
						class="h-9 rounded-xl border border-border/60 bg-surface px-3 text-xs font-semibold text-text outline-none"
					>
						<option value={null}>{m.swap_all_departments()}</option>
						{#each departments as dept}
							<option value={dept}>{dept}</option>
						{/each}
					</select>

					<select
						bind:value={selectedShiftTypeFilter}
						class="h-9 rounded-xl border border-border/60 bg-surface px-3 text-xs font-semibold text-text outline-none"
					>
						<option value={null}>{m.swap_all_shifts()}</option>
						{#each shiftTypes as type}
							<option value={type}>{type}</option>
						{/each}
					</select>

					{#if hasActiveFilters}
						<button
							class="h-9 rounded-full border border-warning/20 bg-warning/5 px-4 text-xs font-semibold text-warning transition hover:bg-warning/10"
							onclick={clearAllFilters}
						>
							<Filter class="mr-1 inline h-3 w-3" />
							{m.swap_clear_filters()}
						</button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Tab navigation -->
		<div
			class="bg-surface-subtle/70 mb-6 flex flex-wrap gap-2 rounded-2xl border border-border/50 p-2"
		>
			{#each getTabItems as tab}
				<button
					class="rounded-xl px-4 py-2 text-sm font-semibold transition-all {activeTab === tab.value
						? 'bg-surface text-text shadow-sm'
						: 'text-text-muted hover:text-text'}"
					onclick={() => {
						const val = tab.value as 'pending' | 'approval' | 'history';
						activeTab = val;
					}}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<div class="mt-4">
			{#if activeTab === 'pending'}
				{#if filteredPendingRequests.length === 0}
					<div
						class="bg-surface-subtle/40 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 px-6 py-12 text-sm text-text-muted"
					>
						<Clock class="h-10 w-10 text-text-subtle" />
						<span>{hasActiveFilters ? m.swap_empty_filtered() : m.swap_empty_pending()}</span>
					</div>
				{:else}
					<div class="overflow-hidden rounded-2xl border border-border/60">
						<table class="w-full text-sm">
							<thead>
								<tr class="bg-surface-subtle/60 border-b border-border/60">
									<th
										class="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-text-subtle uppercase"
										>Verzocht door</th
									>
									<th class="w-6 px-1 py-2.5"></th>
									<th
										class="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-text-subtle uppercase"
										>Collega</th
									>
									<th
										class="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-text-subtle uppercase"
										>Datum</th
									>
									<th
										class="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-text-subtle uppercase"
										>Status</th
									>
									<th
										class="px-4 py-2.5 text-right text-[10px] font-bold tracking-widest text-text-subtle uppercase"
										>Acties</th
									>
								</tr>
							</thead>
							<tbody class="divide-y divide-border/40 bg-surface">
								{#each filteredPendingRequests as request}
									<tr class="group hover:bg-surface-subtle/40 transition-colors">
										<td class="px-4 py-3">
											<div class="flex items-center gap-2.5">
												<div
													class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-[10px] font-bold text-brand"
												>
													{request.requesterName
														.split(' ')
														.map((n) => n[0])
														.join('')
														.slice(0, 2)}
												</div>
												<div>
													<p class="text-xs font-semibold text-text">{request.requesterName}</p>
													<div class="mt-0.5 flex items-center gap-1">
														<span
															class="bg-surface-subtle rounded px-1.5 py-0.5 text-[10px] font-medium text-text-muted"
															>{request.requesterShift.shiftType}</span
														>
														<span class="text-[10px] text-text-subtle"
															>{formatDate(request.requesterShift.date)}</span
														>
													</div>
												</div>
											</div>
										</td>
										<td class="px-1 py-3 text-center">
											<ArrowLeftRight class="h-3.5 w-3.5 text-brand/40" />
										</td>
										<td class="px-4 py-3">
											<div class="flex items-center gap-2.5">
												<div
													class="bg-surface-subtle flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-text-muted"
												>
													{request.targetName
														.split(' ')
														.map((n) => n[0])
														.join('')
														.slice(0, 2)}
												</div>
												<div>
													<p class="text-xs font-semibold text-text">{request.targetName}</p>
													<div class="mt-0.5 flex items-center gap-1">
														<span
															class="bg-surface-subtle rounded px-1.5 py-0.5 text-[10px] font-medium text-text-muted"
															>{request.targetShift.shiftType}</span
														>
														<span class="text-[10px] text-text-subtle"
															>{formatDate(request.targetShift.date)}</span
														>
													</div>
												</div>
											</div>
										</td>
										<td class="px-4 py-3 text-[11px] text-text-muted"
											>{formatDateTime(request.createdAt)}</td
										>
										<td class="px-4 py-3">
											<span
												class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold {statusConfig[
													request.status
												].className}"
											>
												{statusConfig[request.status].label()}
											</span>
										</td>
										<td class="px-4 py-3">
											<div class="flex items-center justify-end gap-1">
												<button
													class="flex h-7 w-7 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/60 hover:text-text"
													title={m.swap_action_cancel()}
													onclick={() => cancelSwap(request.id)}><X class="h-3.5 w-3.5" /></button
												>
												<button
													class="flex h-7 w-7 items-center justify-center rounded-lg text-text-subtle transition hover:bg-error/10 hover:text-error"
													title={m.swap_action_reject()}
													onclick={() => openAction(request.id, 'reject')}
													><XCircle class="h-3.5 w-3.5" /></button
												>
												<button
													class="flex h-7 w-7 items-center justify-center rounded-lg text-text-subtle transition hover:bg-success/10 hover:text-success"
													title={m.swap_action_accept()}
													onclick={() => openAction(request.id, 'accept')}
													><CheckCircle2 class="h-3.5 w-3.5" /></button
												>
											</div>
										</td>
									</tr>
									{#if request.reason}
										<tr class="bg-surface-subtle/20">
											<td colspan="6" class="px-4 py-2 text-[11px] text-text-muted">
												<span class="font-semibold">{m.swap_reason_label()}</span>
												{request.reason}
											</td>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			{:else if activeTab === 'approval'}
				{#if filteredApprovalRequests.length === 0}
					<div
						class="bg-surface-subtle/40 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 px-6 py-12 text-sm text-text-muted"
					>
						<Check class="h-10 w-10 text-text-subtle" />
						<span>{m.swap_empty_approval()}</span>
					</div>
				{:else}
					<div class="overflow-hidden rounded-2xl border border-brand/20">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-brand/15 bg-brand/5">
									<th
										class="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-brand/70 uppercase"
										>Verzocht door</th
									>
									<th class="w-6 px-1 py-2.5"></th>
									<th
										class="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-brand/70 uppercase"
										>Collega</th
									>
									<th
										class="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-brand/70 uppercase"
										>Datum</th
									>
									<th
										class="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-brand/70 uppercase"
										>Reactie collega</th
									>
									<th
										class="px-4 py-2.5 text-right text-[10px] font-bold tracking-widest text-brand/70 uppercase"
										>Acties</th
									>
								</tr>
							</thead>
							<tbody class="divide-y divide-border/40 bg-surface">
								{#each filteredApprovalRequests as request}
									<tr class="group hover:bg-surface-subtle/40 transition-colors">
										<td class="px-4 py-3">
											<div class="flex items-center gap-2.5">
												<div
													class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-[10px] font-bold text-brand"
												>
													{request.requesterName
														.split(' ')
														.map((n) => n[0])
														.join('')
														.slice(0, 2)}
												</div>
												<div>
													<p class="text-xs font-semibold text-text">{request.requesterName}</p>
													<div class="mt-0.5 flex items-center gap-1">
														<span
															class="bg-surface-subtle rounded px-1.5 py-0.5 text-[10px] font-medium text-text-muted"
															>{request.requesterShift.shiftType}</span
														>
														<span class="text-[10px] text-text-subtle"
															>{formatDate(request.requesterShift.date)}</span
														>
													</div>
												</div>
											</div>
										</td>
										<td class="px-1 py-3 text-center">
											<ArrowLeftRight class="h-3.5 w-3.5 text-brand/40" />
										</td>
										<td class="px-4 py-3">
											<div class="flex items-center gap-2.5">
												<div
													class="bg-surface-subtle flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-text-muted"
												>
													{request.targetName
														.split(' ')
														.map((n) => n[0])
														.join('')
														.slice(0, 2)}
												</div>
												<div>
													<p class="text-xs font-semibold text-text">{request.targetName}</p>
													<div class="mt-0.5 flex items-center gap-1">
														<span
															class="bg-surface-subtle rounded px-1.5 py-0.5 text-[10px] font-medium text-text-muted"
															>{request.targetShift.shiftType}</span
														>
														<span class="text-[10px] text-text-subtle"
															>{formatDate(request.targetShift.date)}</span
														>
													</div>
												</div>
											</div>
										</td>
										<td class="px-4 py-3 text-[11px] text-text-muted"
											>{formatDateTime(request.createdAt)}</td
										>
										<td class="px-4 py-3">
											{#if request.targetResponse}
												<span class="flex items-center gap-1 text-[11px] text-success">
													<CheckCircle2 class="h-3 w-3 shrink-0" />{request.targetResponse}
												</span>
											{:else}
												<span class="text-[11px] text-text-subtle">—</span>
											{/if}
										</td>
										<td class="px-4 py-3">
											<div class="flex items-center justify-end gap-1">
												<button
													class="flex h-7 w-7 items-center justify-center rounded-lg text-text-subtle transition hover:bg-error/10 hover:text-error"
													title={m.swap_action_deny()}
													onclick={() => openAction(request.id, 'deny')}
													><XCircle class="h-3.5 w-3.5" /></button
												>
												<button
													class="flex h-7 w-7 items-center justify-center rounded-lg text-text-subtle transition hover:bg-success/10 hover:text-success"
													title={m.swap_action_approve()}
													onclick={() => openAction(request.id, 'approve')}
													><CheckCircle2 class="h-3.5 w-3.5" /></button
												>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			{:else if historyRequests.length === 0}
				<div
					class="bg-surface-subtle/40 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 px-6 py-12 text-sm text-text-muted"
				>
					<ArrowLeftRight class="h-10 w-10 text-text-subtle" />
					<span>{m.swap_empty_history()}</span>
				</div>
			{:else}
				<div class="overflow-hidden rounded-2xl border border-border/60 opacity-90">
					<table class="w-full text-sm">
						<thead>
							<tr class="bg-surface-subtle/60 border-b border-border/60">
								<th
									class="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-text-subtle uppercase"
									>Verzocht door</th
								>
								<th class="w-6 px-1 py-2.5"></th>
								<th
									class="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-text-subtle uppercase"
									>Collega</th
								>
								<th
									class="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-text-subtle uppercase"
									>Datum</th
								>
								<th
									class="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-text-subtle uppercase"
									>Reactie</th
								>
								<th
									class="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-text-subtle uppercase"
									>Status</th
								>
							</tr>
						</thead>
						<tbody class="divide-y divide-border/40 bg-surface">
							{#each historyRequests as request}
								<tr class="hover:bg-surface-subtle/30 transition-colors">
									<td class="px-4 py-3">
										<div class="flex items-center gap-2.5">
											<div
												class="bg-surface-subtle flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-text-muted"
											>
												{request.requesterName
													.split(' ')
													.map((n) => n[0])
													.join('')
													.slice(0, 2)}
											</div>
											<div>
												<p class="text-xs font-semibold text-text">{request.requesterName}</p>
												<div class="mt-0.5 flex items-center gap-1">
													<span
														class="bg-surface-subtle rounded px-1.5 py-0.5 text-[10px] font-medium text-text-muted"
														>{request.requesterShift.shiftType}</span
													>
													<span class="text-[10px] text-text-subtle"
														>{formatDate(request.requesterShift.date)}</span
													>
												</div>
											</div>
										</div>
									</td>
									<td class="px-1 py-3 text-center">
										<ArrowLeftRight class="h-3.5 w-3.5 text-text-subtle/40" />
									</td>
									<td class="px-4 py-3">
										<div class="flex items-center gap-2.5">
											<div
												class="bg-surface-subtle flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-text-muted"
											>
												{request.targetName
													.split(' ')
													.map((n) => n[0])
													.join('')
													.slice(0, 2)}
											</div>
											<div>
												<p class="text-xs font-semibold text-text">{request.targetName}</p>
												<div class="mt-0.5 flex items-center gap-1">
													<span
														class="bg-surface-subtle rounded px-1.5 py-0.5 text-[10px] font-medium text-text-muted"
														>{request.targetShift.shiftType}</span
													>
													<span class="text-[10px] text-text-subtle"
														>{formatDate(request.targetShift.date)}</span
													>
												</div>
											</div>
										</div>
									</td>
									<td class="px-4 py-3 text-[11px] text-text-muted"
										>{formatDateTime(request.createdAt)}</td
									>
									<td class="max-w-[200px] px-4 py-3 text-[11px] text-text-muted">
										{#if request.adminNotes}
											<span class="truncate">{request.adminNotes}</span>
										{:else if request.targetResponse}
											<span class="truncate">{request.targetResponse}</span>
										{:else}
											<span class="text-text-subtle">—</span>
										{/if}
									</td>
									<td class="px-4 py-3">
										<span
											class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold {statusConfig[
												request.status
											].className}"
										>
											{statusConfig[request.status].label()}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</section>

<Modal
	bind:open={dialogOpen}
	title={dialogAction === 'accept'
		? m.swap_modal_accept_title()
		: dialogAction === 'reject'
			? m.swap_modal_reject_title()
			: dialogAction === 'approve'
				? m.swap_modal_approve_title()
				: m.swap_modal_deny_title()}
	description={dialogAction === 'accept'
		? m.swap_modal_accept_desc()
		: dialogAction === 'reject'
			? m.swap_modal_reject_desc()
			: dialogAction === 'approve'
				? m.swap_modal_approve_desc()
				: m.swap_modal_deny_desc()}
	size="md"
	class="max-w-lg"
>
	{#snippet children()}
		<Textarea
			label={m.swap_modal_note_label()}
			placeholder={m.swap_modal_note_placeholder()}
			bind:value={responseText}
		/>
	{/snippet}
	{#snippet footer()}
		<div class="flex justify-end gap-2">
			<Button variant="ghost" onclick={closeDialog}>{m.swap_modal_cancel()}</Button>
			<Button
				variant={dialogAction === 'reject' || dialogAction === 'deny' ? 'destructive' : 'primary'}
				onclick={confirmAction}
			>
				{m.swap_modal_confirm()}
			</Button>
		</div>
	{/snippet}
</Modal>

<Modal
	bind:open={successDialogOpen}
	title={successAction === 'approved' ? m.swap_success_approved() : m.swap_success_rejected()}
	description={successAction === 'approved'
		? m.swap_success_approved_desc()
		: m.swap_success_rejected_desc()}
	size="sm"
>
	{#snippet children()}
		<div class="space-y-4">
			<div class="flex justify-center">
				{#if successAction === 'approved'}
					<div class="rounded-full bg-success/10 p-4 text-success">
						<CheckCircle2 class="h-10 w-10" />
					</div>
				{:else}
					<div class="rounded-full bg-error/10 p-4 text-error">
						<XCircle class="h-10 w-10" />
					</div>
				{/if}
			</div>
			{#if successRequest}
				<div class="bg-surface-subtle rounded-2xl border border-border/60 p-4">
					<div class="flex items-center justify-between gap-4">
						<div class="flex-1 text-center">
							<p class="text-sm font-semibold text-text">{successRequest.requesterName}</p>
							<p class="text-xs text-text-muted">
								{formatDate(successRequest.requesterShift.date)}
							</p>
							<span
								class="mt-2 inline-flex items-center rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-text-muted"
							>
								{successRequest.requesterShift.service}
							</span>
						</div>
						<ArrowLeftRight class="h-5 w-5 text-text-muted" />
						<div class="flex-1 text-center">
							<p class="text-sm font-semibold text-text">{successRequest.targetName}</p>
							<p class="text-xs text-text-muted">
								{formatDate(successRequest.targetShift.date)}
							</p>
							<span
								class="mt-2 inline-flex items-center rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-text-muted"
							>
								{successRequest.targetShift.service}
							</span>
						</div>
					</div>
					{#if successAction === 'approved'}
						<p class="mt-4 text-center text-xs text-text-muted">
							De roosters zijn automatisch aangepast.
						</p>
					{/if}
				</div>
			{/if}
		</div>
	{/snippet}
	{#snippet footer()}
		<div class="flex justify-end">
			<Button
				onclick={() => {
					successDialogOpen = false;
					successRequest = null;
				}}
				class="w-full"
			>
				{m.leave_modal_cancel()}
			</Button>
		</div>
	{/snippet}
</Modal>

<Toast
	message={toast?.message ?? null}
	type={toast?.type ?? 'success'}
	onClose={() => (toast = null)}
/>
