<script lang="ts">
	import {
		FileText,
		Plus,
		Calendar,
		CreditCard,
		Tag,
		ScrollText,
		AlertCircle,
		CheckCircle2,
		Clock,
		XCircle
	} from 'lucide-svelte';
	import { fade, slide } from 'svelte/transition';
	import type { PageData } from './$types';
	import type { ContractsLoadResult } from './+page';
	import type { ClientContract, ContractStatus } from '$lib/types/contracts';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';

	let { data } = $props<{ data: PageData & { contractsData: Promise<ContractsLoadResult> } }>();

	let isAddModalOpen = $state(false);
	let localContracts = $state<ClientContract[]>([]);
	let initialized = $state(false);

	// Sync local state with loaded data once
	$effect(() => {
		data.contractsData.then((res: ContractsLoadResult) => {
			if (!initialized && res.contracts) {
				localContracts = res.contracts;
				initialized = true;
			}
		});
	});

	const statusConfig: Record<ContractStatus, { label: string; className: string; icon: any }> = {
		approved: {
			label: 'Approved',
			className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
			icon: CheckCircle2
		},
		submitted: {
			label: 'Submitted',
			className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
			icon: Clock
		},
		draft: {
			label: 'Draft',
			className: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
			icon: FileText
		},
		rejected: {
			label: 'Rejected',
			className: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
			icon: XCircle
		},
		expired: {
			label: 'Expired',
			className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
			icon: AlertCircle
		}
	};

	// Form state for new contract
	let newContract = $state({
		status: 'draft' as ContractStatus,
		financing_act: 'WMO' as any,
		financing_option: 'ZIN' as any,
		care_type: 'accommodation' as any,
		start_date: new Date().toISOString().split('T')[0],
		end_date: '',
		summary: '',
		notes: ''
	});

	function handleAddContract() {
		const contract: ClientContract = {
			id: Math.random().toString(36).substr(2, 9),
			status: newContract.status,
			start_date: newContract.start_date,
			end_date: newContract.end_date || null,
			financing_act: newContract.financing_act,
			financing_option: newContract.financing_option,
			care_type: newContract.care_type,
			summary: newContract.summary,
			notes: newContract.notes
		};

		localContracts = [contract, ...localContracts];
		isAddModalOpen = false;

		// Reset form
		newContract = {
			status: 'draft',
			financing_act: 'WMO',
			financing_option: 'ZIN',
			care_type: 'accommodation',
			start_date: new Date().toISOString().split('T')[0],
			end_date: '',
			summary: '',
			notes: ''
		};
	}
</script>

<svelte:head>
	<title>Contracts | MaiCare</title>
</svelte:head>

