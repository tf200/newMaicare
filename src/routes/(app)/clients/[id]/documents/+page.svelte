<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { m } from '$lib/paraglide/messages';
	import {
		generateClientAppointmentCardDocument,
		upsertClientAppointmentCard
	} from '$lib/api/clients';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import type { UpdateAppointmentCardRequest } from '$lib/types/api';
	import {
		Briefcase,
		BusFront,
		ClipboardList,
		Contact,
		FileText,
		GraduationCap,
		House,
		ShieldCheck,
		UserRoundCheck,
		Users
	} from 'lucide-svelte';
	import type { AppointmentCardLoadResult, AppointmentCardDocument } from './+page';
	import { getBreadcrumbsState } from '$lib/state/breadcrumbs.svelte';

	type AppointmentSectionKey =
		| 'general_information'
		| 'important_contacts'
		| 'household_info'
		| 'organization_agreements'
		| 'youth_officer_agreements'
		| 'treatment_agreements'
		| 'smoking_rules'
		| 'work'
		| 'school_internship'
		| 'travel'
		| 'leave';

	interface AppointmentSection {
		key: AppointmentSectionKey;
		title: string;
		description: string;
		icon: typeof ClipboardList;
	}

	let { data } = $props<{
		data: {
			appointmentCardData: Promise<AppointmentCardLoadResult>;
			clientName?: string;
		};
	}>();

	const appointmentCardDataPromise = $derived(data.appointmentCardData);

	const breadcrumbs = getBreadcrumbsState();
	$effect(() => {
		appointmentCardDataPromise.then((res: AppointmentCardLoadResult) => {
			if (res.appointmentCard) {
				breadcrumbs.items = [
					{ label: m.breadcrumb_home(), href: '/dashboard' },
					{ label: m.clients(), href: '/clients' },
					{
						label: data.clientName ?? m.breadcrumb_client_detail(),
						href: `/clients/${res.appointmentCard.client_id}`
					},
					{ label: m.documents() }
				];
			}
		});
		return () => {
			breadcrumbs.items = [];
		};
	});

	const sections: AppointmentSection[] = [
		{
			key: 'general_information',
			title: m.general_information(),
			description: m.general_information_desc(),
			icon: ClipboardList
		},
		{
			key: 'important_contacts',
			title: m.important_contacts(),
			description: m.important_contacts_desc(),
			icon: Contact
		},
		{
			key: 'household_info',
			title: m.household_info(),
			description: m.household_info_desc(),
			icon: House
		},
		{
			key: 'organization_agreements',
			title: m.organization_agreements(),
			description: m.organization_agreements_desc(),
			icon: FileText
		},
		{
			key: 'youth_officer_agreements',
			title: m.youth_officer_agreements(),
			description: m.youth_officer_agreements_desc(),
			icon: UserRoundCheck
		},
		{
			key: 'treatment_agreements',
			title: m.treatment_agreements(),
			description: m.treatment_agreements_desc(),
			icon: ShieldCheck
		},
		{
			key: 'smoking_rules',
			title: m.smoking_rules(),
			description: m.smoking_rules_desc(),
			icon: Users
		},
		{
			key: 'work',
			title: m.work_section(),
			description: m.work_section_desc(),
			icon: Briefcase
		},
		{
			key: 'school_internship',
			title: m.school_internship(),
			description: m.school_internship_desc(),
			icon: GraduationCap
		},
		{
			key: 'travel',
			title: m.travel(),
			description: m.travel_desc(),
			icon: BusFront
		},
		{
			key: 'leave',
			title: m.leave(),
			description: m.leave_desc(),
			icon: UserRoundCheck
		}
	];

	const emptyDraft = () =>
		Object.fromEntries(sections.map((section) => [section.key, ''])) as Record<
			AppointmentSectionKey,
			string
		>;

	const toDraft = (card: AppointmentCardDocument) =>
		Object.fromEntries(
			sections.map((section) => [section.key, card[section.key].join('\n')])
		) as Record<AppointmentSectionKey, string>;

	const parseLines = (value: string) =>
		value
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);

	const toPayload = (
		draft: Record<AppointmentSectionKey, string>
	): UpdateAppointmentCardRequest => ({
		general_information: parseLines(draft.general_information),
		important_contacts: parseLines(draft.important_contacts),
		household_info: parseLines(draft.household_info),
		organization_agreements: parseLines(draft.organization_agreements),
		youth_officer_agreements: parseLines(draft.youth_officer_agreements),
		treatment_agreements: parseLines(draft.treatment_agreements),
		smoking_rules: parseLines(draft.smoking_rules),
		work: parseLines(draft.work),
		school_internship: parseLines(draft.school_internship),
		travel: parseLines(draft.travel),
		leave: parseLines(draft.leave)
	});

	const countDraftItems = (value: string) => parseLines(value).length;

	let draftText = $state<Record<AppointmentSectionKey, string>>(emptyDraft());
	let isEditing = $state(false);
	let isGenerating = $state(false);
	let isSaving = $state(false);
	let generationMessage = $state<string | null>(null);
	let generationError = $state<string | null>(null);
	let saveError = $state<string | null>(null);

	const formatTimestamp = (value: string | null) => {
		if (!value) return m.not_available();
		return new Intl.DateTimeFormat('nl-NL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(value));
	};

	const startEditing = (card: AppointmentCardDocument) => {
		draftText = toDraft(card);
		saveError = null;
		isEditing = true;
	};

	const discardChanges = (card: AppointmentCardDocument) => {
		draftText = toDraft(card);
		saveError = null;
		isEditing = false;
	};

	const saveChanges = async (clientId: string) => {
		isSaving = true;
		saveError = null;
		generationMessage = null;

		try {
			await upsertClientAppointmentCard(clientId, toPayload(draftText));
			isEditing = false;
			generationMessage = m.appointment_card_saved();
			await invalidateAll();
		} catch (error) {
			saveError = error instanceof Error ? error.message : m.failed_save_appointment_card();
		} finally {
			isSaving = false;
		}
	};

	const getFilenameFromHeader = (contentDisposition: string | null) => {
		if (!contentDisposition) return 'appointment_card.pdf';
		const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
		if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);
		const basicMatch = contentDisposition.match(/filename="([^"]+)"/i);
		if (basicMatch?.[1]) return basicMatch[1];
		return 'appointment_card.pdf';
	};

	const generateDocument = async (clientId: string) => {
		isGenerating = true;
		generationError = null;
		generationMessage = null;

		try {
			const response = await generateClientAppointmentCardDocument(clientId);
			const filename = getFilenameFromHeader(response.headers.get('content-disposition'));
			const objectUrl = URL.createObjectURL(response.blob);

			const anchor = document.createElement('a');
			anchor.href = objectUrl;
			anchor.download = filename;
			document.body.append(anchor);
			anchor.click();
			anchor.remove();
			URL.revokeObjectURL(objectUrl);

			generationMessage = `Downloaded ${filename}`;
		} catch (error) {
			generationError =
				error instanceof Error ? error.message : 'Failed to download appointment card.';
		} finally {
			isGenerating = false;
		}
	};
