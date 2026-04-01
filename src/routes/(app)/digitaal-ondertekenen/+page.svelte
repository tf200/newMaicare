<script lang="ts">
	import Toast from '$lib/components/ui/Toast.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import type { DocumentSignature, SignatureStatus } from '$lib/types/api/ondertekenen';
	import OndertekenenStats from './_components/OndertekenenStats.svelte';
	import { listMockDocumentSignatures } from '$lib/api/ondertekenen.mock';
	import { m } from '$lib/paraglide/messages';
	import {
		Search,
		FileSignature,
		Clock,
		CheckCircle2,
		XCircle,
		AlertTriangle,
		Eye,
		PenLine,
		FileText,
		Shield,
		FilePlus,
		FileX,
		File
	} from 'lucide-svelte';

	let documents = $state<DocumentSignature[]>([]);
	let loading = $state(true);
	let dataSequence = 0;

	let searchQuery = $state('');
	let statusFilter = $state('all');

	let signModal = $state<DocumentSignature | null>(null);
	let rejectModal = $state<DocumentSignature | null>(null);
	let viewModal = $state<DocumentSignature | null>(null);
	let agreedToTerms = $state(false);
	let rejectReason = $state('');

	let toast = $state<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	function setToast(message: string, type: 'success' | 'warning' | 'error' = 'success') {
		toast = { message, type };
		if (toastTimeout) clearTimeout(toastTimeout);
		toastTimeout = setTimeout(() => {
			toast = null;
		}, 3500);
	}

	async function loadData() {
		const reqId = ++dataSequence;
		loading = true;
		try {
			const res = await listMockDocumentSignatures();
			if (reqId !== dataSequence) return;
			documents = res.data;
		} catch {
			if (reqId !== dataSequence) return;
			setToast('Kon data niet laden.', 'error');
		} finally {
			if (reqId === dataSequence) loading = false;
		}
	}

	$effect(() => {
		void loadData();
	});

	const statusConfig: Record<SignatureStatus, { label: string; color: string; icon: any }> = {
		pending: {
			label: m.ondertekenen_status_pending(),
			color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
			icon: Clock
		},
		signed: {
			label: m.ondertekenen_status_signed(),
			color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
			icon: CheckCircle2
		},
		rejected: {
			label: m.ondertekenen_status_rejected(),
			color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
			icon: XCircle
		},
		expired: {
			label: m.ondertekenen_status_expired(),
			color: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400',
			icon: AlertTriangle
		}
	};

	const docTypeConfig: Record<string, { label: string; icon: any }> = {
		contract: { label: 'Contract', icon: FileText },
		policy: { label: 'Beleid', icon: Shield },
		agreement: { label: 'Overeenkomst', icon: FileSignature },
		addendum: { label: 'Addendum', icon: FilePlus },
		termination: { label: 'Beëindiging', icon: FileX },
		other: { label: 'Overig', icon: File }
	};

	const filtered = $derived(
		documents.filter((doc) => {
			const matchesSearch =
				doc.document_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				doc.employee_name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
			return matchesSearch && matchesStatus;
		})
	);

	const stats = $derived({
		total: documents.length,
		pending: documents.filter((d) => d.status === 'pending').length,
		signed: documents.filter((d) => d.status === 'signed').length,
		rejected: documents.filter((d) => d.status === 'rejected').length
	});

	function handleSign(doc: DocumentSignature) {
		documents = documents.map((d) =>
			d.id === doc.id
				? { ...d, status: 'signed' as SignatureStatus, signed_at: new Date().toISOString(), signature_hash: 'sha256-' + Math.random().toString(36).slice(2, 14) }
				: d
		);
		signModal = null;
		agreedToTerms = false;
		setToast(m.ondertekenen_sign_btn() + ' — OK', 'success');
	}

	function handleReject() {
		if (!rejectModal || !rejectReason.trim()) return;
		documents = documents.map((d) =>
			d.id === rejectModal!.id
				? { ...d, status: 'rejected' as SignatureStatus, rejection_reason: rejectReason }
				: d
		);
		rejectModal = null;
		rejectReason = '';
		setToast(m.ondertekenen_reject_btn() + ' — OK', 'warning');
	}

	function formatDate(date: string | null): string {
		if (!date) return '—';
		return new Intl.DateTimeFormat('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(date));
	}
</script>

<svelte:head>
	<title>{m.ondertekenen_label()} | MaiCare</title>
</svelte:head>

<section class="space-y-8">
	<!-- Header -->
	<header class="relative overflow-hidden rounded-3xl">
		<div
			class="absolute inset-0 bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 dark:from-sky-900 dark:via-sky-950 dark:to-blue-950"
		></div>
		<div class="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/[0.07] blur-3xl"></div>
		<div class="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-blue-300/10 blur-2xl"></div>
		<div class="relative px-8 py-9">
			<div class="space-y-2">
				<span class="text-[10px] font-bold tracking-[0.25em] text-white/50 uppercase"
					>{m.ondertekenen_hr_docs()}</span
				>
				<h1 class="text-[42px] leading-none font-extrabold tracking-tight text-white">
					{m.ondertekenen_label()}
				</h1>
				<p class="max-w-md text-[13px] font-medium text-white/45">
					{m.ondertekenen_subtitle()}
				</p>
			</div>
		</div>
	</header>

	<OndertekenenStats
		total={stats.total}
		pending={stats.pending}
		signed={stats.signed}
		rejected={stats.rejected}
	/>

	<!-- Filters -->
	<div class="flex flex-col gap-3 sm:flex-row">
		<div class="relative flex-1">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
			<input
				type="text"
				placeholder={m.ondertekenen_search()}
				bind:value={searchQuery}
				class="h-9 w-full rounded-xl border border-border bg-surface px-3 pl-9 text-sm text-text placeholder:text-text-subtle transition-colors focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
			/>
		</div>
		<select
			class="h-9 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-text focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
			value={statusFilter}
			onchange={(e) => (statusFilter = (e.target as HTMLSelectElement).value)}
		>
			<option value="all">{m.ondertekenen_all_statuses()}</option>
			{#each Object.entries(statusConfig) as [key, cfg]}
				<option value={key}>{cfg.label}</option>
			{/each}
		</select>
	</div>

	<!-- Document list -->
	{#if loading}
		<div class="space-y-2 py-4">
			{#each Array(6) as _, i}
				<div
					class="h-[60px] animate-pulse rounded-xl bg-border/20"
					style="animation-delay: {i * 50}ms"
				></div>
			{/each}
		</div>
	{:else if filtered.length === 0}
		<div class="flex flex-col items-center rounded-2xl border border-dashed border-border py-16">
			<div
				class="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/8 dark:bg-sky-500/5"
			>
				<FileSignature class="h-6 w-6 text-sky-400 dark:text-sky-500" />
			</div>
			<p class="mt-4 text-sm font-bold text-text">{m.ondertekenen_no_results()}</p>
			<p class="mt-1 max-w-[280px] text-center text-xs text-text-subtle">
				{m.ondertekenen_no_results_desc()}
			</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each filtered as doc, idx (doc.id)}
				{@const cfg = statusConfig[doc.status]}
				{@const StatusIcon = cfg.icon}
				{@const dtCfg = docTypeConfig[doc.document_type] ?? docTypeConfig.other}
				{@const DtIcon = dtCfg.icon}
				<div
					class="group flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-surface px-4 py-3 transition-all hover:border-border hover:shadow-sm {doc.status === 'rejected'
						? '!border-rose-200/60 dark:!border-rose-800/30'
						: doc.status === 'expired'
							? '!border-zinc-200/60 dark:!border-zinc-700/30'
							: ''}"
					style="animation: fade-in 300ms cubic-bezier(0.22,1,0.36,1) both; animation-delay: {idx * 30}ms"
				>
					<div class="flex items-center gap-3 min-w-0 flex-1">
						<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl {cfg.color}">
							<StatusIcon class="h-4 w-4" />
						</div>
						<div class="min-w-0">
							<div class="flex items-center gap-2">
								<span class="text-[13px] font-bold text-text truncate">{doc.document_title}</span>
								<span
									class="inline-flex items-center rounded-md {cfg.color} px-1.5 py-0.5 text-[9px] font-bold"
									>{cfg.label}</span
								>
							</div>
							<div class="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-subtle">
								<span class="font-semibold">{doc.employee_name}</span>
								<span>&middot;</span>
								<span>{doc.employee_department}</span>
								<span>&middot;</span>
								<span class="flex items-center gap-0.5 capitalize">
									<DtIcon class="h-3 w-3" />
									{dtCfg.label}
								</span>
							</div>
						</div>
					</div>

					<div class="flex items-center gap-4 shrink-0">
						<div class="hidden text-right sm:block">
							<div class="text-[10px] font-bold tracking-[0.1em] text-text-subtle uppercase">
								{m.ondertekenen_requested()}
							</div>
							<div class="text-[12px] tabular-nums text-text-muted">
								{formatDate(doc.requested_at)}
							</div>
						</div>
						{#if doc.signed_at}
							<div class="hidden text-right md:block">
								<div class="text-[10px] font-bold tracking-[0.1em] text-text-subtle uppercase">
									{m.ondertekenen_signed_date()}
								</div>
								<div class="text-[12px] tabular-nums text-emerald-600 dark:text-emerald-400">
									{formatDate(doc.signed_at)}
								</div>
							</div>
						{/if}
						<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							{#if doc.status === 'pending'}
								<button
									onclick={() => {
										signModal = doc;
										agreedToTerms = false;
									}}
									class="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500/8 px-2.5 text-[11px] font-semibold text-emerald-600 transition-all hover:bg-emerald-500/15 dark:text-emerald-400"
									title={m.ondertekenen_sign()}
								>
									<PenLine class="h-3.5 w-3.5" />
									{m.ondertekenen_sign()}
								</button>
								<button
									onclick={() => {
										rejectModal = doc;
										rejectReason = '';
									}}
									class="flex h-8 items-center gap-1.5 rounded-lg bg-rose-500/8 px-2.5 text-[11px] font-semibold text-rose-600 transition-all hover:bg-rose-500/15 dark:text-rose-400"
									title={m.ondertekenen_reject()}
								>
									<XCircle class="h-3.5 w-3.5" />
									{m.ondertekenen_reject()}
								</button>
							{/if}
							<button
								onclick={() => (viewModal = doc)}
								class="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition-all hover:bg-sky-500/8 hover:text-sky-600"
								title={m.ondertekenen_view()}
							>
								<Eye class="h-[15px] w-[15px]" />
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>

<!-- Sign Modal -->
{#if signModal}
	<Modal
		open={true}
		title={m.ondertekenen_sign_title()}
		description={m.ondertekenen_sign_desc()}
		size="md"
	>
		<div class="space-y-5">
			<div class="rounded-xl border border-border bg-border/20 p-4 space-y-2">
				<div class="flex items-center gap-2 text-sm font-bold text-text">
					<FileSignature class="h-4 w-4 text-sky-500" />
					{signModal.document_title}
				</div>
				<div class="flex items-center gap-4 text-xs text-text-muted">
					<span>{m.ondertekenen_employee()}: {signModal.employee_name}</span>
					<span>{m.ondertekenen_type()}: {docTypeConfig[signModal.document_type]?.label ?? signModal.document_type}</span>
				</div>
			</div>

			<label class="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer transition-colors hover:bg-border/10 {agreedToTerms ? 'border-sky-300 bg-sky-50/50 dark:border-sky-700 dark:bg-sky-950/30' : ''}">
				<input
					type="checkbox"
					bind:checked={agreedToTerms}
					class="mt-0.5 h-4 w-4 rounded border-border text-sky-600 focus:ring-sky-500/20"
				/>
				<span class="text-xs leading-relaxed text-text-muted">{m.ondertekenen_agreement()}</span>
			</label>

			<div class="flex justify-end gap-2">
				<button
					onclick={() => { signModal = null; agreedToTerms = false; }}
					class="h-9 rounded-xl border border-border px-4 text-sm font-semibold text-text-muted transition-colors hover:bg-border/50"
				>
					{m.ondertekenen_cancel()}
				</button>
				<button
					disabled={!agreedToTerms}
					onclick={() => signModal && handleSign(signModal)}
					class="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
				>
					<PenLine class="h-3.5 w-3.5" />
					{m.ondertekenen_sign_btn()}
				</button>
			</div>
		</div>
	</Modal>
{/if}

<!-- Reject Modal -->
{#if rejectModal}
	<Modal
		open={true}
		title={m.ondertekenen_reject_title()}
		description={m.ondertekenen_reject_desc()}
		size="md"
	>
		<div class="space-y-5">
			<div class="rounded-xl border border-border bg-border/20 p-3 text-sm font-bold text-text">
				{rejectModal.document_title}
			</div>

			<div class="space-y-1.5">
				<label class="text-xs font-semibold text-text-muted">{m.ondertekenen_reject_reason()}</label>
				<textarea
					bind:value={rejectReason}
					rows="3"
					placeholder={m.ondertekenen_reject_reason_placeholder()}
					class="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-subtle transition-colors focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500/20 resize-none"
				></textarea>
			</div>

			<div class="flex justify-end gap-2">
				<button
					onclick={() => { rejectModal = null; rejectReason = ''; }}
					class="h-9 rounded-xl border border-border px-4 text-sm font-semibold text-text-muted transition-colors hover:bg-border/50"
				>
					{m.ondertekenen_cancel()}
				</button>
				<button
					disabled={!rejectReason.trim()}
					onclick={handleReject}
					class="flex h-9 items-center gap-1.5 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition-all hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
				>
					<XCircle class="h-3.5 w-3.5" />
					{m.ondertekenen_reject_btn()}
				</button>
			</div>
		</div>
	</Modal>
{/if}

<!-- View Modal -->
{#if viewModal}
	<Modal
		open={true}
		title={m.ondertekenen_document()}
		size="md"
	>
		{@const cfg = statusConfig[viewModal.status]}
		<div class="space-y-4">
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-xs font-bold text-text-subtle uppercase tracking-wider">{m.ondertekenen_document()}</span>
					<span class="inline-flex items-center gap-1 rounded-lg {cfg.color} px-2 py-0.5 text-[11px] font-bold">
						<cfg.icon class="h-3 w-3" />
						{cfg.label}
					</span>
				</div>
				<h3 class="text-lg font-bold text-text">{viewModal.document_title}</h3>
			</div>

			<div class="grid grid-cols-2 gap-3 rounded-xl border border-border bg-border/10 p-4">
				<div>
					<div class="text-[10px] font-bold text-text-subtle uppercase">{m.ondertekenen_employee()}</div>
					<div class="text-sm font-semibold text-text">{viewModal.employee_name}</div>
				</div>
				<div>
					<div class="text-[10px] font-bold text-text-subtle uppercase">{m.department()}</div>
					<div class="text-sm font-semibold text-text">{viewModal.employee_department}</div>
				</div>
				<div>
					<div class="text-[10px] font-bold text-text-subtle uppercase">{m.ondertekenen_type()}</div>
					<div class="text-sm font-semibold text-text capitalize">{viewModal.document_type}</div>
				</div>
				<div>
					<div class="text-[10px] font-bold text-text-subtle uppercase">{m.ondertekenen_requested()}</div>
					<div class="text-sm font-semibold text-text">{formatDate(viewModal.requested_at)}</div>
				</div>
				{#if viewModal.signed_at}
					<div>
						<div class="text-[10px] font-bold text-text-subtle uppercase">{m.ondertekenen_signed_date()}</div>
						<div class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatDate(viewModal.signed_at)}</div>
					</div>
				{/if}
				{#if viewModal.expires_at}
					<div>
						<div class="text-[10px] font-bold text-text-subtle uppercase">{m.expired()}</div>
						<div class="text-sm font-semibold text-text">{formatDate(viewModal.expires_at)}</div>
					</div>
				{/if}
			</div>

			{#if viewModal.rejection_reason}
				<div class="rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-800/30 dark:bg-rose-950/20">
					<div class="text-[10px] font-bold text-rose-500 uppercase mb-1">{m.ondertekenen_reject_reason()}</div>
					<div class="text-sm text-rose-700 dark:text-rose-300">{viewModal.rejection_reason}</div>
				</div>
			{/if}

			{#if viewModal.signature_hash}
				<div class="rounded-xl border border-border bg-border/10 p-3">
					<div class="text-[10px] font-bold text-text-subtle uppercase mb-1">Hash</div>
					<div class="font-mono text-xs text-text-muted">{viewModal.signature_hash}</div>
				</div>
			{/if}
		</div>
	</Modal>
{/if}

<Toast message={toast?.message ?? null} type={toast?.type ?? 'success'} onClose={() => (toast = null)} />

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
