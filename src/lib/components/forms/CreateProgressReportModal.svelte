<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import {
		Plus,
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
		CloudRain
	} from 'lucide-svelte';
	import { createClientProgressReport } from '$lib/api/clients';
	import { listEmployees, type EmployeeListItem } from '$lib/api/employees';
	import Button from '$lib/components/ui/Button.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import RichTextEditor from '$lib/components/ui/RichTextEditor.svelte';
	import type {
		ProgressReportType,
		EmotionalState,
		CreateProgressReportRequest
	} from '$lib/types/api/clients';
	import {
		ProgressReportSchema,
		type ProgressReportSchemaInput
	} from '$lib/schemas/progress-report';
	import { formatFormError } from '$lib/utils/form-errors';
	import { trimToUndefined } from '$lib/utils/form-values';
	import { m } from '$lib/paraglide/messages';

	let {
		open = $bindable(false),
		preselectedClientId = null,
		onCreated
	} = $props<{
		open?: boolean;
		preselectedClientId?: string | null;
		onCreated?: () => void;
	}>();

	let employeeDisplay = $state('');
	let errorMessage = $state('');
	const formId = 'create-progress-report-form';

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				type: 'morning_report',
				emotional_state: 'normal',
				date: new Date().toISOString(),
				title: '',
				report_text: '',
				employee_id: ''
			} as unknown as ProgressReportSchemaInput,
			valibotClient(ProgressReportSchema)
		),
		{
			validators: valibotClient(ProgressReportSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid && preselectedClientId) {
					try {
						const payload: CreateProgressReportRequest = {
							employee_id: trimToUndefined(form.data.employee_id),
							title: trimToUndefined(form.data.title) ?? null,
							date: form.data.date,
							report_text: form.data.report_text,
							type: form.data.type,
							emotional_state: form.data.emotional_state
						};

						await createClientProgressReport(preselectedClientId, payload);
						reset();
						open = false;
						onCreated?.();
					} catch (error) {
						errorMessage =
							error instanceof Error ? error.message : m.failed_create_progress_report();
					}
				}
			}
		}
	);

	const typeOptions: Array<{ value: ProgressReportType; label: string; icon: typeof Sun }> = [
		{ value: 'morning_report', label: m.morning_report(), icon: Sun },
		{ value: 'evening_report', label: m.evening_report(), icon: Sunset },
		{ value: 'night_report', label: m.night_report(), icon: Moon },
		{ value: 'shift_report', label: m.shift_report(), icon: ClipboardList },
		{ value: 'one_to_one_report', label: m.one_to_one_report(), icon: UserRound },
		{ value: 'process_report', label: m.process_report(), icon: GitBranch },
		{ value: 'contact_journal', label: m.contact_journal(), icon: BookOpen },
		{ value: 'other', label: m.other(), icon: MoreHorizontal }
	];

	const emotionalStateOptions: Array<{ value: EmotionalState; label: string; icon: typeof Meh }> = [
		{ value: 'normal', label: m.normal(), icon: Meh },
		{ value: 'excited', label: m.excited(), icon: Zap },
		{ value: 'happy', label: m.happy(), icon: Smile },
		{ value: 'sad', label: m.sad(), icon: Frown },
		{ value: 'angry', label: m.angry(), icon: Angry },
		{ value: 'anxious', label: m.anxious(), icon: AlertCircle },
		{ value: 'depressed', label: m.depressed(), icon: CloudRain }
	];

	const handleCancel = () => {
		reset();
		open = false;
	};

	const loadEmployees = async (query: string) => {
		const res = await listEmployees({ page: 1, pageSize: 50, search: query });
		return res.data.results;
	};
</script>

{#snippet employeeItem(employee: EmployeeListItem)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{employee.first_name} {employee.last_name}</span>
		<span class="text-xs text-text-muted">{m.bsn()}: {employee.bsn}</span>
	</div>
{/snippet}

<Modal
	bind:open
	title={m.create_progress_report()}
	description={m.create_progress_report_description()}
	size="2xl"
>
	<form id={formId} use:enhance class="space-y-6">
		{#if errorMessage}
			<div
				class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400"
			>
				{errorMessage}
			</div>
		{/if}

		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<div class="space-y-5">
				<Input
					label={m.report_title()}
					placeholder={m.report_title_placeholder()}
					bind:value={$form.title}
					error={formatFormError($errors.title)}
				/>

				<DateTimePicker
					label={m.date_time()}
					bind:value={$form.date}
					error={formatFormError($errors.date)}
				/>

				<SearchSelect
					label={m.reporter_employee()}
					loadOptions={loadEmployees}
					bind:value={$form.employee_id}
					bind:displayValue={employeeDisplay}
					item={employeeItem}
					labelFn={(employee) => `${employee.first_name} ${employee.last_name}`}
					valueFn={(employee) => employee.id}
					placeholder={m.search_employee_placeholder()}
					error={formatFormError($errors.employee_id)}
				/>
			</div>

			<div class="space-y-5">
				<Select
					label={m.report_type()}
					bind:value={$form.type}
					options={typeOptions}
					placeholder={m.select_report_type()}
					error={formatFormError($errors.type)}
				/>

				<Select
					label={m.emotional_state()}
					bind:value={$form.emotional_state}
					options={emotionalStateOptions}
					placeholder={m.select_emotional_state()}
					error={formatFormError($errors.emotional_state)}
				/>

				<div class="rounded-2xl border border-border bg-zinc-50/50 p-4 dark:bg-zinc-800/50">
					<p class="text-xs font-bold tracking-wider text-text-muted uppercase">
						{m.selection_preview()}
					</p>
					<div class="mt-3 flex items-center gap-3">
						{#if $form.type}
							{@const typeMeta = typeOptions.find((o) => o.value === $form.type)}
							{#if typeMeta}
								<div
									class="flex items-center gap-2 rounded-lg bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand ring-1 ring-brand/20"
								>
									<typeMeta.icon class="h-3.5 w-3.5" />
									{typeMeta.label}
								</div>
							{/if}
						{/if}

						{#if $form.emotional_state}
							{@const emotionMeta = emotionalStateOptions.find(
								(o) => o.value === $form.emotional_state
							)}
							{#if emotionMeta}
								<div
									class="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700"
								>
									<emotionMeta.icon class="h-3.5 w-3.5" />
									{emotionMeta.label}
								</div>
							{/if}
						{/if}
					</div>
				</div>
			</div>
		</div>

		<RichTextEditor
			label={m.report_content()}
			placeholder={m.progress_report_content_placeholder()}
			bind:value={$form.report_text}
			error={formatFormError($errors.report_text)}
		/>
		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={$delayed}>{m.cancel()}</Button>
			<Button variant="secondary" class="gap-2" form={formId} type="submit" isLoading={$delayed}>
				<Plus class="h-4 w-4" />
				{$delayed ? m.creating_report() : m.create_report()}
			</Button>
		</div>
	{/snippet}
</Modal>
