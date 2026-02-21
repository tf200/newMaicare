<script lang="ts">
	import { onMount } from 'svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { getClientDiagnosis, updateClientDiagnosis } from '$lib/api/clients';
	import { Stethoscope } from 'lucide-svelte';
	import type {
		ClientDiagnosisResponse,
		DiagnosisSeverity,
		DiagnosisStatus,
		UpdateClientDiagnosisRequest
	} from '$lib/types/api';

	interface Props {
		clientId: string;
		diagnosisId: string | null;
		open?: boolean;
		onUpdated?: () => void;
	}

	let { clientId, diagnosisId, open = $bindable(false), onUpdated }: Props = $props();

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

	let codeSystem = $state('ICD-10');
	let code = $state('');
	let title = $state('');
	let description = $state('');
	let status = $state<DiagnosisStatus>('confirmed');
	let severity = $state<DiagnosisSeverity>('unknown');
	let diagnosedOn = $state('');
	let resolvedOn = $state('');
	let diagnosingClinician = $state('');
	let notes = $state('');
	let errorMessage = $state('');
	let isLoading = $state(false);
	let isFetching = $state(false);

	let fieldErrors = $state<{
		code_system?: string;
		code?: string;
		resolved_on?: string;
	}>({});

	const showResolvedDate = $derived(status === 'resolved' || status === 'ruled_out');

	const applyStatus = (nextStatus: DiagnosisStatus) => {
		status = nextStatus;
		if (nextStatus !== 'resolved' && nextStatus !== 'ruled_out') {
			resolvedOn = '';
			fieldErrors = {
				...fieldErrors,
				resolved_on: undefined
			};
		}
	};

	const toNullable = (value: string) => {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	};

	const toRfc3339Date = (value: string) => {
		if (!value) return null;
		return `${value}T00:00:00Z`;
	};

	const toInputDate = (value: string | null) => {
		if (!value) return '';
		return value.slice(0, 10);
	};

	const isDiagnosisStatus = (value: string): value is DiagnosisStatus =>
		statusOptions.some((option) => option.value === value);

	const isDiagnosisSeverity = (value: string): value is DiagnosisSeverity =>
		severityOptions.some((option) => option.value === value);

	const populateForm = (diagnosis: ClientDiagnosisResponse) => {
		codeSystem = diagnosis.code_system;
		code = diagnosis.code;
		title = diagnosis.title ?? '';
		description = diagnosis.description ?? '';
		status = isDiagnosisStatus(diagnosis.status) ? diagnosis.status : 'confirmed';
		severity = isDiagnosisSeverity(diagnosis.severity) ? diagnosis.severity : 'unknown';
		diagnosedOn = toInputDate(diagnosis.diagnosed_on);
		resolvedOn = toInputDate(diagnosis.resolved_on);
		diagnosingClinician = diagnosis.diagnosing_clinician ?? '';
		notes = diagnosis.notes ?? '';
		errorMessage = '';
		fieldErrors = {};
	};

	const validate = () => {
		const nextErrors: {
			code_system?: string;
			code?: string;
			resolved_on?: string;
		} = {};

		if (!codeSystem.trim()) nextErrors.code_system = 'Code system is required.';
		if (!code.trim()) nextErrors.code = 'Code is required.';

		if (showResolvedDate && diagnosedOn && resolvedOn && resolvedOn < diagnosedOn) {
			nextErrors.resolved_on = 'Resolved date cannot be before diagnosed date.';
		}

		fieldErrors = nextErrors;
		return Object.keys(nextErrors).length === 0;
	};

	onMount(() => {
		if (!diagnosisId) {
			errorMessage = 'No diagnosis selected.';
			return;
		}

		isFetching = true;

		const loadDiagnosis = async () => {
			try {
				const response = await getClientDiagnosis(clientId, diagnosisId);
				populateForm(response.data);
			} catch (error) {
				errorMessage = error instanceof Error ? error.message : 'Failed to load diagnosis.';
			} finally {
				isFetching = false;
			}
		};

		void loadDiagnosis();
	});

	const handleCancel = () => {
		open = false;
	};

	const handleUpdate = async () => {
		errorMessage = '';
		if (!diagnosisId) {
			errorMessage = 'No diagnosis selected.';
			return;
		}

		if (!validate()) return;

		const payload: UpdateClientDiagnosisRequest = {
			code_system: codeSystem,
			code: code.trim(),
			title: toNullable(title),
			description: toNullable(description),
			status,
			severity,
			diagnosed_on: toRfc3339Date(diagnosedOn),
			resolved_on: toRfc3339Date(resolvedOn),
			diagnosing_clinician: toNullable(diagnosingClinician),
			notes: toNullable(notes)
		};

		isLoading = true;

		try {
			await updateClientDiagnosis(clientId, diagnosisId, payload);
			open = false;
			onUpdated?.();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to update diagnosis.';
		} finally {
			isLoading = false;
		}
	};

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
		<div class="space-y-6">
			<section class="space-y-4">
				<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
					Classification
				</h3>
				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<Select
						label="Code system"
						options={codeSystemOptions}
						bind:value={codeSystem}
						error={fieldErrors.code_system}
					/>
					<Input label="Code" placeholder="F32.1" bind:value={code} error={fieldErrors.code} />
				</div>
				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<Input label="Title" placeholder="Depressive episode, moderate" bind:value={title} />
					<Input
						label="Diagnosing clinician"
						placeholder="Dr. A. Example"
						bind:value={diagnosingClinician}
					/>
				</div>
				<Textarea
					label="Description"
					placeholder="Client reports low mood and loss of interest."
					rows={3}
					bind:value={description}
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
									onclick={() => applyStatus(option.value)}
									class="{badgeBase} {status === option.value
										? option.activeClass
										: 'border-border bg-surface text-text-muted hover:bg-border/30'}"
								>
									{option.label}
								</button>
							{/each}
						</div>
					</div>

					<div class="space-y-2">
						<p class="ml-1 text-sm font-semibold text-text-muted">Severity</p>
						<div class="flex flex-wrap gap-2">
							{#each severityOptions as option (option.value)}
								<button
									type="button"
									onclick={() => (severity = option.value)}
									class="{badgeBase} {severity === option.value
										? option.activeClass
										: 'border-border bg-surface text-text-muted hover:bg-border/30'}"
								>
									{option.label}
								</button>
							{/each}
						</div>
					</div>
				</div>
			</section>

			<section class="space-y-4">
				<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
					Timeline
				</h3>
				<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
					<div class="space-y-1.5">
						<DatePicker label="Diagnosed on" bind:value={diagnosedOn} />
						<p class="ml-1 text-xs text-text-subtle">Stored as date and serialized as RFC3339.</p>
					</div>

					{#if showResolvedDate}
						<div class="space-y-1.5">
							<DatePicker
								label="Resolved on"
								bind:value={resolvedOn}
								error={fieldErrors.resolved_on}
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
					bind:value={notes}
				/>
			</section>

			{#if errorMessage}
				<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
					{errorMessage}
				</div>
			{/if}
		</div>
	{/if}

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={isLoading || isFetching}
				>Cancel</Button
			>
			<Button class="gap-2" onclick={handleUpdate} isLoading={isLoading || isFetching}>
				<Stethoscope class="h-4 w-4" />
				Update diagnosis
			</Button>
		</div>
	{/snippet}
</Modal>
