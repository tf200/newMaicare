<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { updateInvoicePayment } from '$lib/api/invoices';
	import { InvoicePaymentSchema, type InvoicePaymentSchemaInput } from '$lib/schemas/finance';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';

	type EditablePayment = {
		id: string;
		amount: number;
		date: string;
		method: string;
		status: string;
		reference: string;
		notes?: string | null;
	};

	let {
		open = $bindable(false),
		invoiceId,
		payment,
		currency = 'EUR',
		onUpdated
	}: {
		open: boolean;
		invoiceId: string;
		payment: EditablePayment;
		currency?: string;
		onUpdated?: () => Promise<void> | void;
	} = $props();

	let errorMessage = $state('');
	const formId = 'edit-invoice-payment-form';

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				amount: 0,
				payment_date: '',
				payment_method: 'bank_transfer',
				status: 'pending'
			} as unknown as InvoicePaymentSchemaInput,
			valibotClient(InvoicePaymentSchema)
		),
		{
			validators: valibotClient(InvoicePaymentSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid && payment) {
					try {
						await updateInvoicePayment(invoiceId, payment.id, {
							amount: toAmountNumber(form.data.amount),
							payment_date: form.data.payment_date,
							payment_method: normalizeMethod(form.data.payment_method),
							payment_status: normalizeStatus(form.data.status),
							payment_reference: trimToUndefined(form.data.reference) ?? null,
							notes: trimToUndefined(form.data.notes) ?? null
						});

						await onUpdated?.();
						open = false;
					} catch (error) {
						errorMessage = error instanceof Error ? error.message : 'Failed to update payment.';
					}
				}
			}
		}
	);

	const validMethods = ['bank_transfer', 'credit_card', 'check', 'cash', 'other'] as const;
	type KnownInvoicePaymentMethod = (typeof validMethods)[number];
	const isInvoicePaymentMethod = (value: string): value is KnownInvoicePaymentMethod =>
		validMethods.some((method) => method === value);

	const normalizeMethod = (value: string | null | undefined): KnownInvoicePaymentMethod => {
		const normalized = value?.toLowerCase().trim();
		if (!normalized) return 'other';
		if (isInvoicePaymentMethod(normalized)) return normalized;
		return 'other';
	};

	const validStatuses = ['completed', 'pending', 'failed', 'reversed', 'refunded'] as const;
	type KnownInvoicePaymentStatus = (typeof validStatuses)[number];
	const isInvoicePaymentStatus = (value: string): value is KnownInvoicePaymentStatus =>
		validStatuses.some((status) => status === value);

	const normalizeStatus = (value: string | null | undefined): KnownInvoicePaymentStatus => {
		const normalized = value?.toLowerCase().trim();
		if (!normalized) return 'pending';
		if (isInvoicePaymentStatus(normalized)) return normalized;
		return 'pending';
	};

	const toAmountNumber = (value: string | number): number => {
		if (typeof value === 'number') return value;
		const normalized = value.replace(',', '.').trim();
		const parsed = Number(normalized);
		return Number.isFinite(parsed) ? parsed : 0;
	};

	$effect(() => {
		if (open && payment) {
			const initialData: InvoicePaymentSchemaInput = {
				amount: Number(payment.amount.toFixed(2)),
				payment_date: payment.date || new Date().toISOString(),
				payment_method: normalizeMethod(payment.method),
				status: normalizeStatus(payment.status),
				reference: payment.reference === '—' ? '' : payment.reference,
				notes: payment.notes ?? ''
			};
			reset({ data: initialData });
			errorMessage = '';
		}
	});

	const paymentMethodOptions = [
		{ label: 'Bank transfer', value: 'bank_transfer' },
		{ label: 'Credit card', value: 'credit_card' },
		{ label: 'Check', value: 'check' },
		{ label: 'Cash', value: 'cash' },
		{ label: 'Other', value: 'other' }
	];

	const paymentStatusOptions = [
		{ label: 'Completed', value: 'completed' },
		{ label: 'Pending', value: 'pending' },
		{ label: 'Failed', value: 'failed' },
		{ label: 'Reversed', value: 'reversed' },
		{ label: 'Refunded', value: 'refunded' }
	];

	const formatCurrency = (value: number, currencyCode: string) => {
		return new Intl.NumberFormat('nl-NL', {
			style: 'currency',
			currency: currencyCode
		}).format(value);
	};
</script>

<Sheet
	bind:open
	title="Edit payment"
	description="Update payment details and sync invoice balances and statuses."
	size="lg"
>
	<form id={formId} use:enhance class="space-y-5">
		<div class="bg-surface-subtle/30 rounded-2xl border border-border/70 p-4">
			<p class="text-xs font-semibold tracking-wide text-text-subtle uppercase">Current payment</p>
			<p class="mt-1 text-2xl font-bold tracking-tight text-text">
				{formatCurrency(payment.amount, currency)}
			</p>
			<p class="mt-1 text-xs text-text-muted">
				Recorded on {new Date(payment.date).toLocaleString()}.
			</p>
		</div>

		<Input
			label="Amount"
			bind:value={$form.amount}
			error={formatFormError($errors.amount)}
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
				options={paymentStatusOptions}
				bind:value={$form.status}
				error={formatFormError($errors.status)}
			/>
		</div>

		<Input
			label="Reference"
			bind:value={$form.reference}
			error={formatFormError($errors.reference)}
		/>

		<Textarea
			label="Notes"
			bind:value={$form.notes}
			error={formatFormError($errors.notes)}
			rows={4}
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
			<p class="text-xs text-text-muted">Update the payment details and save changes.</p>
			<div class="flex items-center gap-2">
				<Button variant="ghost" onclick={() => (open = false)} disabled={$delayed}>Cancel</Button>
				<Button variant="primary" form={formId} type="submit" isLoading={$delayed}
					>Update payment</Button
				>
			</div>
		</div>
	{/snippet}
</Sheet>
