<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { getClientDiagnosis, updateClientDiagnosis } from '$lib/api/clients';
	import { Stethoscope } from 'lucide-svelte';
	import type {
		DiagnosisSeverity,
		DiagnosisStatus,
		UpdateClientDiagnosisRequest
	} from '$lib/types/api';
	import { DiagnosisSchema, type DiagnosisSchemaInput } from '$lib/schemas/diagnosis';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';

	interface Props {
		clientId: string;
		diagnosisId: string | null;
		open?: boolean;
		onUpdated?: () => void;
	}

	let { clientId, diagnosisId, open = $bindable(false), onUpdated }: Props = $props();

	let isFetching = $state(false);
	let errorMessage = $state('');
	const formId = 'edit-diagnosis-form';

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				code_system: 'ICD-10',
				status: 'confirmed',
				severity: 'unknown',
				code: '',
				title: '',
				description: '',
				diagnosed_on: '',
				resolved_on: '',
				diagnosing_clinician: '',
				notes: ''
			} as unknown as DiagnosisSchemaInput,
			valibotClient(DiagnosisSchema)
		),
		{
			validators: valibotClient(DiagnosisSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid && diagnosisId) {
					try {
						const payload: UpdateClientDiagnosisRequest = {
							code_system: form.data.code_system,
							code: form.data.code.trim(),
							title: trimToUndefined(form.data.title) ?? null,
							description: trimToUndefined(form.data.description) ?? null,
							status: form.data.status,
							severity: form.data.severity,
							diagnosed_on: toRfc3339Date(form.data.diagnosed_on),
							resolved_on: toRfc3339Date(form.data.resolved_on),
							diagnosing_clinician: trimToUndefined(form.data.diagnosing_clinician) ?? null,
							notes: trimToUndefined(form.data.notes) ?? null
						};

						await updateClientDiagnosis(clientId, diagnosisId, payload);
						open = false;
						onUpdated?.();
					} catch (error) {
						errorMessage = error instanceof Error ? error.message : 'Failed to update diagnosis.';
					}
				}
			}
		}
	);

	const toRfc3339Date = (value: string | null | undefined) => {
		if (!value) return null;
		return `${value}T00:00:00Z`;
	};

	const toInputDate = (value: string | null) => {
		if (!value) return '';
		return value.slice(0, 10);
	};

	$effect(() => {
		if (open && diagnosisId) {
			isFetching = true;
			getClientDiagnosis(clientId, diagnosisId)
				.then((response) => {
					const diagnosis = response.data;
					const initialData: DiagnosisSchemaInput = {
						code_system: diagnosis.code_system,
						code: diagnosis.code,
						title: diagnosis.title ?? '',
						description: diagnosis.description ?? '',
						status: diagnosis.status,
						severity: diagnosis.severity,
						diagnosed_on: toInputDate(diagnosis.diagnosed_on),
						resolved_on: toInputDate(diagnosis.resolved_on),
						diagnosing_clinician: diagnosis.diagnosing_clinician ?? '',
						notes: diagnosis.notes ?? ''
					};
					reset({ data: initialData });
				})
				.catch((error) => {
					errorMessage = error instanceof Error ? error.message : 'Failed to load diagnosis.';
				})
				.finally(() => {
					isFetching = false;
				});
		}
	});

	const codeSystemOptions = [
		{ label: 'ICD-10', value: 'ICD-10' },
		{ label: 'DSM-5', value: 'DSM-5' },
		{ label: 'SNOMED', value: 'SNOMED' }
	];

	const statusOptions: Array<{ value: DiagnosisStatus; label: string; activeClass: string }> = [
		{
			value: 'confirmed',
			label: 'Confirmed',
			activeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
		},
		{
			value: 'suspected',
			label: 'Suspected',
			activeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-700'
		},
		{
			value: 'resolved',
			label: 'Resolved',
			activeClass: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-700'
		},
		{
			value: 'ruled_out',
			label: 'Ruled out',
			activeClass: 'border-rose-500/20 bg-rose-500/10 text-rose-700'
		}
	];

	const severityOptions: Array<{ value: DiagnosisSeverity; label: string; activeClass: string }> = [
		{
			value: 'unknown',
			label: 'Unknown',
			activeClass: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-700'
		},
		{
			value: 'mild',
			label: 'Mild',
			activeClass: 'border-sky-500/20 bg-sky-500/10 text-sky-700'
		},
		{
			value: 'moderate',
			label: 'Moderate',
			activeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-700'
		},
		{
			value: 'severe',
			label: 'Severe',
			activeClass: 'border-rose-500/20 bg-rose-500/10 text-rose-700'
		}
	];

	const showResolvedDate = $derived($form.status === 'resolved' || $form.status === 'ruled_out');

	$effect(() => {
		if (!showResolvedDate) {
			$form.resolved_on = '';
		}
	});

	const badgeBase =
		'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold tracking-wide uppercase transition-colors';