</script>

<svelte:head>
	<title>{m.appointment_card()} | MaiCare</title>
</svelte:head>

{#await appointmentCardDataPromise}
	<div class="space-y-4">
		<div class="h-8 w-52 animate-pulse rounded bg-border/70"></div>
		<div class="h-[420px] animate-pulse rounded-3xl border border-border bg-surface"></div>
	</div>
{:then appointmentCardData}
	{@const appointmentCard = appointmentCardData.appointmentCard}
	<section class="space-y-6 pb-12">
		<header
			class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
		>
			<div
				class="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-linear-to-br from-indigo-200/60 to-emerald-200/20 blur-2xl"
			></div>
			<div class="relative space-y-4">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div class="space-y-2">
						<div class="hidden"></div>
						<div class="flex items-center gap-3 text-sm font-semibold text-brand">
							<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
								<ClipboardList class="h-5 w-5" />
							</span>
							<span>{m.client_documentation()}</span>
						</div>
						<h1 class="text-3xl font-bold tracking-tighter text-text">{m.appointment_card()}</h1>
						<p class="max-w-2xl text-sm font-medium text-text-muted">
							{m.appointment_card_description()}
						</p>
					</div>
					<div class="flex flex-wrap gap-2">
						{#if !isEditing}
							<Button
								variant="ghost"
								class="border border-border"
								onclick={() => startEditing(appointmentCard)}>{m.edit_card()}</Button
							>
						{/if}
						<Button
							variant="secondary"
							isLoading={isGenerating}
							onclick={() => generateDocument(appointmentCard.client_id)}
						>
							>{m.generate_document()}</Button
						>
					</div>
				</div>
				<div class="flex flex-wrap items-center gap-2 text-xs font-semibold">
					<span class="rounded-full border border-border bg-bg px-3 py-1 text-text-muted"
						>{m.client()}: {appointmentCard.client_id}</span
					>
					<span class="rounded-full border border-border bg-bg px-3 py-1 text-text-muted"
						>{m.created()}: {formatTimestamp(appointmentCard.created_at)}</span
					>
					<span class="rounded-full border border-border bg-bg px-3 py-1 text-text-muted"
						>{m.updated()}: {formatTimestamp(appointmentCard.updated_at)}</span
					>
				</div>
			</div>
		</header>

		{#if appointmentCardData.loadError}
			<InlineErrorBanner message={appointmentCardData.loadError} onRetry={() => invalidateAll()} />
		{/if}

		{#if saveError}
			<InlineErrorBanner
				message={saveError}
				onRetry={() => saveChanges(appointmentCard.client_id)}
			/>
		{/if}

		{#if generationError}
			<InlineErrorBanner
				message={generationError}
				onRetry={() => generateDocument(appointmentCard.client_id)}
			/>
		{/if}

		{#if generationMessage}
			<div
				class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
			>
				{generationMessage}
			</div>
		{/if}

		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{#each sections as section (section.key)}
				<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
					<div class="mb-4 flex items-start justify-between gap-3">
						<div>
							<div class="mb-1 flex items-center gap-2 text-sm font-bold text-text">
								<section.icon class="h-4 w-4 text-brand" />
								<span>{section.title}</span>
							</div>
							<p class="text-xs font-medium text-text-muted">{section.description}</p>
						</div>
						<span class="rounded-full bg-brand/10 px-2 py-1 text-xs font-semibold text-brand"
							>{isEditing
								? countDraftItems(draftText[section.key])
								: appointmentCard[section.key].length}
							{m.items()}</span
						>
					</div>

					{#if isEditing}
						<Textarea
							bind:value={draftText[section.key]}
							rows={7}
							placeholder={m.one_line_per_bullet()}
						/>
					{:else if appointmentCard[section.key].length > 0}
						<ul class="space-y-2">
							{#each appointmentCard[section.key] as item, index (`${section.key}-${index}`)}
								<li class="rounded-xl bg-bg px-3 py-2 text-sm text-text">{item}</li>
							{/each}
						</ul>
					{:else}
						<p class="rounded-xl bg-bg px-3 py-2 text-sm text-text-muted">
							{m.no_info_added()}
						</p>
					{/if}
				</div>
			{/each}
		</div>

		{#if isEditing}
			<div class="sticky bottom-4 z-10 flex justify-end">
				<div
					class="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 shadow-sm"
				>
					<Button
						variant="ghost"
						class="border border-border"
						onclick={() => discardChanges(appointmentCard)}>{m.discard()}</Button
					>
					<Button isLoading={isSaving} onclick={() => saveChanges(appointmentCard.client_id)}
						>{m.save_changes()}</Button
					>
				</div>
			</div>
		{/if}
	</section>
{/await}
