<script lang="ts">
	import { Eye, Pencil, Phone, Plus, Search, Send, UserRound } from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CreateSenderForm from '$lib/components/forms/CreateSenderForm.svelte';
	import EditSenderForm from '$lib/components/forms/EditSenderForm.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { SendersLoadResult } from './+page';

	let { data } = $props<{
		data: {
			initial: {
				page: number;
				pageSize: number;
				filters: { search: string; includeArchived?: boolean };
			};
			sendersData: Promise<SendersLoadResult>;
		};
	}>();
	type SenderRow = SendersLoadResult['senders'][number];

	const columns: DataTableColumn[] = [
		{ key: 'name', label: 'Sender', headerClass: 'pl-14' },
		{ key: 'location', label: 'Location' },
		{ key: 'phone', label: 'Phone' },
		{ key: 'registration', label: 'Registration', width: '190px' },
		{ key: 'clientsCount', label: 'Clients', align: 'right', width: '110px' },
		{ key: 'actions', label: '', align: 'right', width: '60px' }
	];

	const senderTypeMeta: Record<string, { label: string; className: string }> = {
		main_provider: {
			label: 'Main provider',
			className: 'bg-brand text-white border border-brand/70'
		},
		local_authority: {
			label: 'Local authority',
			className: 'bg-border text-text-muted border border-border'
		},
		particular_party: {
			label: 'Private individual',
			className: 'bg-[var(--color-secondary)] text-white border border-[var(--color-secondary)]/70'
		},
		healthcare_institution: {
			label: 'Healthcare institution',
			className: 'bg-info text-white border border-info/70'
		}
	};

	const sendersDataPromise = $derived.by(() => data.sendersData);
	const currentPage = $derived.by(() => data.initial.page);
	const pageSize = $derived.by(() => data.initial.pageSize);
	const appliedSearch = $derived.by(() => (data.initial.filters.search ?? '').trim());
	let searchTerm = $state('');
	let showCreateSender = $state(false);
	let showEditSender = $state(false);
	let selectedSenderId = $state<string | null>(null);

	onMount(() => {
		searchTerm = appliedSearch;
	});

	const buildQuery = (pageValue: number, searchValue: string) => {
		const params = new URLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));
		if (searchValue) params.set('search', searchValue);
		return params.toString();
	};

	const updateQuery = (pageValue: number, searchValue: string) => {
		const nextQuery = buildQuery(pageValue, searchValue);
		if (page.url.searchParams.toString() === nextQuery) return;
		goto(`?${nextQuery}`, { replaceState: true, keepFocus: true, noScroll: true });
	};

	const applySearch = () => {
		const trimmed = searchTerm.trim();
		updateQuery(1, trimmed);
	};

	const openEdit = (id: string) => {
		selectedSenderId = id;
		showEditSender = true;
	};

	const formatOptional = (value: string | null | undefined, fallback = '—') =>
		value && value.trim().length > 0 ? value : fallback;

	const formatAddress = (sender: SenderRow) => {
		const base = [sender.street, sender.houseNumber].filter(Boolean).join(' ');
		const addition = sender.houseNumberAddition?.trim() ?? '';
		return `${base}${addition ? addition : ''}`.trim();
	};

	const formatCity = (sender: SenderRow) =>
		[formatOptional(sender.postalCode, ''), formatOptional(sender.city, '')]
			.filter(Boolean)
			.join(' ')
			.trim();

	const getTypeMeta = (value: string) =>
		senderTypeMeta[value] ?? { label: value || '—', className: 'bg-border/50 text-text-muted' };

	const isRegistered = (sender: SenderRow) => Boolean(sender.kvkNumber || sender.btwNumber);
</script>

<svelte:head>
	<title>{m.senders_page_title()}</title>
</svelte:head>

