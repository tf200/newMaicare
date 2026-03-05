<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { invalidateAll } from '$app/navigation';
	import {
		Calendar,
		CircleDashed,
		FileText,
		User,
		Building2,
		Download,
		Clock,
		CheckCircle2,
		Timer,
		XCircle,
		SquareMinus,
		Banknote,
		MapPin,
		Phone,
		Mail,
		Info,
		Wallet,
		SquarePen,
		ChevronRight
	} from 'lucide-svelte';
	import type { ContractDetailLoadResult } from './+page';
	import Button from '$lib/components/ui/Button.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import EditContractForm from '$lib/components/forms/EditContractForm.svelte';
	import UpdateContractStatusForm from '$lib/components/forms/UpdateContractStatusForm.svelte';

	let { data } = $props<{
		data: {
			contractData: Promise<ContractDetailLoadResult>;
		};
	}>();

	const contractDataPromise = $derived(data.contractData);
	let showEditContractModal = $state(false);
	let showUpdateStatusModal = $state(false);

	const statusMeta = {
		approved: {
			label: () => m.approved(),
			className: 'bg-emerald-600 text-white border-emerald-700/50 shadow-sm shadow-emerald-700/20',
			icon: CheckCircle2
		},
		draft: {
			label: () => m.draft(),
			className: 'bg-amber-500 text-white border-amber-600/50 shadow-sm shadow-amber-600/20',
			icon: Timer
		},
		terminated: {
			label: () => m.terminated(),
			className: 'bg-rose-600 text-white border-rose-700/50 shadow-sm shadow-rose-700/20',
			icon: XCircle
		},
		stopped: {
			label: () => m.stopped(),
			className: 'bg-slate-600 text-white border-slate-700/50 shadow-sm shadow-slate-700/20',
			icon: SquareMinus
		},
		expired: {
			label: () => m.expired(),
			className: 'bg-zinc-500 text-white border-zinc-600/50 shadow-sm shadow-zinc-600/20',
			icon: Clock
		}
	} as const;

	const formatDate = (date: string | null | undefined) => {
		if (!date) return '—';
		return new Intl.DateTimeFormat('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).format(new Date(date));
	};

	const formatDateTime = (date: string | null | undefined) => {
		if (!date) return '—';
		return new Intl.DateTimeFormat('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
	};

	const formatCurrency = (amount: number | null | undefined) => {
		if (amount === null || amount === undefined) return '—';
		return new Intl.NumberFormat('nl-NL', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount);
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	};

	const formatOptional = (value: string | null | undefined) => {
		if (!value) return '—';
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : '—';
	};
</script>

<svelte:head>
	<title>{m.contract_details()} | MaiCare</title>
</svelte:head>

<div class="space-y-6">
	{#await contractDataPromise}
		<!-- Loading State -->
		<div class="flex items-center justify-between">
			<div class="h-8 w-48 animate-pulse rounded bg-border/70"></div>
			<div class="flex gap-2">
				<div class="h-9 w-32 animate-pulse rounded-xl bg-border/70"></div>
				<div class="h-9 w-32 animate-pulse rounded-xl bg-border/70"></div>
			</div>
		</div>
		<header
			class="h-48 w-full animate-pulse rounded-3xl border border-border bg-surface/50"
		></header>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each [1, 2, 3, 4] as _, i (i)}
				<div class="h-32 animate-pulse rounded-3xl border border-border bg-surface/50"></div>
			{/each}
		</div>
		<div class="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
			<div class="space-y-6">
				<div class="h-64 animate-pulse rounded-3xl border border-border bg-surface/50"></div>
				<div class="h-64 animate-pulse rounded-3xl border border-border bg-surface/50"></div>
			</div>
			<div class="space-y-6">
				<div class="h-48 animate-pulse rounded-3xl border border-border bg-surface/50"></div>
				<div class="h-48 animate-pulse rounded-3xl border border-border bg-surface/50"></div>
			</div>
		</div>
	{:then { contract, loadError }}
		{#if loadError}
			<InlineErrorBanner message={loadError} onRetry={() => invalidateAll()} />
		{/if}

		{#if contract}
			<!-- Breadcrumbs & Actions -->
			<div class="flex items-center justify-between">
				<nav class="flex items-center gap-2 text-sm font-medium text-text-subtle">
					<a href="/contracts" class="transition-colors hover:text-text">{m.contracts()}</a>
					<ChevronRight class="h-4 w-4" />
					<span class="text-text">{contract.careName}</span>
				</nav>

				<div class="flex flex-wrap items-center justify-end gap-2">
					<Button
						variant="ghost"
						class="h-9 gap-2 px-4 ring-1 ring-border"
						onclick={() => (showUpdateStatusModal = true)}
					>
						<CircleDashed class="h-4 w-4" />
						{m.update_status()}
					</Button>
					<Button
						class="h-9 gap-2 px-4 shadow-md shadow-brand/25"
						onclick={() => (showEditContractModal = true)}
					>
						<SquarePen class="h-4 w-4" />
						{m.update_contract()}
					</Button>
				</div>
			</div>

			{@const meta = statusMeta[contract.status as keyof typeof statusMeta]}
			{#key `${contract.id}-edit-${showEditContractModal}`}
				<EditContractForm
					bind:open={showEditContractModal}
					{contract}
					onUpdated={() => invalidateAll()}
				/>
			{/key}
			{#key `${contract.id}-status-${showUpdateStatusModal}`}
				<UpdateContractStatusForm
					bind:open={showUpdateStatusModal}
					contractId={contract.id}
					currentStatus={contract.status}
					onUpdated={() => invalidateAll()}
				/>
			{/key}

			<!-- Hero Header -->
			<header
				class="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
			>
				<!-- Background Accents -->
				<div
					class="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-brand/10 to-transparent blur-3xl"
				></div>
				<div
					class="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-500/10 to-transparent blur-3xl"
				></div>

				<div class="relative p-8">
					<div class="space-y-6">
						<div class="flex flex-wrap items-start justify-between gap-4">
							<div class="flex items-center gap-4">
								<div
									class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 text-2xl font-bold text-zinc-700 shadow-inner ring-1 ring-black/5 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-300 dark:ring-white/10"
								>
									<FileText class="h-8 w-8 text-brand/70" />
								</div>
								<div>
									<div class="flex flex-wrap items-center gap-3">
										<h1 class="text-3xl font-bold tracking-tight text-text">
											{contract.careName}
										</h1>
										<span
											class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide uppercase {meta.className}"
										>
											<meta.icon class="h-3.5 w-3.5" />
											{meta.label()}
										</span>
									</div>
									<div class="mt-1 flex items-center gap-3">
										<p class="text-sm font-semibold text-text-muted">
											ID: <span class="font-mono text-xs">{contract.id.slice(0, 8)}</span>
										</p>
										<span class="h-1 w-1 rounded-full bg-border"></span>
										<p class="text-sm font-medium text-text-muted capitalize">
											{contract.careType}
										</p>
									</div>
								</div>
							</div>

							<div class="flex flex-wrap gap-6 text-sm text-text-muted">
								<div class="flex items-center gap-2">
									<User class="h-4 w-4 text-text-subtle" />
									<span class="font-semibold text-text"
										>{contract.client.firstName} {contract.client.lastName}</span
									>
									<span class="text-text-subtle">({contract.client.fileNumber})</span>
								</div>
								<div class="flex items-center gap-2 border-l border-border pl-6">
									<Clock class="h-4 w-4 text-text-subtle" />
									<span>{m.created()}: {formatDate(contract.createdAt)}</span>
								</div>
								{#if contract.approvedAt}
									<div class="flex items-center gap-2 border-l border-border pl-6">
										<CheckCircle2 class="h-4 w-4 text-emerald-500" />
										<span>{m.approved()}: {formatDate(contract.approvedAt)}</span>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</header>

			<!-- KPI Cards -->
			<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div
					class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm"
				>
					<div class="absolute -right-4 -bottom-4 text-text opacity-[0.03]">
						<Banknote class="h-32 w-32" />
					</div>
					<div class="relative">
						<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
							>{m.price()}</span
						>
						<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
							{formatCurrency(contract.price)}
						</div>
						<p class="mt-2 text-xs font-medium text-text-muted">
							{m.per_unit({ unit: contract.priceTimeUnit })}
						</p>
					</div>
				</div>

				<div
					class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-blue-500/30"
				>
					<div
						class="absolute -right-4 -bottom-4 text-blue-500 opacity-[0.03] transition-opacity group-hover:opacity-10"
					>
						<Calendar class="h-32 w-32" />
					</div>
					<div class="relative">
						<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
							>{m.period()}</span
						>
						<div class="mt-2 text-xl font-bold tracking-tight text-text sm:text-2xl">
							{formatDate(contract.startDate)} — {formatDate(contract.endDate)}
						</div>
						<p class="mt-2 text-xs font-medium text-text-muted">{m.effective_dates()}</p>
					</div>
				</div>

				<div
					class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-cyan-500/30"
				>
					<div
						class="absolute -right-4 -bottom-4 text-cyan-500 opacity-[0.03] transition-opacity group-hover:opacity-10"
					>
						<Wallet class="h-32 w-32" />
					</div>
					<div class="relative">
						<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
							>{m.financing()}</span
						>
						<div class="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
							{contract.financingAct}
						</div>
						<p class="mt-2 text-xs font-medium text-text-muted">
							{m.via_option({ option: contract.financingOption })}
						</p>
					</div>
				</div>

				<div
					class="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-amber-500/30"
				>
					<div
						class="absolute -right-4 -bottom-4 text-amber-500 opacity-[0.03] transition-opacity group-hover:opacity-10"
					>
						<Info class="h-32 w-32" />
					</div>
					<div class="relative">
						<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
							>{m.reminders_vat()}</span
						>
						<div class="mt-2 flex items-baseline gap-2">
							<span class="text-2xl font-bold tracking-tight text-text sm:text-3xl">
								{contract.reminderPeriod ?? '—'}
							</span>
							<span class="text-sm font-semibold text-text-muted">({contract.vat}%)</span>
						</div>
						<p class="mt-2 text-xs font-medium text-text-muted">{m.notice_period_vat()}</p>
					</div>
				</div>
			</section>

			<div class="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
				<!-- Main Column -->
				<div class="space-y-6">
					<!-- Contract Terms -->
					<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
						<div class="mb-6 flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"
							>
								<FileText class="h-5 w-5" />
							</div>
							<div>
								<h2 class="text-lg font-bold text-text">{m.contract_terms()}</h2>
								<p class="text-xs text-text-subtle">{m.contract_terms_description()}</p>
							</div>
						</div>

						<div class="grid gap-8 md:grid-cols-2">
							<div class="space-y-4">
								<div class="flex justify-between border-b border-border/50 pb-2">
									<span class="text-sm text-text-muted">{m.contract_type()}</span>
									<span class="text-sm font-semibold text-text">{contract.typeName ?? '—'}</span>
								</div>
								<div class="flex justify-between border-b border-border/50 pb-2">
									<span class="text-sm text-text-muted">{m.price_unit()}</span>
									<span class="text-sm font-semibold text-text capitalize"
										>{contract.priceTimeUnit}</span
									>
								</div>
								<div class="flex justify-between border-b border-border/50 pb-2">
									<span class="text-sm text-text-muted">{m.hours()}</span>
									<span class="text-sm font-semibold text-text">
										{contract.hours ? `${contract.hours} ${m.hrs()}` : '—'}
										{#if contract.hoursType}
											<span class="text-xs font-medium text-text-subtle"
												>({contract.hoursType})</span
											>
										{/if}
									</span>
								</div>
							</div>

							<div class="space-y-4">
								<div class="flex justify-between border-b border-border/50 pb-2">
									<span class="text-sm text-text-muted">{m.start_date()}</span>
									<span class="text-sm font-semibold text-text"
										>{formatDate(contract.startDate)}</span
									>
								</div>
								<div class="flex justify-between border-b border-border/50 pb-2">
									<span class="text-sm text-text-muted">{m.end_date()}</span>
									<span class="text-sm font-semibold text-text">{formatDate(contract.endDate)}</span
									>
								</div>
								<div class="flex justify-between border-b border-border/50 pb-2">
									<span class="text-sm text-text-muted">{m.updated()}</span>
									<span class="text-sm font-semibold text-text"
										>{formatDateTime(contract.updatedAt)}</span
									>
								</div>
							</div>
						</div>

						{#if contract.departureReason || contract.departureReport}
							<div class="mt-8 space-y-4">
								<h3 class="text-sm font-bold tracking-wider text-text-subtle uppercase">
									{m.departure_information()}
								</h3>
								<div class="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
									<p class="text-sm font-semibold text-text">
										{m.reason()}:
										<span class="font-normal text-text-muted"
											>{contract.departureReason || '—'}</span
										>
									</p>
									{#if contract.departureReport}
										<div class="mt-3">
											<p class="text-xs font-bold text-text-subtle uppercase">{m.report()}</p>
											<p class="mt-1 text-sm text-text-muted italic">
												"{contract.departureReport}"
											</p>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</section>

					<!-- Attachments -->
					<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
						<div class="mb-6 flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"
								>
									<FileText class="h-5 w-5" />
								</div>
								<div>
									<h2 class="text-lg font-bold text-text">{m.attachments()}</h2>
									<p class="text-xs text-text-subtle">{m.attachments_description()}</p>
								</div>
							</div>
							<span class="text-xs font-semibold text-text-subtle"
								>{contract.attachments.length} {m.files()}</span
							>
						</div>

						<div class="grid gap-3 sm:grid-cols-2">
							{#each contract.attachments as file (file.id)}
								<div
									class="group flex items-center gap-4 rounded-2xl border border-border/50 bg-zinc-50/50 p-4 transition-all hover:border-brand/30 hover:bg-white hover:shadow-md dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
								>
									<div
										class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10"
									>
										<FileText class="h-6 w-6" />
									</div>
									<div class="min-w-0 flex-1">
										<p class="truncate text-sm font-bold text-text group-hover:text-brand">
											{file.name}
										</p>
										<p class="text-xs font-medium text-text-subtle">
											{formatFileSize(file.size)}
										</p>
									</div>
									<a
										href={file.downloadUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-text-subtle shadow-sm ring-1 ring-border transition-all hover:bg-brand hover:text-white hover:ring-brand"
										title={m.download_file()}
									>
										<Download class="h-4 w-4" />
									</a>
								</div>
							{:else}
								<div
									class="col-span-full flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-border bg-zinc-50/30 py-16 px-6 text-center dark:bg-zinc-900/20"
								>
									<div class="relative mb-6">
										<div
											class="absolute -inset-6 rounded-full bg-brand/5 blur-3xl dark:bg-brand/10"
										></div>
										<div
											class="relative flex h-20 w-20 items-center justify-center rounded-[2rem] bg-surface shadow-sm ring-1 ring-border"
										>
											<FileText class="h-10 w-10 text-brand/30" />
											<div
												class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-brand ring-4 ring-surface"
											>
												<Info class="h-4 w-4" />
											</div>
										</div>
									</div>
									<div class="max-w-sm">
										<h2 class="text-lg font-bold tracking-tight text-text">
											{m.no_documents_attached()}
										</h2>
										<p class="mt-2 text-sm leading-relaxed text-text-muted">
											{m.no_documents_attached_description()}
										</p>
										<div class="mt-8 flex flex-col items-center gap-2">
											<div
												class="h-px w-12 bg-gradient-to-r from-transparent via-border to-transparent"
											></div>
											<p class="text-[10px] font-bold tracking-[0.2em] text-text-subtle uppercase">
												{m.waiting_for_uploads()}
											</p>
											<p class="text-[11px] font-medium text-text-subtle/60">
												{m.documents_will_appear()}
											</p>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</section>
				</div>

				<!-- Sidebar Column -->
				<aside class="space-y-6">
					<!-- Client Profile -->
					<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
						<div class="mb-5 flex items-center justify-between">
							<h3 class="flex items-center gap-2 text-lg font-bold text-text">
								<User class="h-5 w-5 text-text-subtle" />
								{m.client_profile()}
							</h3>
						</div>

						<div class="space-y-6">
							<div
								class="flex flex-col items-center rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100/50 p-6 text-center dark:from-zinc-900 dark:to-zinc-800/50"
							>
								<div
									class="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-3xl font-bold text-brand shadow-xl ring-4 ring-brand/5 dark:bg-zinc-800"
								>
									{contract.client.firstName[0]}{contract.client.lastName[0]}
								</div>
								<h4 class="mt-4 text-lg font-bold text-text">
									{contract.client.firstName}
									{contract.client.lastName}
								</h4>
								<p class="text-xs font-bold tracking-widest text-text-subtle uppercase">
									{m.file_number()}: {contract.client.fileNumber}
								</p>

								<a
									href="/clients/{contract.client.id}"
									class="mt-6 inline-flex h-9 items-center justify-center rounded-xl bg-surface px-4 text-xs font-bold text-text shadow-sm ring-1 ring-border transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
								>
									{m.view_full_profile()}
								</a>
							</div>

							<div class="space-y-3 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
								<div class="flex justify-between text-sm">
									<span class="text-text-muted">{m.bsn()}</span>
									<span class="font-mono font-bold text-text">{contract.client.bsn ?? '—'}</span>
								</div>
							</div>
						</div>
					</section>

					<!-- Sender Profile -->
					<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
						<h3 class="mb-4 flex items-center gap-2 text-base font-bold text-text">
							<Building2 class="h-4 w-4 text-text-subtle" />
							{m.sender_information()}
						</h3>

						<div class="space-y-6">
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 font-bold text-brand"
								>
									<Building2 class="h-5 w-5" />
								</div>
								<div>
									<div class="font-bold text-text">{contract.sender.name}</div>
									<div class="text-xs font-medium text-text-muted capitalize">
										{contract.sender.type.replace(/_/g, ' ')}
									</div>
								</div>
							</div>

							<div class="space-y-4 border-t border-border/50 pt-4">
								<div class="flex items-start gap-3 text-sm">
									<MapPin class="mt-0.5 h-4 w-4 shrink-0 text-text-subtle" />
									<div class="font-medium text-text">
										<p>
											{formatOptional(contract.sender.street)}
											{formatOptional(contract.sender.houseNumber) === '—'
												? ''
												: ` ${formatOptional(contract.sender.houseNumber)}`}{contract.sender
												.houseNumberAddition || ''}
										</p>
										<p class="text-text-muted">
											{formatOptional(contract.sender.postalCode)}
											{formatOptional(contract.sender.city)}
										</p>
										<p class="text-xs text-text-subtle">{formatOptional(contract.sender.land)}</p>
									</div>
								</div>

								<div class="space-y-2 border-t border-border/50 pt-3">
									{#if contract.sender.phoneNumber}
										<a
											href="tel:{contract.sender.phoneNumber}"
											class="flex items-center gap-3 text-sm text-text-muted transition-colors hover:text-brand"
										>
											<Phone class="h-4 w-4 text-text-subtle" />
											{contract.sender.phoneNumber}
										</a>
									{/if}
									{#if contract.sender.emailAddress}
										<a
											href="mailto:{contract.sender.emailAddress}"
											class="flex items-center gap-3 text-sm text-text-muted transition-colors hover:text-brand"
										>
											<Mail class="h-4 w-4 text-text-subtle" />
											{contract.sender.emailAddress}
										</a>
									{/if}
								</div>

								<div class="grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
									<div>
										<p class="text-[10px] font-bold tracking-wider text-text-subtle uppercase">
											KVK
										</p>
										<p class="mt-0.5 text-xs font-semibold text-text">
											{contract.sender.kvkNumber || '—'}
										</p>
									</div>
									<div>
										<p class="text-[10px] font-bold tracking-wider text-text-subtle uppercase">
											BTW
										</p>
										<p class="mt-0.5 text-xs font-semibold text-text">
											{contract.sender.btwNumber || '—'}
										</p>
									</div>
								</div>

								{#if contract.sender.clientNumber}
									<div class="border-t border-border/50 pt-4">
										<p class="text-[10px] font-bold tracking-wider text-text-subtle uppercase">
											{m.sender_client_number()}
										</p>
										<p class="mt-0.5 text-xs font-semibold text-text">
											{contract.sender.clientNumber}
										</p>
									</div>
								{/if}
							</div>
						</div>
					</section>
				</aside>
			</div>
		{:else}
			<div
				class="rounded-3xl border border-border bg-surface p-12 text-center text-sm text-text-muted shadow-sm"
			>
				<Info class="mx-auto h-8 w-8 text-text-subtle opacity-50" />
				<p class="mt-4">{m.contract_not_available()}</p>
				<Button variant="ghost" class="mt-6 ring-1 ring-border" onclick={() => invalidateAll()}
					>{m.retry()}</Button
				>
			</div>
		{/if}
	{/await}
</div>