</script>

<Modal
	bind:open
	title="Edit Diagnosis"
	description="Update clinical classification, status, and timeline for this diagnosis."
	size="xl"
>
	{#if isFetching}
		<div class="rounded-xl border border-border/60 bg-surface/80 px-4 py-10 text-center">
			<p class="text-sm font-medium text-text-muted">Loading diagnosis...</p>
		</div>
	{:else}
		<form id={formId} use:enhance class="space-y-6">
			<section class="space-y-4">
				<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
					Classification
				</h3>
				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<Select
						label="Code system"
						options={codeSystemOptions}
						bind:value={$form.code_system}
						error={formatFormError($errors.code_system)}
					/>
					<Input
						label="Code"
						placeholder="F32.1"
						bind:value={$form.code}
						error={formatFormError($errors.code)}
					/>
				</div>
				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<Input
						label="Title"
						placeholder="Depressive episode, moderate"
						bind:value={$form.title}
						error={formatFormError($errors.title)}
					/>
					<Input
						label="Diagnosing clinician"
						placeholder="Dr. A. Example"
						bind:value={$form.diagnosing_clinician}
						error={formatFormError($errors.diagnosing_clinician)}
					/>
				</div>
				<Textarea
					label="Description"
					placeholder="Client reports low mood and loss of interest."
					rows={3}
					bind:value={$form.description}
					error={formatFormError($errors.description)}
				/>
			</section>

			<section class="space-y-4">
				<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
					Clinical status
				</h3>
				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<div class="space-y-2">
						<p class="ml-1 text-sm font-semibold text-text-muted">Status</p>
						<div class="flex flex-wrap gap-2">
							{#each statusOptions as option (option.value)}
								<button
									type="button"
									onclick={() => ($form.status = option.value)}
									class="{badgeBase} {$form.status === option.value
										? option.activeClass
										: 'border-border bg-surface text-text-muted hover:bg-border/30'}"
								>
									{option.label}
								</button>
							{/each}
						</div>
						{#if $errors.status}
							<p class="ml-1 text-xs font-medium text-error">{formatFormError($errors.status)}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<p class="ml-1 text-sm font-semibold text-text-muted">Severity</p>
						<div class="flex flex-wrap gap-2">
							{#each severityOptions as option (option.value)}
								<button
									type="button"
									onclick={() => ($form.severity = option.value)}
									class="{badgeBase} {$form.severity === option.value
										? option.activeClass
										: 'border-border bg-surface text-text-muted hover:bg-border/30'}"
								>
									{option.label}
								</button>
							{/each}
						</div>
						{#if $errors.severity}
							<p class="ml-1 text-xs font-medium text-error">{formatFormError($errors.severity)}</p>
						{/if}
					</div>
				</div>
			</section>

			<section class="space-y-4">
				<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
					Timeline
				</h3>
				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<div class="space-y-1.5">
						<DatePicker
							label="Diagnosed on"
							bind:value={$form.diagnosed_on}
							error={formatFormError($errors.diagnosed_on)}
						/>
						<p class="ml-1 text-xs text-text-subtle">Stored as date and serialized as RFC3339.</p>
					</div>

					{#if showResolvedDate}
						<div class="space-y-1.5">
							<DatePicker
								label="Resolved on"
								bind:value={$form.resolved_on}
								error={formatFormError($errors.resolved_on)}
							/>
							<p class="ml-1 text-xs text-text-subtle">
								Use when diagnosis is resolved or ruled out.
							</p>
						</div>
					{/if}
				</div>
			</section>

			<section class="space-y-4">
				<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
					Notes
				</h3>
				<Textarea
					label="Clinical notes"
					placeholder="Monitor mood weekly."
					rows={4}
					bind:value={$form.notes}
					error={formatFormError($errors.notes)}
				/>
			</section>

			{#if errorMessage}
				<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
					{errorMessage}
				</div>
			{/if}
			<button type="submit" class="hidden" aria-hidden="true"></button>
		</form>
	{/if}

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={() => (open = false)} disabled={$delayed || isFetching}
				>Cancel</Button
			>
			<Button class="gap-2" form={formId} type="submit" isLoading={$delayed || isFetching}>
				<Stethoscope class="h-4 w-4" />
				Update diagnosis
			</Button>
		</div>
	{/snippet}
</Modal>
