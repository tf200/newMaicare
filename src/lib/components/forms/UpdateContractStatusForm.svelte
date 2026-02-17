<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { updateContractStatus } from '$lib/api/contracts';
	import type { ContractStatus } from '$lib/types/api';

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
		{ value: 'approved', label: 'Approved' },
		{ value: 'draft', label: 'Draft' },
		{ value: 'terminated', label: 'Terminated' },
		{ value: 'stopped', label: 'Stopped' },
		{ value: 'expired', label: 'Expired' }
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
			errorMessage = error instanceof Error ? error.message : 'Failed to update contract status';
		} finally {
			isLoading = false;
		}
	};
</script>

<Modal
	bind:open
	title="Update Contract Status"
	description="Change the contract lifecycle status using the dedicated status endpoint."
>
	<div class="space-y-5">
		<Select label="Status" bind:value={selectedStatus} options={statusOptions} />

		{#if errorMessage}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{errorMessage}
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={isLoading}>Cancel</Button>
			<Button
				onclick={handleSubmit}
				{isLoading}
				disabled={!contractId || selectedStatus === currentStatus}
			>
				{isLoading ? 'Updating Status...' : 'Update Status'}
			</Button>
		</div>
	{/snippet}
</Modal>
