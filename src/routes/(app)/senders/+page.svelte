<script lang="ts">
	import {
		BadgeCheck,
		Link,
		Pencil,
		Phone,
		Plus,
		Search,
		Send,
		UserRound,
		UsersRound
	} from 'lucide-svelte';
	import { afterNavigate, goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CreateSenderForm from '$lib/components/forms/CreateSenderForm.svelte';
	import EditSenderForm from '$lib/components/forms/EditSenderForm.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { SendersLoadResult } from './+page';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	type SenderRow = SendersLoadResult['senders'][number];

	const columns = $derived<DataTableColumn[]>([
		{ key: 'name', label: m.sender(), headerClass: 'pl-14' },
		{ key: 'location', label: m.location() },
		{ key: 'phone', label: m.phone() },
		{ key: 'registration', label: m.registration(), width: '190px' },
		{ key: 'clientsCount', label: m.clients(), align: 'right', width: '110px' },
		{ key: 'actions', label: '', align: 'right', width: '60px' }
	]);

	const senderTypeClasses: Record<string, string> = {
		main_provider: 'border border-brand/70 bg-brand text-white',
		local_authority: 'border border-border bg-border text-text-muted',
		particular_party: 'border border-secondary/70 bg-secondary text-white',
		healthcare_institution: 'border border-info/70 bg-info text-white'
	};

	const sendersDataPromise = $derived.by(() => data.sendersData);
	const currentPage = $derived.by(() => data.initial.page);
	const pageSize = $derived.by(() => data.initial.pageSize);
	const appliedSearch = $derived.by(() => (data.initial.filters.search ?? '').trim());
	let searchTerm = $state('');
	let showCreateSender = $state(false);
	let showEditSender = $state(false);
	let selectedSenderId = $state<string | null>(null);

	afterNavigate(() => {
		searchTerm = appliedSearch;
	});

	const buildQuery = (pageValue: number, searchValue: string) => {
		const params = new SvelteURLSearchParams();
		params.set('page', String(pageValue));
		params.set('page_size', String(pageSize));
		if (searchValue) params.set('search', searchValue);
		return params.toString();
	};

	const updateQuery = (pageValue: number, searchValue: string) => {
		const nextQuery = buildQuery(pageValue, searchValue);
		if (page.url.searchParams.toString() === nextQuery) return;
		goto(resolve(`/(app)/senders?${nextQuery}`), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
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

	const getTypeLabel = (value: string) => {
		if (value === 'main_provider') return m.main_provider();
		if (value === 'local_authority') return m.local_authority();
		if (value === 'particular_party') return m.private_individual();
		if (value === 'healthcare_institution') return m.healthcare_institution();
		return value || '—';
	};

	const getTypeMeta = (value: string) => ({
		label: getTypeLabel(value),
		className: senderTypeClasses[value] ?? 'bg-border/50 text-text-muted'
	});

	const isRegistered = (sender: SenderRow) => Boolean(sender.kvkNumber || sender.btwNumber);
</script>

<svelte:head>
	<title>{m.senders_page_title()}</title>
</svelte:head>

{#snippet tableFilters()}
	<div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
		<div class="relative w-full sm:w-auto">
			<label class="sr-only" for="sender-search">{m.search_senders_placeholder()}</label>
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				id="sender-search"
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
				class="inline-flex w-fit items-center gap-2 rounded-full border border-secondary/70 bg-secondary px-2.5 py-1 font-semibold text-white"
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
			type="button"
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
			title={m.edit_sender()}
			aria-label={m.edit_sender()}
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
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-brand/15 to-success/10 blur-2xl"
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
					{m.senders_description()}
				</p>
			</div>
			<Button class="gap-2" onclick={() => (showCreateSender = true)}>
				<Plus class="h-4 w-4" />
				{m.add_sender()}
			</Button>
		</div>
	</header>

	<CreateSenderForm bind:open={showCreateSender} onCreated={() => invalidate('app:senders:list')} />
	<EditSenderForm
		bind:open={showEditSender}
		senderId={selectedSenderId}
		onUpdated={() => invalidate('app:senders:list')}
	/>

	{#await sendersDataPromise}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each [1, 2, 3] as item (item)}
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
			pagination={{
				mode: 'server',
				page: currentPage,
				pageSize,
				totalCount: 0,
				onPageChange: (nextPage) => updateQuery(nextPage, appliedSearch)
			}}
			rowKey="id"
			title={m.sender_directory()}
			description={m.sender_directory_description()}
			toolbar={tableFilters}
			empty={{
				title: m.no_senders_found(),
				description: m.no_senders_description(),
				action: { label: m.add_sender(), onClick: () => (showCreateSender = true) }
			}}
			cells={{
				name: nameCell,
				location: locationCell,
				phone: phoneCell,
				registration: registrationCell,
				clientsCount: clientCountCell,
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

		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			<StatCard
				label={m.total_senders()}
				value={sendersData.pagination.count}
				description={m.active_filters_scope()}
				icon={UsersRound}
			/>
			<StatCard
				label={m.clients_linked()}
				value={totalClients}
				description={m.current_page()}
				icon={Link}
				color="brand"
			/>
			<StatCard
				label={m.registered_senders()}
				value={registeredSenders}
				description={m.current_page()}
				icon={BadgeCheck}
				color="secondary"
			/>
		</div>

		<DataTable
			{columns}
			rows={senders}
			pagination={{
				mode: 'server',
				page: sendersData.pagination.page,
				pageSize: sendersData.pagination.pageSize,
				totalCount: sendersData.pagination.count,
				onPageChange: (nextPage) => updateQuery(nextPage, appliedSearch)
			}}
			rowKey="id"
			title={m.sender_directory()}
			description={m.sender_directory_description()}
			toolbar={tableFilters}
			empty={{
				title: m.no_senders_found(),
				description: m.no_senders_description(),
				action: { label: m.add_sender(), onClick: () => (showCreateSender = true) }
			}}
			error={sendersData.loadError ?? undefined}
			onRetry={() => invalidate('app:senders:list')}
			cells={{
				name: nameCell,
				location: locationCell,
				phone: phoneCell,
				registration: registrationCell,
				clientsCount: clientCountCell,
				actions: actionsCell
			}}
		/>
	{/await}
</section>
