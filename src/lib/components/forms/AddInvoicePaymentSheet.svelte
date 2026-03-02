<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { formatFormError } from '$lib/utils/form-errors';
	import { createInvoicePayment } from '$lib/api/invoices';
	import { InvoicePaymentSchema, type InvoicePaymentInput } from '$lib/schemas/finance';

	let {
		open = $bindable(false),
		invoiceId,
		currency = 'EUR',
		defaultAmount = 0,
		onCreated
	}: {
		open: boolean;
		invoiceId: string;
		currency?: string;
		defaultAmount?: number;
		onCreated?: () => Promise<void> | void;
	} = $props();

	let errorMessage = $state('');
	const formId = 'add-invoice-payment-form';

	const buildInitialData = (): InvoicePaymentInput => ({
		amount: defaultAmount > 0 ? Number(defaultAmount.toFixed(2)) : 0,
		payment_date: new Date().toISOString(),
		payment_method: 'bank_transfer',
		status: 'completed',
		reference: '',
		notes: ''
	});

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(buildInitialData(), valibotClient(InvoicePaymentSchema)),
		{
			validators: valibotClient(InvoicePaymentSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid) {
					try {
						await createInvoicePayment({
							invoice_id: invoiceId,
							amount: form.data.amount,
							payment_date: form.data.payment_date,
							payment_method: form.data.payment_method,
							status: form.data.status,
							reference: form.data.reference?.trim() || null,
							notes: form.data.notes?.trim() || null
						});

						await onCreated?.();
						reset();
						open = false;
					} catch (error) {
						errorMessage = error instanceof Error ? error.message : 'Failed to create payment.';
					}
				}
			}
		}
	);

	const paymentMethodOptions = [
		{ label: 'Bank transfer', value: 'bank_transfer' },
		{ label: 'SEPA direct debit', value: 'sepa_direct_debit' },
		{ label: 'iDEAL', value: 'ideal' },
		{ label: 'Cash', value: 'cash' },
		{ label: 'Card', value: 'card' },
		{ label: 'Other', value: 'other' }
	];

	const statusOptions = [
		{ label: 'Completed', value: 'completed' },
		{ label: 'Pending', value: 'pending' },
		{ label: 'Failed', value: 'failed' }
	];

	const formatCurrency = (value: number, currencyCode: string) => {
		return new Intl.NumberFormat('nl-NL', {
			style: 'currency',
			currency: currencyCode
		}).format(value);
	};

	$effect(() => {
		if (open) {
			reset({ data: buildInitialData() });
			errorMessage = '';
		}
	});
</script>

<Sheet
	bind:open
	title="Record payment"
	description="Add a transaction for this invoice and keep payment tracking up to date."
	size="lg"
>
	<form id={formId} use:enhance class="space-y-5">
		<div class="bg-surface-subtle/30 rounded-2xl border border-border/70 p-4">
			<p class="text-xs font-semibold tracking-wide text-text-subtle uppercase">Invoice balance</p>
			<p class="mt-1 text-2xl font-bold tracking-tight text-text">
				{formatCurrency(defaultAmount, currency)}
			</p>
			<p class="mt-1 text-xs text-text-muted">
				Use this as a guide when recording a partial or full payment.
			</p>
		</div>

		<Input
			label="Amount"
			bind:value={$form.amount}
			error={formatFormError($errors.amount)}
			placeholder="0.00"
			inputmode="decimal"
		/>

		<DateTimePicker
			label="Payment date"
			bind:value={$form.payment_date}
			error={formatFormError($errors.payment_date)}
		/>

		<div class="grid gap-4 sm:grid-cols-2">
			<Select
				label="Payment method"
				options={paymentMethodOptions}
				bind:value={$form.payment_method}
				error={formatFormError($errors.payment_method)}
			/>
			<Select
				label="Status"
				options={statusOptions}
				bind:value={$form.status}
				error={formatFormError($errors.status)}
			/>
		</div>

		<Input
			label="Reference"
			bind:value={$form.reference}
			placeholder="Transaction reference"
			error={formatFormError($errors.reference)}
		/>

		<Textarea
			label="Notes"
			bind:value={$form.notes}
			placeholder="Optional details for accounting or reconciliation"
			rows={4}
			error={formatFormError($errors.notes)}
		/>

		{#if errorMessage}
			<p
				class="rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm font-medium text-error"
			>
				{errorMessage}
			</p>
		{/if}
		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex items-center justify-between gap-3">
			<p class="text-xs text-text-muted">Required fields: amount, date, method</p>
			<div class="flex items-center gap-2">
				<Button
					variant="ghost"
					onclick={() => {
						open = false;
					}}
					disabled={$delayed}
				>
					Cancel
				</Button>
				<Button variant="primary" form={formId} type="submit" isLoading={$delayed}
					>Save payment</Button
				>
			</div>
		</div>
	{/snippet}
</Sheet>
