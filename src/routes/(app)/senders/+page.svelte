<script lang="ts">
	import { Eye, Pencil, Phone, Plus, Search, Send, UserRound } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import DataTable, { type DataTableColumn } from '$lib/components/ui/DataTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	type SenderRow = PageData['senders'][number];

	const columns: DataTableColumn[] = [
		{ key: 'name', label: 'Sender', headerClass: 'pl-14' },
		{ key: 'location', label: 'Location' },
		{ key: 'phone', label: 'Phone' },
		{ key: 'registration', label: 'Registration', width: '190px' },
		{ key: 'clientsCount', label: 'Clients', align: 'right', width: '110px' },
		{ key: 'actions', label: '', align: 'right', width: '60px' }
	];

	const senders = $derived.by(() => data.senders);
	const currentPage = $derived.by(() => data.pagination.page);
	const pageSize = $derived.by(() => data.pagination.pageSize);
	const appliedSearch = $derived.by(() => (data.pagination.filters.search ?? '').trim());
	let searchTerm = $state('');

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

	const isRegistered = (sender: SenderRow) => Boolean(sender.kvkNumber || sender.btwNumber);

	const totalClients = $derived.by(() =>
		senders.reduce((total, sender) => total + sender.clientsCount, 0)
	);
	const registeredSenders = $derived.by(
		() => senders.filter((sender) => isRegistered(sender)).length
	);
</script>

<svelte:head>
	<title>Senders | MaiCare</title>
</svelte:head>

{#snippet tableFilters()}
	<div class="flex items-center gap-3">
		<div class="relative">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-subtle"
			/>
			<input
				type="text"
				placeholder="Search senders..."
				bind:value={searchTerm}
				class="h-9 w-64 rounded-xl border border-border bg-surface pr-3 pl-9 text-sm font-medium text-text-muted placeholder:text-text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
				onkeydown={(event) => {
					if (event.key === 'Enter') applySearch();
				}}
				onblur={applySearch}
			/>
		</div>
	</div>
{/snippet}

{#snippet nameCell(row: SenderRow)}
	<div class="flex items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20"
		>
			<UserRound class="h-5 w-5" />
		</div>
		<div class="space-y-1">
			<p class="text-sm font-semibold text-text">{row.name}</p>
			<span
				class="inline-flex w-fit items-center gap-2 rounded-full bg-border/50 px-2.5 py-1 text-[11px] font-semibold text-text"
			>
				{row.types}
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
				class="inline-flex w-fit items-center gap-2 rounded-full bg-border/50 px-2.5 py-1 font-semibold text-text"
			>
				KVK <span class="font-normal text-text-muted">{row.kvkNumber}</span>
			</span>
		{/if}
		{#if row.btwNumber}
			<span
				class="inline-flex w-fit items-center gap-2 rounded-full bg-brand/10 px-2.5 py-1 font-semibold text-brand"
			>
				BTW <span class="font-normal text-brand">{row.btwNumber}</span>
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
		<span class="text-xs text-text-subtle">clients</span>
	</span>
{/snippet}

{#snippet actionsCell(row: SenderRow)}
	<div class="flex justify-end gap-1">
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title="View sender"
		>
			<Eye class="h-4 w-4" />
		</button>
		<button
			class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-border/50 hover:text-text"
			title="Edit sender"
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
				<h1 class="text-3xl font-bold tracking-tighter text-text">Senders</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					Centralize referral sources, contact points, and active client assignments in one place.
				</p>
			</div>
			<Button class="gap-2" disabled>
				<Plus class="h-4 w-4" />
				Add sender
			</Button>
		</div>
	</header>

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				Total senders
			</div>
			<div class="mt-2 text-3xl font-bold tracking-tight text-text">
				{data.pagination.count}
			</div>
			<p class="mt-2 text-xs font-medium text-text-muted">Active referral partners</p>
		</div>
		<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				Clients linked
			</div>
			<div class="mt-2 text-3xl font-bold tracking-tight text-brand">{totalClients}</div>
			<p class="mt-2 text-xs font-medium text-text-muted">In the current view</p>
		</div>
		<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="text-[10px] font-bold tracking-widest text-text-subtle uppercase">
				Registration
			</div>
			<div class="mt-2 text-3xl font-bold tracking-tight text-text">
				{registeredSenders}
			</div>
			<p class="mt-2 text-xs font-medium text-text-muted">KVK or BTW in view</p>
		</div>
	</div>

	<DataTable
		{columns}
		rows={senders}
		{currentPage}
		{pageSize}
		totalCount={data.pagination.count}
		onPageChange={(nextPage) => updateQuery(nextPage, appliedSearch)}
		rowKey="id"
		title="Sender directory"
		description="Overview of referral sources, contact data, and client volume."
		filters={tableFilters}
		emptyTitle="No senders found"
		emptyDescription="Try a different search or add a new sender."
		cells={{
			name: nameCell,
			location: locationCell,
			phone: phoneCell,
			registration: registrationCell,
			clientCount: clientCountCell,
			actions: actionsCell
		}}
	/>
</section>
