<script lang="ts">
	import {
		User,
		Sun,
		Sunset,
		Moon,
		ClipboardList,
		UserRound,
		GitBranch,
		BookOpen,
		MoreHorizontal,
		Meh,
		Zap,
		Smile,
		Frown,
		Angry,
		AlertCircle,
		CloudRain,
		Calendar,
		Pencil,
		Trash2
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import RichTextEditor from '$lib/components/ui/RichTextEditor.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import type {
		ProgressReportType,
		EmotionalState,
		GetProgressReportResponse,
		UpdateProgressReportRequest
	} from '$lib/types/api/clients';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';

	interface EditableReportForm {
		title: string;
		date: string;
		report_text: string;
		type: ProgressReportType;
		emotional_state: EmotionalState;
	}

	let {
		open = $bindable(false),
		report = null,
		loading = false,
		actionLoading = false,
		loadError = null,
		startInEditMode = false,
		onUpdate,
		onDelete
	} = $props<{
		open?: boolean;
		report?: GetProgressReportResponse | null;
		loading?: boolean;
		actionLoading?: boolean;
		loadError?: string | null;
		startInEditMode?: boolean;
		onUpdate?: (payload: UpdateProgressReportRequest) => Promise<void>;
		onDelete?: () => Promise<void>;
	}>();

	const typeMeta: Record<ProgressReportType, { label: string; icon: any; className: string }> = {
		morning_report: {
			label: m.morning_report(),
			icon: Sun,
			className: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
		},
		evening_report: {
			label: m.evening_report(),
			icon: Sunset,
			className: 'bg-secondary/10 text-secondary border-secondary/20'
		},
		night_report: {
			label: m.night_report(),
			icon: Moon,
			className: 'bg-indigo-600/10 text-indigo-600 border-indigo-600/20'
		},
		shift_report: {
			label: m.shift_report(),
			icon: ClipboardList,
			className: 'bg-slate-600/10 text-slate-600 border-slate-600/20'
		},
		one_to_one_report: {
			label: m.one_to_one_report(),
			icon: UserRound,
			className: 'bg-indigo-600/10 text-indigo-600 border-indigo-600/20'
		},
		process_report: {
			label: m.process_report(),
			icon: GitBranch,
			className: 'bg-blue-600/10 text-blue-600 border-blue-600/20'
		},
		contact_journal: {
			label: m.contact_journal(),
			icon: BookOpen,
			className: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20'
		},
		other: {
			label: m.other(),
			icon: MoreHorizontal,
			className: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20'
		}
	};

	const emotionalStateMeta: Record<
		EmotionalState,
		{ label: string; icon: any; colorClass: string; bgClass: string }
	> = {
		normal: {
			label: m.normal(),
			icon: Meh,
			colorClass: 'text-zinc-600 dark:text-zinc-400',
			bgClass: 'bg-zinc-100 dark:bg-zinc-800'
		},
		excited: {
			label: m.excited(),
			icon: Zap,
			colorClass: 'text-indigo-600 dark:text-indigo-400',
			bgClass: 'bg-indigo-50 dark:bg-indigo-500/10'
		},
		happy: {
			label: m.happy(),
			icon: Smile,
			colorClass: 'text-emerald-600 dark:text-emerald-400',
			bgClass: 'bg-emerald-50 dark:bg-emerald-500/10'
		},
		sad: {
			label: m.sad(),
			icon: Frown,
			colorClass: 'text-blue-600 dark:text-blue-400',
			bgClass: 'bg-blue-50 dark:bg-blue-500/10'
		},
		angry: {
			label: m.angry(),
			icon: Angry,
			colorClass: 'text-rose-600 dark:text-rose-400',
			bgClass: 'bg-rose-50 dark:bg-rose-500/10'
		},
		anxious: {
			label: m.anxious(),
			icon: AlertCircle,
			colorClass: 'text-secondary dark:text-secondary',
			bgClass: 'bg-secondary dark:bg-secondary/10'
		},
		depressed: {
			label: m.depressed(),
			icon: CloudRain,
			colorClass: 'text-indigo-600 dark:text-indigo-400',
			bgClass: 'bg-indigo-50 dark:bg-indigo-500/10'
		}
	};

	const typeOptions = (
		Object.entries(typeMeta) as Array<[ProgressReportType, { label: string }]>
	).map(([value, meta]) => ({ value, label: meta.label }));
	const emotionalStateOptions = (
		Object.entries(emotionalStateMeta) as Array<[EmotionalState, { label: string }]>
	).map(([value, meta]) => ({ value, label: meta.label }));

	const resolveTypeMeta = (value: unknown) => {
		if (typeof value === 'string' && value in typeMeta) {
			return typeMeta[value as ProgressReportType];
		}
		return typeMeta.other;
	};

	const resolveEmotionalStateMeta = (value: unknown) => {
		if (typeof value === 'string' && value in emotionalStateMeta) {
			return emotionalStateMeta[value as EmotionalState];
		}
		return emotionalStateMeta.normal;
	};

	const createInitialForm = (): EditableReportForm => ({
		title: '',
		date: new Date().toISOString(),
		report_text: '',
		type: 'other',
		emotional_state: 'normal'
	});

	let isEditing = $state(false);
	let actionError = $state<string | null>(null);
	let formData = $state<EditableReportForm>(createInitialForm());

	const syncFormFromReport = (source: GetProgressReportResponse) => {
		formData = {
			title: source.title ?? '',
			date: source.date,
			report_text: source.report_text,
			type: source.type,
			emotional_state: source.emotional_state
		};
	};

	$effect(() => {
		if (open && report) {
			syncFormFromReport(report);
			isEditing = startInEditMode;
			actionError = null;
		}
	});

	let typeInfo = $derived(report ? resolveTypeMeta(report.type) : typeMeta.other);
	let emotionInfo = $derived(
		report ? resolveEmotionalStateMeta(report.emotional_state) : emotionalStateMeta.normal
	);

	const resolveLocale = () => (getLocale() === 'nl' ? 'nl-NL' : 'en-GB');

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat(resolveLocale(), {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	};

	const saveChanges = async () => {
		if (!report || !onUpdate || actionLoading) return;
		actionError = null;
		try {
			await onUpdate({
				client_id: report.client_id,
				employee_id: report.employee_id,
				title: formData.title.trim() ? formData.title.trim() : null,
				date: formData.date,
				report_text: formData.report_text.trim() ? formData.report_text : null,
				type: formData.type,
				emotional_state: formData.emotional_state
			});
			isEditing = false;
		} catch (error) {
			actionError = error instanceof Error ? error.message : m.failed_update_progress_report();
		}
	};

	const requestDelete = async () => {
		if (!report || !onDelete || actionLoading) return;
		if (!confirm(m.delete_progress_report_confirm())) return;
		actionError = null;
		try {
			await onDelete();
		} catch (error) {
			actionError = error instanceof Error ? error.message : m.failed_delete_progress_report();
		}
	};

	const cancelEdit = () => {
		if (!report || actionLoading) return;
		syncFormFromReport(report);
		actionError = null;
		isEditing = false;
	};
</script>

<Modal
	bind:open
	title={report?.title ?? (loading ? m.loading_progress_report() : m.progress_report())}
	description={isEditing ? m.edit_report_details() : m.review_client_documentation()}
	size="2xl"
>
	<div class="space-y-6">
		{#if loadError}
			<div
				class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200"
			>
				<p class="font-semibold">{m.could_not_load_progress_report()}</p>
				<p class="mt-1 text-xs opacity-90">{loadError}</p>
			</div>
		{/if}

		{#if actionError}
			<div
				class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200"
			>
				{actionError}
			</div>
		{/if}

		{#if loading}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="rounded-2xl border border-border bg-zinc-50/50 p-4 dark:bg-zinc-800/50">
					<div class="mb-4 h-3 w-28 animate-pulse rounded bg-border"></div>
					<div class="space-y-3">
						<div class="h-10 w-full animate-pulse rounded-xl bg-border/60"></div>
						<div class="h-10 w-full animate-pulse rounded-xl bg-border/60"></div>
					</div>
				</div>
				<div class="rounded-2xl border border-border bg-zinc-50/50 p-4 dark:bg-zinc-800/50">
					<div class="mb-4 h-3 w-28 animate-pulse rounded bg-border"></div>
					<div class="space-y-3">
						<div class="h-9 w-44 animate-pulse rounded-xl bg-border/60"></div>
						<div class="h-9 w-44 animate-pulse rounded-xl bg-border/60"></div>
					</div>
				</div>
			</div>
		{:else if report && isEditing}
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<div class="space-y-5">
					<Input
						label={m.report_title()}
						placeholder={m.report_title_placeholder()}
						bind:value={formData.title}
					/>

					<DateTimePicker label={m.date_time()} bind:value={formData.date} />

					<div class="rounded-2xl border border-border bg-zinc-50/50 p-4 dark:bg-zinc-800/50">
						<p class="text-xs font-bold tracking-wider text-text-muted uppercase">
							{m.reporter()}
						</p>
						<p class="mt-2 text-sm font-semibold text-text">
							{#if report.employee_first_name || report.employee_last_name}
								{report.employee_first_name} {report.employee_last_name}
							{:else}
								<span class="text-text-muted italic">{m.system_unknown()}</span>
							{/if}
						</p>
					</div>
				</div>

				<div class="space-y-5">
					<Select
						label={m.report_type()}
						bind:value={formData.type}
						options={typeOptions}
						placeholder={m.select_report_type()}
					/>

					<Select
						label={m.emotional_state()}
						bind:value={formData.emotional_state}
						options={emotionalStateOptions}
						placeholder={m.select_emotional_state()}
					/>
				</div>
			</div>

			<RichTextEditor label={m.report_content()} bind:value={formData.report_text} />
		{:else if report}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="rounded-2xl border border-border bg-zinc-50/50 p-4 dark:bg-zinc-800/50">
					<p class="mb-4 text-xs font-bold tracking-wider text-text-muted uppercase">
						{m.report_details()}
					</p>
					<div class="space-y-4">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface"
							>
								<Calendar class="h-4 w-4 text-text-muted" />
							</div>
							<div>
								<p class="text-xs font-medium text-text-muted">{m.date_time()}</p>
								<p class="text-sm font-semibold text-text">{formatDate(report.date)}</p>
							</div>
						</div>

						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20"
							>
								{#if report.employee_profile_picture}
									<img
										alt=""
										src={report.employee_profile_picture}
										class="h-full w-full object-cover"
									/>
								{:else}
									<User class="h-4 w-4" />
								{/if}
							</div>
							<div>
								<p class="text-xs font-medium text-text-muted">{m.reporter()}</p>
								<p class="text-sm font-semibold text-text">
									{#if report.employee_first_name || report.employee_last_name}
										{report.employee_first_name} {report.employee_last_name}
									{:else}
										<span class="text-text-muted italic">{m.system_unknown()}</span>
									{/if}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div class="rounded-2xl border border-border bg-zinc-50/50 p-4 dark:bg-zinc-800/50">
					<p class="mb-4 text-xs font-bold tracking-wider text-text-muted uppercase">
						{m.classification()}
					</p>
					<div class="space-y-4">
						<div class="flex items-center gap-3">
							<div
								class="flex items-center gap-2 rounded-xl border px-3 py-1.5 {typeInfo.className}"
							>
								<typeInfo.icon class="h-4 w-4" />
								<span class="text-sm font-semibold">{typeInfo.label}</span>
							</div>
						</div>

						<div class="flex items-center gap-3">
							<div
								class="flex items-center gap-2 rounded-xl px-3 py-1.5 ring-1 ring-zinc-200 ring-inset dark:ring-zinc-700 {emotionInfo.bgClass} {emotionInfo.colorClass}"
							>
								<emotionInfo.icon class="h-4 w-4" />
								<span class="text-sm font-semibold">{emotionInfo.label}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="overflow-hidden rounded-3xl border border-border bg-surface">
				<div class="border-b border-border bg-zinc-50/50 px-5 py-3 dark:bg-zinc-800/50">
					<h3 class="text-sm font-bold tracking-tight text-text">{m.report_content()}</h3>
				</div>
				<div class="p-5">
					<div
						class="space-y-2 text-sm text-text [&>blockquote]:my-2 [&>blockquote]:border-l-4 [&>blockquote]:border-border [&>blockquote]:pl-4 [&>blockquote]:text-text-muted [&>blockquote]:italic [&>ol]:ml-4 [&>ol]:list-decimal [&>ul]:ml-4 [&>ul]:list-disc"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html report.report_text}
					</div>
				</div>
			</div>
		{:else}
			<div class="rounded-3xl border border-border bg-surface p-6 text-sm text-text-muted">
				{m.select_progress_report_prompt()}
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex items-center justify-between gap-3">
			{#if report}
				<Button
					variant="secondary"
					class="text-rose-600"
					disabled={actionLoading || loading}
					onclick={requestDelete}
				>
					<Trash2 class="h-4 w-4" />
					{m.delete()}
				</Button>
			{:else}
				<span></span>
			{/if}

			<div class="flex justify-end gap-3">
				{#if report && isEditing}
					<Button variant="secondary" disabled={actionLoading || loading} onclick={cancelEdit}>
						{m.cancel()}
					</Button>
					<Button disabled={actionLoading || loading} onclick={saveChanges}>
						{m.save_changes()}
					</Button>
				{:else if report}
					<Button
						variant="secondary"
						disabled={actionLoading || loading}
						onclick={() => (open = false)}
					>
						{m.close()}
					</Button>
					<Button disabled={actionLoading || loading} onclick={() => (isEditing = true)}>
						<Pencil class="h-4 w-4" />
						{m.edit()}
					</Button>
				{:else}
					<Button variant="secondary" onclick={() => (open = false)}>{m.close()}</Button>
				{/if}
			</div>
		</div>
	{/snippet}
</Modal>