<section class="space-y-6 pb-12">
	<!-- Header -->
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-linear-to-br from-indigo-100/70 to-violet-100/20 blur-2xl"
		></div>
		<div class="relative flex flex-wrap items-center justify-between gap-6">
			<div class="space-y-2">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<ScrollText class="h-5 w-5" />
					</span>
					<span>Client Administration</span>
				</div>
				<h1 class="text-3xl font-bold tracking-tighter text-text">Contracts</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">
					Overview of all active and historical contracts for this client.
				</p>
			</div>

			<Button onclick={() => (isAddModalOpen = true)} class="gap-2">
				<Plus class="mr-2 h-5 w-5" />
				Add Contract
			</Button>
		</div>
	</header>

	{#await data.contractsData}
		<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
			{#each Array(3) as _}
				<div class="h-64 animate-pulse rounded-3xl border border-border bg-surface/50"></div>
			{/each}
		</div>
	{:then res}
		{#if res.loadError}
			<InlineErrorBanner message={res.loadError} />
		{:else if localContracts.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-surface/50 py-24 text-center"
				in:fade
			>
				<div
					class="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-bg text-text-subtle"
				>
					<ScrollText class="h-10 w-10" />
				</div>
				<h3 class="text-xl font-bold text-text">No contracts found</h3>
				<p class="mt-2 max-w-sm text-sm text-text-muted">
					This client doesn't have any contracts registered yet. Click the button above to add the
					first one.
				</p>
			</div>
		{:else}
			<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
				{#each localContracts as contract (contract.id)}
					{@const status = statusConfig[contract.status]}
					<div
						class="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/5"
						in:slide={{ duration: 300 }}
					>
						<!-- Status Badge -->
						<div class="mb-6 flex items-center justify-between">
							<span
								class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold {status.className}"
							>
								<status.icon class="h-3.5 w-3.5" />
								{status.label}
							</span>

							<div
								class="flex items-center gap-2 text-[10px] font-bold tracking-wider text-text-subtle uppercase"
							>
								ID: {contract.id}
							</div>
						</div>

						<!-- Main Info -->
						<div class="space-y-4">
							<div class="space-y-1">
								<h3 class="flex items-center gap-2 text-lg font-bold text-text">
									{contract.financing_act} / {contract.financing_option}
								</h3>
								<p class="text-sm font-medium text-text-muted capitalize italic">
									{contract.care_type} Care
								</p>
							</div>

							{#if contract.summary}
								<p class="line-clamp-2 text-sm text-text-subtle">
									{contract.summary}
								</p>
							{/if}

							<!-- Metadata Grid -->
							<div class="grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
								<div class="space-y-1">
									<div
										class="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-text-subtle uppercase"
									>
										<Calendar class="h-3 w-3" />
										Start Date
									</div>
									<div class="text-sm font-bold text-text">
										{contract.start_date}
									</div>
								</div>
								<div class="space-y-1">
									<div
										class="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-text-subtle uppercase"
									>
										<Clock class="h-3 w-3" />
										End Date
									</div>
									<div class="text-sm font-bold text-text">
										{contract.end_date || 'Ongoing'}
									</div>
								</div>
							</div>
						</div>

						{#if contract.notes}
							<div
								class="mt-6 rounded-2xl border border-border/50 bg-bg/50 p-4 text-xs text-text-muted"
							>
								<div
									class="mb-1 flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase"
								>
									<Tag class="h-3 w-3" />
									Internal Notes
								</div>
								{contract.notes}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{/await}
</section>

<!-- Add Contract Modal -->
<Modal
	bind:open={isAddModalOpen}
	title="Add New Contract"
	description="Register a new care contract for this client."
	size="lg"
>
	<div class="space-y-6 py-2">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<Select
				label="Financing Act"
				bind:value={newContract.financing_act}
				options={[
					{ value: 'WMO', label: 'WMO (Wet Maatschappelijke Ondersteuning)' },
					{ value: 'ZVW', label: 'ZVW (Zorgverzekeringswet)' },
					{ value: 'WLZ', label: 'WLZ (Wet Langdurige Zorg)' },
					{ value: 'JW', label: 'JW (Jeugdwet)' },
					{ value: 'WPG', label: 'WPG (Wet Publieke Gezondheid)' }
				]}
			/>
			<Select
				label="Financing Option"
				bind:value={newContract.financing_option}
				options={[
					{ value: 'ZIN', label: 'Zorg in Natura (ZIN)' },
					{ value: 'PGB', label: 'Persoonsgebonden Budget (PGB)' }
				]}
			/>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<Select
				label="Care Type"
				bind:value={newContract.care_type}
				options={[
					{ value: 'accommodation', label: 'Accommodation / Protected Living' },
					{ value: 'ambulante', label: 'Ambulante / Home Support' }
				]}
			/>
			<Select
				label="Initial Status"
				bind:value={newContract.status}
				options={[
					{ value: 'draft', label: 'Draft' },
					{ value: 'submitted', label: 'Submitted' },
					{ value: 'approved', label: 'Approved' }
				]}
			/>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<Input type="date" label="Start Date" bind:value={newContract.start_date} />
			<Input type="date" label="End Date (Optional)" bind:value={newContract.end_date} />
		</div>

		<div class="space-y-4">
			<Input
				label="Summary"
				placeholder="Short description of the contract..."
				bind:value={newContract.summary}
			/>
			<Textarea
				label="Notes"
				placeholder="Internal notes or details..."
				rows={3}
				bind:value={newContract.notes}
			/>
		</div>
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={() => (isAddModalOpen = false)}>Cancel</Button>
			<Button onclick={handleAddContract}>Create Contract</Button>
		</div>
	{/snippet}
</Modal>

<style>
	/* Custom transition for grid items */
	:global(.grid) {
		perspective: 1000px;
	}
</style>
