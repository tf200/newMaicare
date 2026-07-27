<script lang="ts">
	import {
		User,
		Building,
		ShieldAlert,
		FileText,
		Calendar,
		Phone,
		Mail,
		Clock,
		MapPin,
		Briefcase,
		HeartPulse,
		AlertTriangle,
		CheckCircle2,
		Check,
		Download,
		ClipboardCheck,
		Target,
		Plus
	} from 'lucide-svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { getBreadcrumbsState } from '$lib/state/breadcrumbs.svelte';
	import type {
		GetRegistrationFormResponse,
		ClientGender,
		EducationLevel,
		FormStatus,
		RegistrationDocument,
		RegistrationDocumentType
	} from '$lib/types/api';
	import { updateRegistrationDocument } from '$lib/api/registration';
	import { AttachmentService } from '$lib/api/attachments';
	import ProcessRegistrationForm from '$lib/components/forms/ProcessRegistrationForm.svelte';
	import CreateIntakeWizard from '$lib/components/intake/CreateIntakeWizard.svelte';
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onDestroy } from 'svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import RegistrationEditForm from './_components/RegistrationEditForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let showProcessForm = $state(false);
	let showIntakeWizard = $state(false);

	const breadcrumbs = getBreadcrumbsState();
	$effect(() => {
		breadcrumbs.items = [
			{ label: m.breadcrumb_home(), href: resolve('/(app)/dashboard') },
			{ label: m.registrations(), href: resolve('/(app)/registrations') },
			{ label: m.breadcrumb_registration_detail() }
		];
		return () => {
			breadcrumbs.items = [];
		};
	});

	let isEditing = $state(false);
	let toast = $state<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;
	let downloadingDocumentId = $state<string | null>(null);
	let uploadingDocumentKey = $state<string | null>(null);
	let documentUploadProgress = $state<Record<string, number>>({});
	let documentUploadErrors = $state<Record<string, string | null>>({});
	let documentInputResetKeys = $state<Record<string, number>>({});

	const allowedRegistrationDocumentTypes = ['application/pdf', 'image/jpeg', 'image/png'] as const;
	const maxRegistrationDocumentSize = 20 * 1024 * 1024;
	const registrationDocumentAccept = allowedRegistrationDocumentTypes.join(',');

	function showToast(message: string, type: 'success' | 'warning' | 'error') {
		toast = { message, type };
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			toast = null;
		}, 4000);
	}

	function closeToast() {
		if (toastTimer) {
			clearTimeout(toastTimer);
			toastTimer = null;
		}
		toast = null;
	}

	onDestroy(() => {
		if (toastTimer) clearTimeout(toastTimer);
	});

	async function refreshRegistrationResources() {
		await Promise.all([
			invalidate('app:registrations:detail'),
			invalidate('app:registrations:list'),
			invalidate('app:registrations:stats')
		]);
	}

	async function handleRegistrationUpdated() {
		showToast(m.registration_updated_successfully(), 'success');
		await refreshRegistrationResources();
	}

	function handleEditingChange(editing: boolean) {
		isEditing = editing;
	}

	async function refreshAfterIntakeCreated() {
		await Promise.all([
			invalidate('app:registrations:detail'),
			invalidate('app:intakes:list'),
			invalidate('app:intakes:stats')
		]);
	}

	async function retryRegistrationDetail() {
		await invalidate('app:registrations:detail');
	}

	const resolveLocale = () => (getLocale() === 'nl' ? 'nl-NL' : 'en-GB');

	const formatDate = (dateString: string | undefined) => {
		if (!dateString) return m.not_available_short();
		return new Date(dateString).toLocaleDateString(resolveLocale(), {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const formatOnlyDate = (dateString: string | undefined | null) => {
		if (!dateString) return m.not_available_short();
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return m.not_available_short();
		return date.toLocaleDateString(resolveLocale(), {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};

	const formatDateTime = (dateString: string | undefined | null) => {
		if (!dateString) return m.not_available_short();
		return new Date(dateString).toLocaleString(resolveLocale(), {
			weekday: 'long',
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const formatTime = (dateString: string | undefined | null) => {
		if (!dateString) return m.not_available_short();
		return new Date(dateString).toLocaleTimeString(resolveLocale(), {
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const calculateAge = (dob: string | undefined | null) => {
		if (!dob) return m.not_available_short();
		const birthDate = new Date(dob);
		if (isNaN(birthDate.getTime())) return m.not_available_short();
		const today = new Date();
		let age = today.getFullYear() - birthDate.getFullYear();
		const monthDifference = today.getMonth() - birthDate.getMonth();
		if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
			age--;
		}
		return age;
	};

	// Derived logic for styling
	const riskTone = 'bg-secondary/10 text-secondary border-secondary/20';

	const statusColors: Record<FormStatus, string> = {
		pending: 'border border-warning/20 bg-warning/10 text-warning shadow-sm',
		processed: 'border border-success/20 bg-success/10 text-success'
	};

	const genderColors: Record<ClientGender, string> = {
		male: 'border-info/20 bg-info/10 text-info',
		female: 'border-secondary/20 bg-secondary/10 text-secondary',
		other: 'border-border bg-bg text-text-muted',
		unknown: 'border-border bg-bg text-text-subtle'
	};

	const educationColors: Record<EducationLevel, string> = {
		primary: 'border-border bg-bg text-text-muted',
		secondary: 'border-info/20 bg-info/10 text-info',
		higher: 'border-success/20 bg-success/10 text-success',
		none: 'border-error/20 bg-error/10 text-error'
	};

	const careStyles: Record<string, string> = {
		careProtectedLiving: 'border border-success/20 bg-success/10 text-success',
		careAssistedIndependentLiving: 'border-info/20 bg-info/10 text-info',
		careRoomTrainingCenter: 'border-brand/20 bg-brand/10 text-brand',
		careAmbulatoryGuidance: 'border-warning/20 bg-warning/10 text-warning'
	};

	const statusLabels: Record<FormStatus, () => string> = {
		pending: m.pending,
		processed: m.processed
	};

	const genderLabels: Record<ClientGender, () => string> = {
		male: m.male,
		female: m.female,
		other: m.other,
		unknown: m.unknown
	};

	const educationLabels: Record<EducationLevel, () => string> = {
		primary: m.education_primary,
		secondary: m.education_secondary,
		higher: m.education_higher,
		none: m.education_none
	};
	const detailSkeletonCards = Array.from({ length: 6 }, (_, index) => index);

	function getRiskFactors(registration: GetRegistrationFormResponse) {
		return [
			{
				label: m.aggressive_behavior(),
				key: 'risk_aggressive_behavior',
				value: registration.risk_aggressive_behavior
			},
			{
				label: m.suicidal_selfharm(),
				key: 'risk_suicidal_selfharm',
				value: registration.risk_suicidal_selfharm
			},
			{
				label: m.substance_abuse(),
				key: 'risk_substance_abuse',
				value: registration.risk_substance_abuse
			},
			{
				label: m.psychiatric_issues(),
				key: 'risk_psychiatric_issues',
				value: registration.risk_psychiatric_issues
			},
			{
				label: m.criminal_history(),
				key: 'risk_criminal_history',
				value: registration.risk_criminal_history
			},
			{
				label: m.flight_behavior(),
				key: 'risk_flight_behavior',
				value: registration.risk_flight_behavior
			},
			{
				label: m.weapon_possession(),
				key: 'risk_weapon_possession',
				value: registration.risk_weapon_possession
			},
			{
				label: m.sexual_behavior(),
				key: 'risk_sexual_behavior',
				value: registration.risk_sexual_behavior
			},
			{
				label: m.day_night_rhythm(),
				key: 'risk_day_night_rhythm',
				value: registration.risk_day_night_rhythm
			}
		];
	}

	function getCareOptions(registration: GetRegistrationFormResponse) {
		return [
			{
				label: m.protected_living(),
				key: 'careProtectedLiving',
				active: registration.care_protected_living
			},
			{
				label: m.assisted_independent_living(),
				key: 'careAssistedIndependentLiving',
				active: registration.care_assisted_independent_living
			},
			{
				label: m.room_training_center(),
				key: 'careRoomTrainingCenter',
				active: registration.care_room_training_center
			},
			{
				label: m.ambulatory_guidance(),
				key: 'careAmbulatoryGuidance',
				active: registration.care_ambulatory_guidance
			}
		];
	}

	type RegistrationDocumentValue = RegistrationDocument | string | null | undefined;
	type DisplayDocument = {
		key: string;
		label: string;
		documentType: RegistrationDocumentType;
		document: RegistrationDocument | null;
		legacyId: string | null;
	};

	function getDocumentId(value: RegistrationDocumentValue): string | null {
		if (typeof value === 'string') return value;
		return value?.id ?? null;
	}

	function getDocument(value: RegistrationDocumentValue): RegistrationDocument | null {
		return typeof value === 'object' && value ? value : null;
	}

	function getRegistrationDocuments(registration: GetRegistrationFormResponse): DisplayDocument[] {
		return [
			{
				key: 'referral',
				label: m.referral_document(),
				documentType: 'document_referral' as const,
				value: registration.document_referral
			},
			{
				key: 'education',
				label: m.education_report(),
				documentType: 'document_education_report' as const,
				value: registration.document_education_report
			},
			{
				key: 'action',
				label: m.action_plan(),
				documentType: 'document_action_plan' as const,
				value: registration.document_action_plan
			},
			{
				key: 'psychiatric',
				label: m.psychiatric_report(),
				documentType: 'document_psychiatric_report' as const,
				value: registration.document_psychiatric_report
			},
			{
				key: 'diagnosis',
				label: m.diagnosis_info(),
				documentType: 'document_diagnosis' as const,
				value: registration.document_diagnosis
			},
			{
				key: 'safety',
				label: m.safety_plan(),
				documentType: 'document_safety_plan' as const,
				value: registration.document_safety_plan
			},
			{
				key: 'identity',
				label: m.id_copy(),
				documentType: 'document_id_copy' as const,
				value: registration.document_id_copy
			}
		].map(({ key, label, documentType, value }) => ({
			key,
			label,
			documentType,
			document: getDocument(value),
			legacyId: getDocumentId(value)
		}));
	}

	function validateRegistrationDocument(file: File): string | null {
		if (
			!allowedRegistrationDocumentTypes.includes(
				file.type as (typeof allowedRegistrationDocumentTypes)[number]
			)
		) {
			return m.invalid_document_type();
		}

		if (file.size > maxRegistrationDocumentSize) {
			return m.document_too_large();
		}

		return null;
	}

	async function replaceRegistrationDocument(
		registrationId: string,
		document: DisplayDocument,
		file: File
	) {
		if (uploadingDocumentKey) return;

		const validationError = validateRegistrationDocument(file);
		if (validationError) {
			documentUploadErrors = { ...documentUploadErrors, [document.key]: validationError };
			return;
		}

		uploadingDocumentKey = document.key;
		documentUploadProgress = { ...documentUploadProgress, [document.key]: 0 };
		documentUploadErrors = { ...documentUploadErrors, [document.key]: null };

		try {
			const initData = await AttachmentService.initUpload({
				filename: file.name,
				content_type: file.type,
				size: file.size
			});

			await AttachmentService.uploadToStorage(initData.upload_url, file, (progress) => {
				documentUploadProgress = { ...documentUploadProgress, [document.key]: progress };
			});

			await updateRegistrationDocument(registrationId, {
				document_type: document.documentType,
				file_id: initData.file_id
			});

			showToast(m.document_replaced(), 'success');
			documentInputResetKeys = {
				...documentInputResetKeys,
				[document.key]: (documentInputResetKeys[document.key] ?? 0) + 1
			};
			await invalidate('app:registrations:detail');
		} catch (error) {
			const message = error instanceof Error ? error.message : m.failed_replace_document();
			documentUploadErrors = { ...documentUploadErrors, [document.key]: message };
			showToast(message, 'error');
		} finally {
			uploadingDocumentKey = null;
			documentUploadProgress = { ...documentUploadProgress, [document.key]: 0 };
		}
	}

	function handleRegistrationDocumentSelect(
		registrationId: string,
		document: DisplayDocument,
		event: Event
	) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		void replaceRegistrationDocument(registrationId, document, file);
	}

	function openRegistrationDocumentPicker(documentKey: string) {
		if (uploadingDocumentKey) return;
		globalThis.document.getElementById(`registration-document-${documentKey}`)?.click();
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	async function downloadDocument(documentId: string) {
		if (downloadingDocumentId) return;

		downloadingDocumentId = documentId;
		try {
			const attachment = await AttachmentService.getAttachment(documentId);
			if (!attachment.file_url) {
				throw new Error(m.failed_download_file());
			}

			window.open(attachment.file_url, '_blank', 'noopener,noreferrer');
		} catch (error) {
			showToast(error instanceof Error ? error.message : m.failed_download_file(), 'error');
		} finally {
			downloadingDocumentId = null;
		}
	}
</script>

<svelte:head>
	<title>{m.breadcrumb_registration_detail()} | MaiCare</title>
</svelte:head>

{#await data.registrationData}
	<div class="space-y-6">
		<div class="h-10 rounded-2xl bg-surface ring-1 ring-border"></div>
		<div class="rounded-3xl border border-border bg-surface p-8 shadow-sm">
			<div class="flex animate-pulse flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
				<div class="flex items-center gap-4">
					<div class="h-16 w-16 rounded-2xl bg-bg"></div>
					<div class="space-y-3">
						<div class="h-7 w-56 rounded-lg bg-bg"></div>
						<div class="h-4 w-40 rounded-lg bg-bg"></div>
					</div>
				</div>
				<div class="h-10 w-64 rounded-xl bg-bg"></div>
			</div>
		</div>
		<div class="grid gap-6 lg:grid-cols-3">
			{#each detailSkeletonCards as index (index)}
				<div class="h-44 animate-pulse rounded-3xl border border-border bg-surface shadow-sm"></div>
			{/each}
		</div>
	</div>
{:then registrationResult}
	{#if registrationResult.loadError || !registrationResult.registration}
		<InlineErrorBanner
			title={m.failed()}
			message={registrationResult.loadError ?? m.failed_load_registration()}
			actionLabel={m.retry()}
			onRetry={retryRegistrationDetail}
		/>
	{:else}
		{@const registration = registrationResult.registration}
		<div class="space-y-6">
			{#if !isEditing}
				<div class="flex flex-wrap items-center justify-end gap-2">
					{#if registration.form_status === 'pending'}
						<button
							onclick={() => (showProcessForm = true)}
							class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/30"
						>
							{m.process_application()}
						</button>
					{:else if registration.intake_form_id}
						<a
							href={resolve('/(app)/intakes/[id]', { id: registration.intake_form_id })}
							class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/30"
						>
							<ClipboardCheck class="h-4 w-4" />
							{m.view_intake()}
						</a>
					{:else}
						<button
							onclick={() => (showIntakeWizard = true)}
							class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/30"
						>
							<ClipboardCheck class="h-4 w-4" />
							{m.start_intake()}
						</button>
					{/if}
				</div>
			{/if}

			<!-- Header Section -->
			<header
				class="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
			>
				<!-- Background Accents -->
				<div
					class="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-brand/10 to-transparent blur-3xl"
				></div>
				<div
					class="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr {registration.risk_count >=
					3
						? 'from-rose-500/10'
						: 'from-emerald-500/10'} to-transparent blur-3xl"
				></div>

				<div class="relative flex flex-col justify-between gap-8 p-8 lg:flex-row lg:items-center">
					<div class="space-y-4">
						<div class="flex items-center gap-4">
							<div
								class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 text-2xl font-bold text-zinc-700 shadow-inner ring-1 ring-black/5 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-300 dark:ring-white/10"
							>
								{registration.client_first_name[0]}{registration.client_last_name[0]}
							</div>
							<div>
								<div class="flex items-center gap-3">
									<h1 class="text-3xl font-bold tracking-tight text-text">
										{registration.client_first_name}
										{registration.client_last_name}
									</h1>
									<span
										class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase {statusColors[
											registration.form_status as FormStatus
										]}"
									>
										{statusLabels[registration.form_status as FormStatus]()}
									</span>
								</div>
								<div class="mt-1 flex items-center gap-3">
									<p class="text-sm font-medium text-text-subtle">
										{m.bsn()}: {registration.client_bsn_number}
									</p>
									<span
										class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase {genderColors[
											registration.client_gender as ClientGender
										]}"
									>
										{genderLabels[registration.client_gender as ClientGender]()}
									</span>
								</div>
							</div>
						</div>
					</div>

					<div class="flex flex-wrap gap-4 border-t border-border/40 pt-6 lg:border-t-0 lg:pt-0">
						<div class="flex flex-col">
							<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
								>{m.submitted_label()}</span
							>
							<span class="text-sm font-bold text-text"
								>{formatDate(registration.submitted_at)}</span
							>
						</div>
						<div class="h-8 w-px bg-border lg:block"></div>
						<div class="flex flex-col">
							<span class="text-[10px] font-bold tracking-widest text-text-subtle uppercase"
								>{m.last_updated_label()}</span
							>
							<span class="text-sm font-bold text-text">{formatDate(registration.updated_at)}</span>
						</div>
					</div>
				</div>
			</header>

			<ProcessRegistrationForm
				bind:open={showProcessForm}
				registrationId={registration.id}
				onProcessed={refreshRegistrationResources}
			/>

			<CreateIntakeWizard
				bind:open={showIntakeWizard}
				{registration}
				onCreated={refreshAfterIntakeCreated}
			/>

			{#key registration.id}
				<RegistrationEditForm
					{registration}
					onUpdated={handleRegistrationUpdated}
					onEditingChange={handleEditingChange}
				/>
			{/key}

			{#if !isEditing}
				<div class="grid gap-6 xl:grid-cols-[1fr_340px]">
					<!-- Left Column: Details -->
					<div class="space-y-6">
						{#if registration.form_status === 'processed'}
							<!-- Intake Process Details -->
							<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
								<div class="mb-6 flex items-center justify-between gap-4">
									<div class="flex items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"
										>
											<Calendar class="h-5 w-5" />
										</div>
										<div>
											<h2 class="text-lg font-bold text-text">{m.intake_process_details()}</h2>
											<p class="text-xs text-text-subtle">
												{m.admission_type()}:
												{registration.admission_type === 'crisis_admission'
													? m.crisis_admission()
													: registration.admission_type === 'regular_placement'
														? m.regular_placement()
														: m.not_available_short()}
											</p>
										</div>
									</div>

									{#if registration.intake_appointment_date}
										<div
											class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm"
										>
											<Check class="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
											{m.intake_scheduled()}
										</div>
									{:else}
										<div
											class="rounded-full border border-amber-400/30 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-700 shadow-sm"
										>
											⏳ {m.waiting_for_selection()}
										</div>
									{/if}
								</div>

								<div class="grid gap-6 md:grid-cols-2">
									<div class="space-y-4">
										{#if registration.intake_appointment_date}
											<div>
												<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
													>{m.confirmed_date()}</span
												>
												<div
													class="mt-2 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/20 dark:bg-emerald-900/10"
												>
													<div
														class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm"
													>
														<Clock class="h-5 w-5" />
													</div>
													<div>
														<p class="text-sm font-bold text-emerald-900 dark:text-emerald-100">
															{formatDateTime(registration.intake_appointment_date)}
														</p>
														<p class="text-xs text-emerald-700/70 dark:text-emerald-300/70">
															{formatTime(registration.intake_appointment_date)}
														</p>
													</div>
												</div>
											</div>
										{:else if registration.intake_options && registration.intake_options.length > 0}
											<div>
												<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
													>{m.proposed_dates()}</span
												>
												<div class="mt-3 space-y-2">
													{#each registration.intake_options as option (option)}
														<div
															class="flex items-center justify-between rounded-xl border border-border/50 bg-zinc-50/50 p-3 text-sm font-medium dark:bg-zinc-900/50"
														>
															<span>{formatDateTime(option)}</span>
														</div>
													{/each}
												</div>
												<p class="mt-3 flex items-start gap-2 text-xs text-amber-700">
													<ShieldAlert class="h-3.5 w-3.5 shrink-0" />
													{m.intake_selection_note()}
												</p>
											</div>
										{/if}
									</div>

									<div class="space-y-4">
										<div>
											<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
												>{m.location()}</span
											>
											<div
												class="mt-2 flex items-start gap-3 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50"
											>
												<MapPin class="mt-0.5 h-5 w-5 shrink-0 text-text-subtle" />
												<p class="text-sm font-medium text-text">
													{registration.intake_appointment_location || m.not_available_short()}
												</p>
											</div>
										</div>

										<div>
											<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
												>{m.processed_by()}</span
											>
											<div class="mt-2 flex items-center gap-3">
												<div
													class="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
												>
													{registration.processed_by_employee_name?.[0] || m.not_available_short()}
												</div>
												<p class="text-sm font-semibold text-text">
													{registration.processed_by_employee_name || m.not_available_short()}
												</p>
											</div>
										</div>
									</div>
								</div>
							</section>
						{/if}

						<!-- Risk Assessment Panel -->
						<section
							class="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm"
						>
							{#if registration.risk_count >= 3}
								<div
									class="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-500 to-secondary opacity-50"
								></div>
							{/if}

							<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"
									>
										<ShieldAlert class="h-5 w-5" />
									</div>
									<div>
										<h2 class="text-lg font-bold text-text">{m.risk_assessment()}</h2>
										<p class="text-xs text-text-subtle">{m.risk_assessment_description()}</p>
									</div>
								</div>
								<div class="rounded-full border px-3 py-1 text-xs font-bold shadow-sm {riskTone}">
									{registration.risk_count}
									{m.detected()}
								</div>
							</div>

							<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
								{#each getRiskFactors(registration) as factor (factor.key)}
									<div
										class="group flex items-center justify-between rounded-xl border p-3.5 text-sm font-medium transition-all duration-200 {factor.value
											? 'border-rose-200 bg-rose-50/50 text-rose-900 shadow-sm dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-100'
											: 'border-border/50 bg-zinc-50/50 text-text-muted hover:bg-white hover:shadow-sm dark:bg-zinc-900/50 dark:hover:bg-zinc-800'}"
									>
										<span class="truncate pr-2">{factor.label}</span>
										{#if factor.value}
											<AlertTriangle class="h-4 w-4 shrink-0 text-rose-500" />
										{:else}
											<CheckCircle2
												class="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-emerald-500 dark:text-zinc-600"
											/>
										{/if}
									</div>
								{/each}
							</div>
						</section>

						<!-- Motivation & Goals -->
						<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
							<div class="mb-6 flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"
								>
									<Target class="h-5 w-5" />
								</div>
								<div>
									<h2 class="text-lg font-bold text-text">{m.motivation_goals()}</h2>
									<p class="text-xs text-text-subtle">{m.motivation_goals_description()}</p>
								</div>
							</div>

							<div class="grid gap-8 md:grid-cols-2">
								{#if registration.client_goals && registration.client_goals.length > 0}
									<div>
										<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
											>{m.client_goals()}</span
										>
										<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-text-muted">
											{#each registration.client_goals as goal (goal)}
												<li>{goal}</li>
											{/each}
										</ul>
									</div>
								{/if}

								{#if registration.application_reason}
									<div>
										<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
											>{m.reason_for_application()}</span
										>
										<p class="mt-2 text-sm leading-relaxed text-text-muted">
											{registration.application_reason}
										</p>
									</div>
								{/if}
							</div>
						</section>

						<!-- Care & Application -->
						<section class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
							<div class="mb-6 flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"
								>
									<HeartPulse class="h-5 w-5" />
								</div>
								<div>
									<h2 class="text-lg font-bold text-text">{m.care_application()}</h2>
									<p class="text-xs text-text-subtle">{m.admission_details()}</p>
								</div>
							</div>

							<div class="grid gap-8 md:grid-cols-2">
								<div class="space-y-6">
									<div>
										<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
											>{m.selected_care_options()}</span
										>
										<div class="mt-3 flex flex-wrap gap-2">
											{#each getCareOptions(registration).filter((o) => o.active) as option (option.key)}
												<span
													class="inline-flex rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm {careStyles[
														option.key
													] ?? 'border-zinc-200 bg-zinc-100 text-zinc-700'}"
												>
													{option.label}
												</span>
											{/each}
										</div>
									</div>
								</div>

								<div>
									<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
										>{m.risks_notes()}</span
									>
									<p class="mt-3 text-sm leading-relaxed text-text-muted">
										{registration.risk_additional_notes || m.no_additional_risk_notes()}
									</p>
								</div>
							</div>

							{#if registration.risk_other}
								<div class="mt-6 border-t border-border/50 pt-6">
									<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
										>{m.other_risk_description()}</span
									>
									<div
										class="mt-3 rounded-2xl bg-zinc-50 p-4 text-sm leading-relaxed text-text-muted italic dark:bg-zinc-900/50"
									>
										"{registration.risk_other_description}"
									</div>
								</div>
							{/if}
						</section>

						<!-- Documents -->
						<section class="space-y-6">
							{#each [getRegistrationDocuments(registration)] as documents (documents)}
								{@const uploadedCount = documents.filter((document) => document.legacyId).length}
								<div class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
									<div class="border-b border-border bg-bg/50 p-5">
										<div class="flex items-start justify-between gap-4">
											<div class="flex items-center gap-3">
												<div
													class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand"
												>
													<FileText class="h-5 w-5" />
												</div>
												<div>
													<h3 class="font-semibold tracking-tight text-text">{m.documents()}</h3>
													<p class="mt-0.5 text-xs text-text-muted">
														{m.documents_uploaded_count({
															uploaded: uploadedCount,
															total: documents.length
														})}
													</p>
												</div>
											</div>
											<span
												class="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand tabular-nums"
											>
												{uploadedCount}/{documents.length}
											</span>
										</div>
										<div class="mt-4 h-1.5 overflow-hidden rounded-full bg-border/60">
											<div
												class="h-full rounded-full bg-brand transition-[width] duration-500"
												style:width={`${(uploadedCount / documents.length) * 100}%`}
											></div>
										</div>
									</div>

									<div class="grid gap-2 p-3 md:grid-cols-2">
										{#each documents as document (document.key)}
											{@const isUploadingDocument = uploadingDocumentKey === document.key}
											{@const uploadError = documentUploadErrors[document.key]}
											<div
												class="relative flex min-h-20 items-center gap-3 overflow-hidden rounded-2xl border p-3.5 {document.legacyId
													? 'border-success/20 bg-success/5'
													: 'border-dashed border-border bg-bg/40'}"
											>
												{#key documentInputResetKeys[document.key] ?? 0}
													<input
														id={`registration-document-${document.key}`}
														type="file"
														accept={registrationDocumentAccept}
														class="hidden"
														disabled={uploadingDocumentKey !== null}
														onchange={(event) =>
															handleRegistrationDocumentSelect(registration.id, document, event)}
													/>
												{/key}
												<div
													class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {document.legacyId
														? 'bg-success/10 text-success'
														: 'bg-surface text-text-subtle ring-1 ring-border'}"
												>
													{#if isUploadingDocument}
														<span
															class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
														></span>
													{:else if document.legacyId}
														<CheckCircle2 class="h-5 w-5" />
													{:else}
														<FileText class="h-5 w-5" />
													{/if}
												</div>

												<div class="min-w-0 flex-1">
													<div class="flex items-center justify-between gap-2">
														<p class="truncate text-sm font-semibold text-text">{document.label}</p>
														<span
															class="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase {document.legacyId
																? 'bg-success/10 text-success'
																: 'bg-border/60 text-text-subtle'}"
														>
															{document.legacyId ? m.uploaded() : m.not_uploaded()}
														</span>
													</div>
													{#if document.document}
														<p
															class="mt-1 truncate text-xs text-text-muted"
															title={document.document.name}
														>
															{document.document.name}
															<span class="px-1 text-text-subtle">·</span>
															{formatFileSize(document.document.size)}
														</p>
													{:else if document.legacyId}
														<p class="mt-1 text-xs text-text-muted">{m.uploaded_file()}</p>
													{:else}
														<p class="mt-1 text-xs text-text-subtle">{m.document_not_provided()}</p>
													{/if}
													{#if isUploadingDocument}
														<p class="mt-1 text-xs font-medium text-brand">
															{m.document_uploading()}
															{documentUploadProgress[document.key] ?? 0}%
														</p>
													{:else if uploadError}
														<p class="mt-1 text-xs font-medium text-error">{uploadError}</p>
													{/if}
												</div>
												<div class="flex shrink-0 items-center gap-2">
													<PermissionGuard permission="REGISTRATION_FORM.UPDATE">
														<button
															type="button"
															onclick={() => openRegistrationDocumentPicker(document.key)}
															disabled={uploadingDocumentKey !== null}
															class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-surface px-3 text-xs font-bold text-text-subtle shadow-sm ring-1 ring-border transition-all hover:bg-brand hover:text-white hover:ring-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-surface disabled:hover:text-text-subtle disabled:hover:ring-border"
															title={document.legacyId ? m.replace_document() : m.upload_document()}
															aria-label={document.legacyId
																? m.replace_document()
																: m.upload_document()}
														>
															<Plus class="h-4 w-4" />
															<span class="hidden sm:inline">
																{document.legacyId ? m.replace_document() : m.upload_document()}
															</span>
														</button>
													</PermissionGuard>

													{#if document.legacyId}
														<button
															type="button"
															onclick={() =>
																document.legacyId && downloadDocument(document.legacyId)}
															disabled={downloadingDocumentId !== null || isUploadingDocument}
															class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-text-subtle shadow-sm ring-1 ring-border transition-all hover:bg-brand hover:text-white hover:ring-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
															title={m.download_file()}
															aria-label={m.download_file()}
														>
															{#if downloadingDocumentId === document.legacyId}
																<span
																	class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
																></span>
															{:else}
																<Download class="h-4 w-4" />
															{/if}
														</button>
													{/if}
												</div>

												{#if isUploadingDocument}
													<div class="absolute inset-x-0 bottom-0 h-1 bg-border/60">
														<div
															class="h-full bg-brand transition-all duration-300"
															style:width={`${documentUploadProgress[document.key] ?? 0}%`}
														></div>
													</div>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/each}
						</section>
					</div>

					<!-- Right Column: Sidebar (1/3 width on XL) -->
					<div class="space-y-6">
						<!-- Education & Work Summary -->
						<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
							<div class="mb-5 flex items-center gap-3">
								<div
									class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand"
								>
									<Briefcase class="h-4 w-4" />
								</div>
								<div class="min-w-0">
									<h3 class="truncate text-base font-semibold tracking-tight text-text">
										{m.work_education()}
									</h3>
									<p class="text-xs text-text-muted">{m.education_work_summary()}</p>
								</div>
							</div>

							<div class="divide-y divide-border/60 border-t border-border/60">
								<div class="flex items-center justify-between gap-3 py-3.5">
									<span class="text-xs font-medium text-text-muted">{m.education_level()}</span>
									<span
										class="inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase {registration
											.education?.level
											? educationColors[registration.education.level as EducationLevel]
											: 'bg-zinc-100 text-zinc-500'}"
									>
										{registration.education?.level
											? educationLabels[registration.education.level]()
											: m.not_specified()}
									</span>
								</div>
								<div class="py-3.5">
									<span class="text-xs font-medium text-text-muted">{m.institution_name()}</span>
									<p class="mt-1 truncate text-sm font-semibold text-text">
										{registration.education?.institution || m.not_specified()}
									</p>
								</div>
								<div class="py-3.5">
									<div class="flex items-center justify-between gap-3">
										<span class="text-xs font-medium text-text-muted">{m.currently_employed()}</span
										>
										<span
											class="h-2 w-2 shrink-0 rounded-full {registration.work?.currently_employed
												? 'bg-success'
												: 'bg-text-subtle'}"
										></span>
									</div>
									<p class="mt-1 truncate text-sm font-semibold text-text">
										{registration.work?.current_employer ||
											(registration.work?.currently_employed ? m.yes() : m.no())}
									</p>
								</div>
							</div>
						</div>

						<!-- Client Details Card -->
						<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
							<div class="mb-5 flex items-center justify-between">
								<h3 class="flex items-center gap-2 text-lg font-bold text-text">
									<User class="h-5 w-5 text-text-subtle" />
									{m.client_details()}
								</h3>
							</div>

							<div class="space-y-6">
								<div class="space-y-4 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
									<div class="flex items-start gap-3 text-sm">
										<MapPin class="mt-0.5 h-4 w-4 shrink-0 text-text-subtle" />
										<span class="font-medium text-text">
											{registration.client_street}
											{registration.client_house_number}{registration.client_house_number_addition ||
												''}, {registration.client_postal_code},
											{registration.client_city}
										</span>
									</div>
									<div class="flex items-center gap-3 text-sm">
										<Phone class="h-4 w-4 shrink-0 text-text-subtle" />
										<a
											href="tel:{registration.client_phone_number}"
											class="text-text hover:text-brand hover:underline"
											>{registration.client_phone_number}</a
										>
									</div>
									<div class="flex items-center gap-3 text-sm">
										<Mail class="h-4 w-4 shrink-0 text-text-subtle" />
										<a
											href="mailto:{registration.client_email}"
											class="text-text hover:text-brand hover:underline"
											>{registration.client_email}</a
										>
									</div>
								</div>

								<div>
									<span class="text-xs font-bold tracking-wider text-text-subtle uppercase"
										>{m.personal_info()}</span
									>
									<div class="mt-3 space-y-3 text-sm">
										<div class="flex justify-between">
											<span class="text-text-muted">{m.date_of_birth()}</span>
											<span class="font-medium text-text"
												>{formatOnlyDate(registration.client_date_of_birth)}</span
											>
										</div>
										<div class="flex justify-between">
											<span class="text-text-muted">{m.age()}</span>
											<span class="font-medium text-text"
												>{calculateAge(registration.client_date_of_birth)} {m.years()}</span
											>
										</div>
										<div class="flex justify-between">
											<span class="text-text-muted">{m.gender()}</span>
											<span class="font-medium text-text"
												>{genderLabels[registration.client_gender as ClientGender]()}</span
											>
										</div>
										<div class="flex justify-between">
											<span class="text-text-muted">{m.bsn()}</span>
											<span class="font-medium text-text">{registration.client_bsn_number}</span>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Referrer Details -->
						<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
							<h3 class="mb-4 flex items-center gap-2 text-base font-bold text-text">
								<Building class="h-4 w-4 text-text-subtle" />
								{m.referrer()}
							</h3>
							<div class="mb-4 flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 font-bold text-brand"
								>
									{registration.referrer_first_name[0]}
								</div>
								<div>
									<div class="font-bold text-text">
										{registration.referrer_first_name}
										{registration.referrer_last_name}
									</div>
									<div class="text-xs text-text-muted">{registration.referrer_organization}</div>
								</div>
							</div>
							<div class="space-y-2 border-t border-border/50 pt-3 text-sm">
								<div class="flex items-center gap-2 text-text-muted">
									<Briefcase class="h-3.5 w-3.5" />
									{m.job_title()}: {registration.referrer_job_title}
								</div>
								<a
									href="mailto:{registration.referrer_email}"
									class="flex items-center gap-2 text-text-muted transition-colors hover:text-brand"
								>
									<Mail class="h-3.5 w-3.5" />
									{registration.referrer_email}
								</a>
								<a
									href="tel:{registration.referrer_phone_number}"
									class="flex items-center gap-2 text-text-muted transition-colors hover:text-brand"
								>
									<Phone class="h-3.5 w-3.5" />
									{registration.referrer_phone_number}
								</a>
							</div>
						</div>

						<!-- Guardian Details -->
						<div class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
							<h3 class="mb-4 flex items-center gap-2 text-base font-bold text-text">
								<User class="h-4 w-4 text-text-subtle" />
								{m.guardian()}
							</h3>
							<div class="space-y-3 text-sm">
								<div class="flex items-center justify-between">
									<div class="font-medium text-text">
										{registration.guardian1_first_name}
										{registration.guardian1_last_name}
									</div>
									<span
										class="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-zinc-500 uppercase dark:bg-zinc-800"
									>
										{registration.guardian1_relationship}
									</span>
								</div>
								<div class="space-y-2 border-t border-border/50 pt-2 text-text-muted">
									<a
										href="tel:{registration.guardian1_phone_number}"
										class="flex items-center gap-2 hover:text-brand"
										><Phone class="h-3.5 w-3.5" /> {registration.guardian1_phone_number}</a
									>
									<a
										href="mailto:{registration.guardian1_email}"
										class="flex items-center gap-2 hover:text-brand"
										><Mail class="h-3.5 w-3.5" /> {registration.guardian1_email}</a
									>
								</div>
							</div>

							{#if registration.guardian2_first_name}
								<div class="mt-4 space-y-3 border-t border-border/50 pt-4">
									<div class="flex items-center justify-between">
										<div class="font-medium text-text">
											{registration.guardian2_first_name}
											{registration.guardian2_last_name}
										</div>
										<span
											class="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-zinc-500 uppercase dark:bg-zinc-800"
										>
											{registration.guardian2_relationship}
										</span>
									</div>
									<div class="space-y-2 text-text-muted">
										<a
											href="tel:{registration.guardian2_phone_number}"
											class="flex items-center gap-2 hover:text-brand"
											><Phone class="h-3.5 w-3.5" /> {registration.guardian2_phone_number}</a
										>
										<a
											href="mailto:{registration.guardian2_email}"
											class="flex items-center gap-2 hover:text-brand"
											><Mail class="h-3.5 w-3.5" /> {registration.guardian2_email}</a
										>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<Toast
				message={toast?.message ?? null}
				type={toast?.type ?? 'success'}
				onClose={closeToast}
			/>
		</div>
	{/if}
{/await}
