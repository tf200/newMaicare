<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { updateContractStatus } from '$lib/api/contracts';
	import type { ContractStatus } from '$lib/types/api';
	import { m } from '$lib/paraglide/messages';

	let {
		open = $bindable(false),
		contractId = null,
		currentStatus,
		onUpdated
	} = $props<{
		open?: boolean;
		contractId?: string | null;
		currentStatus: ContractStatus;
		onUpdated?: () => void;
	}>();

	const statusOptions: Array<{ value: ContractStatus; label: string }> = [
		{ value: 'approved', label: m.approved() },
		{ value: 'draft', label: m.draft() },
		{ value: 'terminated', label: m.terminated() },
		{ value: 'stopped', label: m.stopped() },
		{ value: 'expired', label: m.expired() }
	];

	let selectedStatus = $state<ContractStatus>('draft');
	let isLoading = $state(false);
	let errorMessage = $state('');

	$effect(() => {
		if (!open) return;
		selectedStatus = currentStatus;
		errorMessage = '';
	});

	const handleCancel = () => {
		errorMessage = '';
		open = false;
	};

	const handleSubmit = async () => {
		if (!contractId || isLoading) return;
		errorMessage = '';
		isLoading = true;
		try {
			await updateContractStatus(contractId, { status: selectedStatus });
			open = false;
			onUpdated?.();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : m.failed_update_contract_status();
		} finally {
			isLoading = false;
		}
	};
</script>

<Modal
	bind:open
	title={m.update_contract_status()}
	description={m.update_contract_status_description()}
>
	<div class="space-y-5">
		<Select label={m.status()} bind:value={selectedStatus} options={statusOptions} />

		{#if errorMessage}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{errorMessage}
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={isLoading}>{m.cancel()}</Button>
			<Button
				onclick={handleSubmit}
				{isLoading}
				disabled={!contractId || selectedStatus === currentStatus}
			>
				{isLoading ? m.updating_status() : m.update_status()}
			</Button>
		</div>
	{/snippet}
</Modal>
