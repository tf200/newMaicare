<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { createClientDiagnosis } from '$lib/api/clients';
	import { Stethoscope } from 'lucide-svelte';
	import type {
		CreateClientDiagnosisRequest,
		DiagnosisSeverity,
		DiagnosisStatus
	} from '$lib/types/api';

	interface Props {
		clientId: string;
		open?: boolean;
		onCreated?: () => void;
	}

	let { clientId, open = $bindable(false), onCreated }: Props = $props();

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

	let fieldErrors = $state<{
		code_system?: string;
		code?: string;
		resolved_on?: string;
	}>({});

	const showResolvedDate = $derived(status === 'resolved' || status === 'ruled_out');

	$effect(() => {
		if (!showResolvedDate) {
			resolvedOn = '';
			fieldErrors.resolved_on = undefined;
		}
	});

	const resetForm = () => {
		codeSystem = 'ICD-10';
		code = '';
		title = '';
		description = '';
		status = 'confirmed';
		severity = 'unknown';
		diagnosedOn = '';
		resolvedOn = '';
		diagnosingClinician = '';
		notes = '';
		errorMessage = '';
		fieldErrors = {};
	};

	const toNullable = (value: string) => {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	};

	const toRfc3339Date = (value: string) => {
		if (!value) return null;
		return `${value}T00:00:00Z`;
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

	const handleCancel = () => {
		resetForm();
		open = false;
	};

	const handleCreate = async () => {
		errorMessage = '';
		if (!validate()) return;

		const payload: CreateClientDiagnosisRequest = {
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
			await createClientDiagnosis(clientId, payload);
			onCreated?.();
			resetForm();
			open = false;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to create diagnosis.';
		} finally {
			isLoading = false;
		}
	};

	const badgeBase =
		'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold tracking-wide uppercase transition-colors';
</script>

<Modal
	bind:open
	title="Create Diagnosis"
	description="Capture clinical classification, status, and timeline before saving to the medical dossier."
	size="xl"
>
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
								onclick={() => (status = option.value)}
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

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={isLoading}>Cancel</Button>
			<Button class="gap-2" onclick={handleCreate} {isLoading}>
				<Stethoscope class="h-4 w-4" />
				Create diagnosis
			</Button>
		</div>
	{/snippet}
</Modal>
