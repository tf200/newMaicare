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

	const statusConfig: Record<SwapStatus, { label: string; className: string }> = {
		pending: {
			label: 'Wacht op collega',
			className: 'bg-warning/10 text-warning border-warning/20'
		},
		accepted_by_target: {
			label: 'Wacht op goedkeuring',
			className: 'bg-brand/10 text-brand border-brand/20'
		},
		rejected_by_target: {
			label: 'Afgewezen door collega',
			className: 'bg-error/10 text-error border-error/20'
		},
		approved: {
			label: 'Goedgekeurd',
			className: 'bg-success/10 text-success border-success/20'
		},
		rejected: {
			label: 'Afgewezen',
			className: 'bg-error/10 text-error border-error/20'
		},
		cancelled: {
			label: 'Geannuleerd',
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
	const selectedRequest = $derived.by(() =>
		swapRequests.find((r) => r.id === selectedRequestId) ?? null
	);
	
	// Derived filtered lists
	const filteredPendingRequests = $derived.by(() => {
		let results = pendingRequests;
		
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			results = results.filter((r) =>
				r.requesterName.toLowerCase().includes(query) ||
				r.targetName.toLowerCase().includes(query)
			);
		}
		
		if (selectedDepartmentFilter) {
			results = results.filter((r) =>
				r.requesterShift.service === selectedDepartmentFilter ||
				r.targetShift.service === selectedDepartmentFilter
			);
		}
		
		if (selectedShiftTypeFilter) {
			results = results.filter((r) =>
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
			results = results.filter((r) =>
				r.requesterName.toLowerCase().includes(query) ||
				r.targetName.toLowerCase().includes(query)
			);
		}
		
		if (selectedDepartmentFilter) {
			results = results.filter((r) =>
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
	
	const hasActiveFilters = $derived.by(() => 
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
		{ value: 'pending' as const, label: `Openstaand (${pendingRequests.length})` },
		{ value: 'approval' as const, label: `Te Goedkeuren (${awaitingApproval.length})` },
		{ value: 'history' as const, label: `Geschiedenis (${historyRequests.length})` }
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
			setToast('Ruilverzoek geaccepteerd. Wacht op goedkeuring.', 'success');
		} else if (dialogAction === 'reject') {
			updateRequest(selectedRequestId, {
				status: 'rejected_by_target',
				targetResponse: responseText || undefined
			});
			setToast('Ruilverzoek afgewezen.', 'warning');
		} else if (dialogAction === 'approve') {
			updateRequest(selectedRequestId, {
				status: 'approved',
				adminNotes: responseText || 'Goedgekeurd door planning.'
			});
			successAction = 'approved';
			successRequest = request;
			successDialogOpen = true;
			setToast('Dienstruil goedgekeurd.', 'success');
		} else if (dialogAction === 'deny') {
			updateRequest(selectedRequestId, {
				status: 'rejected',
				adminNotes: responseText || 'Afgewezen door planning.'
			});
			successAction = 'rejected';
			successRequest = request;
			successDialogOpen = true;
			setToast('Dienstruil afgewezen.', 'warning');
		}

		closeDialog();
	}

	function cancelSwap(requestId: string) {
		updateRequest(requestId, { status: 'cancelled' });
		setToast('Ruilverzoek geannuleerd.', 'warning');
	}
</script>

<svelte:head>
	<title>Dienst ruilen | MaiCare</title>
</svelte:head>

<section class="flex flex-col gap-6">
	<header class="rounded-3xl border border-border bg-surface/90 p-6 shadow-sm">
		<div class="flex flex-col gap-6">
			<!-- Header Top -->
			<div class="flex flex-wrap items-start justify-between gap-6">
				<div class="space-y-2">
					<div class="flex items-center gap-3 text-sm font-semibold text-brand">
						<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
							<ArrowLeftRight class="h-5 w-5" />
						</span>
						<span>Dienstplanning</span>
					</div>
					<h1 class="text-3xl font-bold tracking-tighter text-text">Dienst ruilen</h1>
					<p class="max-w-2xl text-sm font-medium text-text-muted">
						Beheer ruilverzoeken tussen medewerkers en bewaak de bezetting.
					</p>
				</div>
			</div>

			<!-- Quick Stats Row -->
			<div class="grid gap-3 md:grid-cols-3">
				<div class="flex items-center gap-3 rounded-2xl border border-border/50 bg-surface-subtle/50 px-4 py-3">
					<div class="rounded-xl bg-warning/10 p-2 text-warning">
						<Clock class="h-4 w-4" />
					</div>
					<div class="min-w-0">
						<p class="text-xs font-semibold uppercase text-text-muted">Wacht op reactie</p>
						<p class="text-lg font-bold text-text">{pendingRequests.length}</p>
					</div>
				</div>
				<div class="flex items-center gap-3 rounded-2xl border border-border/50 bg-surface-subtle/50 px-4 py-3">
					<div class="rounded-xl bg-brand/10 p-2 text-brand">
						<AlertCircle class="h-4 w-4" />
					</div>
					<div class="min-w-0">
						<p class="text-xs font-semibold uppercase text-text-muted">Te goedkeuren</p>
						<p class="text-lg font-bold text-text">{awaitingApproval.length}</p>
					</div>
				</div>
				<div class="flex items-center gap-3 rounded-2xl border border-border/50 bg-surface-subtle/50 px-4 py-3">
					<div class="rounded-xl bg-success/10 p-2 text-success">
						<CheckCircle2 class="h-4 w-4" />
					</div>
					<div class="min-w-0">
						<p class="text-xs font-semibold uppercase text-text-muted">Verwerkt</p>
						<p class="text-lg font-bold text-text">{historyRequests.length}</p>
					</div>
				</div>
			</div>

			<!-- Info boxes -->
			<div class="grid gap-2 text-xs text-text-muted sm:grid-cols-2">
				<div class="rounded-2xl border border-border/60 bg-surface px-3 py-2">
					<p class="font-semibold text-text">Werkflow</p>
					<p class="mt-1 text-xs">Collega akkoord → planning akkoord</p>
				</div>
				<div class="rounded-2xl border border-border/60 bg-surface px-3 py-2">
					<p class="font-semibold text-text">Tip</p>
					<p class="mt-1 text-xs">Controleer bezetting in roosters</p>
				</div>
			</div>
		</div>
	</header>

	<div class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm animate-in fade-in">
		<!-- Advanced filters -->
		<div class="space-y-3 mb-6">
			<!-- Search bar -->
			<div class="flex items-center gap-2 rounded-2xl border border-border/60 bg-surface-subtle/50 px-3 py-2">
				<Search class="h-4 w-4 text-text-muted" />
				<input
					type="text"
					placeholder="Zoek op naam..."
					bind:value={searchQuery}
					class="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
				/>
				{#if searchQuery}
					<button
						class="text-text-muted hover:text-text transition"
						onclick={() => (searchQuery = '')}
					>
						<X class="h-4 w-4" />
					</button>
				{/if}
			</div>

			<!-- Filter chips -->
			<div class="flex flex-wrap items-center gap-2">
				<select
					bind:value={selectedDepartmentFilter}
					class="rounded-xl border border-border/60 bg-surface-subtle px-3 py-2 text-xs font-semibold text-text outline-none"
				>
					<option value={null}>Alle afdelingen</option>
					{#each departments as dept}
						<option value={dept}>{dept}</option>
					{/each}
				</select>

				<select
					bind:value={selectedShiftTypeFilter}
					class="rounded-xl border border-border/60 bg-surface-subtle px-3 py-2 text-xs font-semibold text-text outline-none"
				>
					<option value={null}>Alle diensten</option>
					{#each shiftTypes as type}
						<option value={type}>{type}</option>
					{/each}
				</select>

				{#if hasActiveFilters}
					<button
						class="ml-auto rounded-xl border border-warning/20 bg-warning/5 px-3 py-2 text-xs font-semibold text-warning transition hover:bg-warning/10"
						onclick={clearAllFilters}
					>
						<Filter class="inline h-3 w-3 mr-1" />
						Filters wissen
					</button>
				{/if}
			</div>
		</div>

		<!-- Tab navigation -->
		<div class="flex flex-wrap gap-2 rounded-2xl border border-border/50 bg-surface-subtle/70 p-2 mb-6">
			{#each getTabItems as tab}
				<button
					class="rounded-xl px-4 py-2 text-sm font-semibold transition-all {activeTab ===
						tab.value
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

		<div class="mt-6 space-y-4">
			{#if activeTab === 'pending'}
				{#if filteredPendingRequests.length === 0}
					<div
						class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-surface-subtle/40 px-6 py-10 text-sm text-text-muted"
					>
						<Clock class="h-10 w-10 text-text-subtle" />
						<span>{hasActiveFilters ? 'Geen resultaten voor deze filters' : 'Geen openstaande ruilverzoeken'}</span>
					</div>
				{:else}
					{#each filteredPendingRequests as request}
						<div class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm hover:shadow-md transition-shadow">
							<div class="flex flex-col gap-4">
								<!-- Status and request info row -->
								<div class="flex items-start justify-between gap-4">
									<div>
										<p class="text-xs font-semibold uppercase text-text-muted">Ruilverzoek</p>
										<p class="mt-1 text-xs text-text-muted">{formatDateTime(request.createdAt)}</p>
									</div>
									<span
										class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold {statusConfig[
											request.status
										].className}"
									>
										{statusConfig[request.status].label}
									</span>
								</div>

								<!-- Swap visualization -->
								<div class="grid gap-4 sm:grid-cols-3 items-center">
									<div class="rounded-2xl border border-border/50 bg-surface-subtle/50 p-4 text-center">
										<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand font-semibold mx-auto mb-2">
											{request.requesterName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
										</div>
										<p class="font-semibold text-text text-sm">{request.requesterName}</p>
										<p class="text-xs text-text-muted mt-2">{formatDate(request.requesterShift.date)}</p>
										<div class="mt-3 space-y-1 text-xs">
											<p class="rounded border border-border/60 px-2 py-1 bg-surface text-text-muted">{request.requesterShift.service}</p>
											<p class="font-semibold text-text">{request.requesterShift.shiftType}</p>
										</div>
									</div>

									<div class="flex justify-center">
										<div class="rounded-xl bg-brand/10 p-2 text-brand">
											<ArrowLeftRight class="h-5 w-5" />
										</div>
									</div>

									<div class="rounded-2xl border border-border/50 bg-surface-subtle/50 p-4 text-center">
										<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand font-semibold mx-auto mb-2">
											{request.targetName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
										</div>
										<p class="font-semibold text-text text-sm">{request.targetName}</p>
										<p class="text-xs text-text-muted mt-2">{formatDate(request.targetShift.date)}</p>
										<div class="mt-3 space-y-1 text-xs">
											<p class="rounded border border-border/60 px-2 py-1 bg-surface text-text-muted">{request.targetShift.service}</p>
											<p class="font-semibold text-text">{request.targetShift.shiftType}</p>
										</div>
									</div>
								</div>

								<!-- Request reason if available -->
								{#if request.reason}
									<div class="rounded-2xl border border-border/50 bg-surface-subtle/50 p-4 text-sm text-text">
										<span class="font-semibold">Reden:</span> {request.reason}
									</div>
								{/if}

								<!-- Action buttons -->
								<div class="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border/50">
									<Button
										variant="ghost"
										class="h-9 text-xs"
										onclick={() => cancelSwap(request.id)}
									>
										Annuleren
									</Button>
									<Button
										variant="destructive"
										class="h-9 gap-1"
										onclick={() => openAction(request.id, 'reject')}
									>
										<X class="h-3 w-3" />
										<span class="hidden sm:inline">Afwijzen</span>
									</Button>
									<Button
										class="h-9 gap-1"
										onclick={() => openAction(request.id, 'accept')}
									>
										<Check class="h-3 w-3" />
										<span class="hidden sm:inline">Accepteren</span>
									</Button>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			{:else if activeTab === 'approval'}
				{#if filteredApprovalRequests.length === 0}
					<div
						class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-surface-subtle/40 px-6 py-10 text-sm text-text-muted"
					>
						<Check class="h-10 w-10 text-text-subtle" />
						<span>Geen verzoeken om goed te keuren</span>
					</div>
				{:else}
					{#each filteredApprovalRequests as request}
						<div class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm hover:shadow-md transition-shadow">
							<div class="flex flex-col gap-4">
								<!-- Status and request info row -->
								<div class="flex items-start justify-between gap-4">
									<div>
										<p class="text-xs font-semibold uppercase text-text-muted">Wacht op goedkeuring</p>
										<p class="mt-1 text-xs text-text-muted">{formatDateTime(request.createdAt)}</p>
									</div>
									<span
										class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold {statusConfig[
											request.status
										].className}"
									>
										{statusConfig[request.status].label}
									</span>
								</div>

								<!-- Swap visualization -->
								<div class="grid gap-4 sm:grid-cols-3 items-center">
									<div class="rounded-2xl border border-border/50 bg-surface-subtle/50 p-4 text-center">
										<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand font-semibold mx-auto mb-2">
											{request.requesterName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
										</div>
										<p class="font-semibold text-text text-sm">{request.requesterName}</p>
										<p class="text-xs text-text-muted mt-2">{formatDate(request.requesterShift.date)}</p>
										<div class="mt-3 space-y-1 text-xs">
											<p class="rounded border border-border/60 px-2 py-1 bg-surface text-text-muted">{request.requesterShift.service}</p>
											<p class="font-semibold text-text">{request.requesterShift.shiftType}</p>
										</div>
									</div>

									<div class="flex justify-center">
										<div class="rounded-xl bg-brand/10 p-2 text-brand">
											<ArrowLeftRight class="h-5 w-5" />
										</div>
									</div>

									<div class="rounded-2xl border border-border/50 bg-surface-subtle/50 p-4 text-center">
										<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand font-semibold mx-auto mb-2">
											{request.targetName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
										</div>
										<p class="font-semibold text-text text-sm">{request.targetName}</p>
										<p class="text-xs text-text-muted mt-2">{formatDate(request.targetShift.date)}</p>
										<div class="mt-3 space-y-1 text-xs">
											<p class="rounded border border-border/60 px-2 py-1 bg-surface text-text-muted">{request.targetShift.service}</p>
											<p class="font-semibold text-text">{request.targetShift.shiftType}</p>
										</div>
									</div>
								</div>

								<!-- Request details -->
								{#if request.reason}
									<div class="rounded-2xl border border-border/50 bg-surface-subtle/50 p-4 text-sm text-text">
										<span class="font-semibold text-text-muted">Reden:</span> {request.reason}
									</div>
								{/if}
								{#if request.targetResponse}
									<div class="rounded-2xl border border-success/20 bg-success/5 p-4 text-sm text-text">
										<span class="font-semibold text-success">✓ Collega akkoord:</span> {request.targetResponse}
									</div>
								{/if}

								<!-- Action buttons -->
								<div class="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border/50">
									<Button
										variant="destructive"
										class="h-9 gap-1"
										onclick={() => openAction(request.id, 'deny')}
									>
										<X class="h-3 w-3" />
										<span class="hidden sm:inline">Afwijzen</span>
									</Button>
									<Button
										class="h-9 gap-1"
										onclick={() => openAction(request.id, 'approve')}
									>
										<Check class="h-3 w-3" />
										<span class="hidden sm:inline">Goedkeuren</span>
									</Button>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			{:else}
				{#if historyRequests.length === 0}
					<div
						class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-surface-subtle/40 px-6 py-10 text-sm text-text-muted"
					>
						<ArrowLeftRight class="h-10 w-10 text-text-subtle" />
						<span>Nog geen afgeronde ruilverzoeken</span>
					</div>
				{:else}
					{#each historyRequests as request}
						<div class="rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
							<div
								class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
							>
								<div class="flex flex-wrap items-center gap-6">
									<div class="text-center">
										<p class="font-semibold text-text">{request.requesterName}</p>
										<p class="text-xs text-text-muted">
											{formatDate(request.requesterShift.date)}
										</p>
										<span
											class="mt-2 inline-flex items-center rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-text-muted"
										>
											{request.requesterShift.service}
										</span>
										<p class="mt-1 text-xs text-text-subtle">{request.requesterShift.shiftType}</p>
									</div>
									<ArrowLeftRight class="h-5 w-5 text-text-muted" />
									<div class="text-center">
										<p class="font-semibold text-text">{request.targetName}</p>
										<p class="text-xs text-text-muted">
											{formatDate(request.targetShift.date)}
										</p>
										<span
											class="mt-2 inline-flex items-center rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-text-muted"
										>
											{request.targetShift.service}
										</span>
										<p class="mt-1 text-xs text-text-subtle">{request.targetShift.shiftType}</p>
									</div>
								</div>

								<div class="flex flex-col gap-3 lg:items-end">
									<span
										class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold {statusConfig[
											request.status
										].className}"
									>
										{statusConfig[request.status].label}
									</span>
									<p class="text-xs text-text-muted">
										{formatDateTime(request.createdAt)}
									</p>
								</div>
							</div>

							{#if request.reason}
								<div class="mt-4 rounded-2xl border border-border/50 bg-surface-subtle p-4 text-sm text-text">
									<span class="font-semibold">Reden:</span> {request.reason}
								</div>
							{/if}
							{#if request.targetResponse}
								<div class="mt-2 rounded-2xl border border-border/50 bg-surface-subtle p-4 text-sm text-text">
									<span class="font-semibold">Reactie collega:</span> {request.targetResponse}
								</div>
							{/if}
							{#if request.adminNotes}
								<div class="mt-2 rounded-2xl border border-border/50 bg-surface-subtle p-4 text-sm text-text">
									<span class="font-semibold">Admin notitie:</span> {request.adminNotes}
								</div>
							{/if}
						</div>
					{/each}
				{/if}
			{/if}
		</div>
	</div>
</section>

<Modal
	bind:open={dialogOpen}
	title={
		dialogAction === 'accept'
			? 'Ruilverzoek accepteren'
			: dialogAction === 'reject'
				? 'Ruilverzoek afwijzen'
				: dialogAction === 'approve'
					? 'Dienstruil goedkeuren'
					: 'Dienstruil afwijzen'
	}
	description={
		dialogAction === 'accept'
			? 'Je gaat akkoord met deze dienstruil. Een admin zal het verzoek nog moeten goedkeuren.'
			: dialogAction === 'reject'
				? 'Je wijst dit ruilverzoek af.'
				: dialogAction === 'approve'
					? 'De diensten worden geruild na goedkeuring.'
					: 'Het ruilverzoek wordt afgewezen.'
	}
	size="md"
	class="max-w-lg"
>
	{#snippet children()}
		<Textarea
			label="Optionele opmerking"
			placeholder="Plaats hier een korte toelichting..."
			bind:value={responseText}
		/>
	{/snippet}
	{#snippet footer()}
		<div class="flex justify-end gap-2">
			<Button variant="ghost" onclick={closeDialog}>Annuleren</Button>
			<Button
				variant={dialogAction === 'reject' || dialogAction === 'deny' ? 'destructive' : 'primary'}
				onclick={confirmAction}
			>
				Bevestigen
			</Button>
		</div>
	{/snippet}
</Modal>

<Modal
	bind:open={successDialogOpen}
	title={successAction === 'approved' ? 'Dienstruil Goedgekeurd!' : 'Dienstruil Afgewezen'}
	description={
		successAction === 'approved'
			? 'De diensten zijn succesvol geruild.'
			: 'Het ruilverzoek is afgewezen.'
	}
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
				<div class="rounded-2xl border border-border/60 bg-surface-subtle p-4">
					<div class="flex items-center justify-between gap-4">
						<div class="text-center flex-1">
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
						<div class="text-center flex-1">
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
				Sluiten
			</Button>
		</div>
	{/snippet}
</Modal>

<Toast message={toast?.message ?? null} type={toast?.type ?? 'success'} onClose={() => (toast = null)} />
