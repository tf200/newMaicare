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
			label: 'Morning Report',
			icon: Sun,
			className: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
		},
		evening_report: {
			label: 'Evening Report',
			icon: Sunset,
			className: 'bg-orange-500/10 text-orange-600 border-orange-500/20'
		},
		night_report: {
			label: 'Night Report',
			icon: Moon,
			className: 'bg-indigo-600/10 text-indigo-600 border-indigo-600/20'
		},
		shift_report: {
			label: 'Shift Report',
			icon: ClipboardList,
			className: 'bg-slate-600/10 text-slate-600 border-slate-600/20'
		},
		one_to_one_report: {
			label: '1-on-1 Report',
			icon: UserRound,
			className: 'bg-teal-600/10 text-teal-600 border-teal-600/20'
		},
		process_report: {
			label: 'Process Report',
			icon: GitBranch,
			className: 'bg-blue-600/10 text-blue-600 border-blue-600/20'
		},
		contact_journal: {
			label: 'Contact Journal',
			icon: BookOpen,
			className: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20'
		},
		other: {
			label: 'Other',
			icon: MoreHorizontal,
			className: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20'
		}
	};

	const emotionalStateMeta: Record<
		EmotionalState,
		{ label: string; icon: any; colorClass: string; bgClass: string }
	> = {
		normal: {
			label: 'Normal',
			icon: Meh,
			colorClass: 'text-zinc-600 dark:text-zinc-400',
			bgClass: 'bg-zinc-100 dark:bg-zinc-800'
		},
		excited: {
			label: 'Excited',
			icon: Zap,
			colorClass: 'text-teal-600 dark:text-teal-400',
			bgClass: 'bg-teal-50 dark:bg-teal-500/10'
		},
		happy: {
			label: 'Happy',
			icon: Smile,
			colorClass: 'text-emerald-600 dark:text-emerald-400',
			bgClass: 'bg-emerald-50 dark:bg-emerald-500/10'
		},
		sad: {
			label: 'Sad',
			icon: Frown,
			colorClass: 'text-blue-600 dark:text-blue-400',
			bgClass: 'bg-blue-50 dark:bg-blue-500/10'
		},
		angry: {
			label: 'Angry',
			icon: Angry,
			colorClass: 'text-rose-600 dark:text-rose-400',
			bgClass: 'bg-rose-50 dark:bg-rose-500/10'
		},
		anxious: {
			label: 'Anxious',
			icon: AlertCircle,
			colorClass: 'text-orange-600 dark:text-orange-400',
			bgClass: 'bg-orange-50 dark:bg-orange-500/10'
		},
		depressed: {
			label: 'Depressed',
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

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('en-GB', {
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
			actionError = error instanceof Error ? error.message : 'Failed to update progress report';
		}
	};

	const requestDelete = async () => {
		if (!report || !onDelete || actionLoading) return;
		if (!confirm('Delete this progress report? This action cannot be undone.')) return;
		actionError = null;
		try {
			await onDelete();
		} catch (error) {
			actionError = error instanceof Error ? error.message : 'Failed to delete progress report';
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
	title={report?.title ?? (loading ? 'Loading progress report...' : 'Progress Report')}
	description={isEditing ? 'Edit report details.' : 'Review client documentation.'}
	size="2xl"
>
	<div class="space-y-6">
		{#if loadError}
			<div
				class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200"
			>
				<p class="font-semibold">Couldn't load progress report</p>
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
						label="Report Title"
						placeholder="Brief title (optional)"
						bind:value={formData.title}
					/>

					<DateTimePicker label="Date & Time" bind:value={formData.date} />

					<div class="rounded-2xl border border-border bg-zinc-50/50 p-4 dark:bg-zinc-800/50">
						<p class="text-xs font-bold tracking-wider text-text-muted uppercase">Reporter</p>
						<p class="mt-2 text-sm font-semibold text-text">
							{#if report.employee_first_name || report.employee_last_name}
								{report.employee_first_name} {report.employee_last_name}
							{:else}
								<span class="text-text-muted italic">System / Unknown</span>
							{/if}
						</p>
					</div>
				</div>

				<div class="space-y-5">
					<Select
						label="Report Type"
						bind:value={formData.type}
						options={typeOptions}
						placeholder="Select report type..."
					/>

					<Select
						label="Emotional State"
						bind:value={formData.emotional_state}
						options={emotionalStateOptions}
						placeholder="Select emotional state..."
					/>
				</div>
			</div>

			<RichTextEditor label="Report Content" bind:value={formData.report_text} />
		{:else if report}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="rounded-2xl border border-border bg-zinc-50/50 p-4 dark:bg-zinc-800/50">
					<p class="mb-4 text-xs font-bold tracking-wider text-text-muted uppercase">
						Report Details
					</p>
					<div class="space-y-4">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface"
							>
								<Calendar class="h-4 w-4 text-text-muted" />
							</div>
							<div>
								<p class="text-xs font-medium text-text-muted">Date & Time</p>
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
								<p class="text-xs font-medium text-text-muted">Reporter</p>
								<p class="text-sm font-semibold text-text">
									{#if report.employee_first_name || report.employee_last_name}
										{report.employee_first_name} {report.employee_last_name}
									{:else}
										<span class="text-text-muted italic">System / Unknown</span>
									{/if}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div class="rounded-2xl border border-border bg-zinc-50/50 p-4 dark:bg-zinc-800/50">
					<p class="mb-4 text-xs font-bold tracking-wider text-text-muted uppercase">
						Classification
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
					<h3 class="text-sm font-bold tracking-tight text-text">Report Content</h3>
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
				Select a progress report to view its details.
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
					Delete
				</Button>
			{:else}
				<span></span>
			{/if}

			<div class="flex justify-end gap-3">
				{#if report && isEditing}
					<Button variant="secondary" disabled={actionLoading || loading} onclick={cancelEdit}>
						Cancel
					</Button>
					<Button disabled={actionLoading || loading} onclick={saveChanges}>Save Changes</Button>
				{:else if report}
					<Button
						variant="secondary"
						disabled={actionLoading || loading}
						onclick={() => (open = false)}
					>
						Close
					</Button>
					<Button disabled={actionLoading || loading} onclick={() => (isEditing = true)}>
						<Pencil class="h-4 w-4" />
						Edit
					</Button>
				{:else}
					<Button variant="secondary" onclick={() => (open = false)}>Close</Button>
				{/if}
			</div>
		</div>
	{/snippet}
</Modal>