{#snippet tableFilters()}
	<div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
		<div class="relative w-full sm:w-auto">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="text"
				placeholder={m.search_senders_placeholder()}
				bind:value={searchTerm}
				class="h-9 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text-muted placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none sm:w-64"
				onkeydown={(event) => {
					if (event.key === 'Enter') applySearch();
				}}
				onblur={applySearch}
			/>
		</div>
	</div>
{/snippet}

{#snippet nameCell(row: SenderRow)}
	{@const typeMeta = getTypeMeta(row.types)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20"
		>
			<UserRound class="h-5 w-5" />
		</div>
		<div class="space-y-1">
			<p class="text-sm font-semibold text-text">{row.name}</p>
			<span
				class="inline-flex w-fit items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold {typeMeta.className}"
			>
				{typeMeta.label}
			</span>
		</div>
	</div>
{/snippet}

{#snippet locationCell(row: SenderRow)}
	<div class="space-y-1">
		<span class="text-sm font-medium text-text-muted">{formatCity(row)}</span>
		<span class="block text-xs text-text-subtle">{formatOptional(formatAddress(row))}</span>
	</div>
{/snippet}

{#snippet phoneCell(row: SenderRow)}
	<div class="flex items-center gap-2 text-sm text-text-muted">
		<Phone class="h-4 w-4 text-text-subtle" />
		<span>{formatOptional(row.phoneNumber)}</span>
	</div>
{/snippet}

{#snippet registrationCell(row: SenderRow)}
	<div class="flex flex-col gap-1 text-xs text-text-muted">
		{#if row.kvkNumber}
			<span
				class="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-secondary)]/70 bg-[var(--color-secondary)] px-2.5 py-1 font-semibold text-white"
			>
				KVK <span class="font-normal text-white">{row.kvkNumber}</span>
			</span>
		{/if}
		{#if row.btwNumber}
			<span
				class="inline-flex w-fit items-center gap-2 rounded-full border border-brand/70 bg-brand px-2.5 py-1 font-semibold text-white"
			>
				BTW <span class="font-normal text-white">{row.btwNumber}</span>
			</span>
		{/if}
		{#if !row.kvkNumber && !row.btwNumber}
			<span class="text-text-subtle">—</span>
		{/if}
	</div>
{/snippet}

{#snippet clientCountCell(row: SenderRow)}
	<span class="inline-flex items-center justify-end gap-1.5">
		<span class="text-sm font-semibold text-text">{row.clientsCount}</span>
		<span class="text-xs text-text-subtle">{m.clients()}</span>
	</span>
{/snippet}

{#snippet actionsCell(row: SenderRow)}
	<div class="flex justify-end gap-1">
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title={m.view_sender()}
		>
			<Eye class="h-4 w-4" />
		</button>
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title={m.edit_sender()}
			onclick={() => openEdit(row.id)}
		>
			<Pencil class="h-4 w-4" />
		</button>
	</div>
{/snippet}

<section class="space-y-6">
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-teal-100/70 to-emerald-100/20 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<Send class="h-5 w-5" />
					</span>
					<span>{m.senders()}</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">{m.senders()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					Centralize referral sources, contact points, and active client assignments in one place.
				</p>
			</div>
			<Button class="gap-2" onclick={() => (showCreateSender = true)}>
				<Plus class="h-4 w-4" />
				Add sender
			</Button>
		</div>
	</header>

	<CreateSenderForm bind:open={showCreateSender} onCreated={() => invalidateAll()} />
	<EditSenderForm
		bind:open={showEditSender}
		senderId={selectedSenderId}
		onUpdated={() => invalidateAll()}
	/>

	{#await sendersDataPromise}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each [1, 2, 3] as _}
				<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm" aria-busy="true">
					<div class="h-3 w-24 animate-pulse rounded bg-border/70"></div>
					<div class="mt-3 h-8 w-16 animate-pulse rounded bg-border/70"></div>
				</div>
			{/each}
		</div>

		<DataTable
			{columns}
			rows={[]}
			loading
			{currentPage}
			{pageSize}
			totalCount={0}
			onPageChange={(nextPage) => updateQuery(nextPage, appliedSearch)}
			rowKey="id"
			title={m.sender_directory()}
			description="Overview of referral sources, contact data, and client volume."
			filters={tableFilters}
			emptyTitle="No senders found"
			emptyDescription="Try a different search or add a new sender."
			emptyActionLabel="Add sender"
			emptyAction={() => (showCreateSender = true)}
			cells={{
				name: nameCell,
				location: locationCell,
				phone: phoneCell,
				registration: registrationCell,
				clientCount: clientCountCell,
				actions: actionsCell
			}}
		/>
	{:then sendersData}
		{@const senders = sendersData.senders}
		{@const totalClients = senders.reduce(
			(total: number, sender: SenderRow) => total + sender.clientsCount,
			0
		)}
		{@const registeredSenders = senders.filter((sender: SenderRow) => isRegistered(sender)).length}

		{#if sendersData.loadError}
			<InlineErrorBanner message={sendersData.loadError} onRetry={() => invalidateAll()} />
		{/if}

		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					Total senders
				</div>
				<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
					{sendersData.pagination.count}
				</div>
				<p class="mt-2 text-xs font-medium text-text-muted">{m.active_referral_partners()}</p>
			</div>
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					Clients linked
				</div>
				<div class="mt-2 text-2xl font-bold tracking-tight text-brand sm:text-3xl">
					{totalClients}
				</div>
				<p class="mt-2 text-xs font-medium text-text-muted">{m.in_current_view()}</p>
			</div>
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
					Registration
				</div>
				<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
					{registeredSenders}
				</div>
				<p class="mt-2 text-xs font-medium text-text-muted">{m.kvk_btw_in_view()}</p>
			</div>
		</div>

		<DataTable
			{columns}
			rows={senders}
			currentPage={sendersData.pagination.page}
			pageSize={sendersData.pagination.pageSize}
			totalCount={sendersData.pagination.count}
			onPageChange={(nextPage) => updateQuery(nextPage, appliedSearch)}
			rowKey="id"
			title={m.sender_directory()}
			description="Overview of referral sources, contact data, and client volume."
			filters={tableFilters}
			emptyTitle="No senders found"
			emptyDescription="Try a different search or add a new sender."
			emptyActionLabel="Add sender"
			emptyAction={() => (showCreateSender = true)}
			cells={{
				name: nameCell,
				location: locationCell,
				phone: phoneCell,
				registration: registrationCell,
				clientCount: clientCountCell,
				actions: actionsCell
			}}
		/>
	{/await}
</section>
