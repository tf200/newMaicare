<script lang="ts">
	import { Clock, MapPin, Calendar, Moon, Search, Check, Loader2 } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import { m } from '$lib/paraglide/messages';

	interface Employee {
		id: string;
		name: string;
	}

	interface ShiftTemplate {
		id: string;
		name: string;
		startTime: string;
		endTime: string;
		isCrossMidnight: boolean;
		colorClass: string;
	}

	type RecurrenceType = 'none' | 'end_of_week' | 'end_of_month';

	let {
		open = $bindable(false),
		date = '',
		locationName = '',
		templates = [],
		preselectedTemplateId = null,
		availableEmployees = [],
		employeesLoading = false,
		employeesLoadError = null,
		onRetryEmployees = undefined,
		onSearchQueryChange = undefined,
		onAssign
	} = $props<{
		open: boolean;
		date: string;
		locationName: string;
		templates: ShiftTemplate[];
		preselectedTemplateId?: string | null;
		availableEmployees: Employee[];
		employeesLoading?: boolean;
		employeesLoadError?: string | null;
		onRetryEmployees?: () => void;
		onSearchQueryChange?: (query: string) => void;
		onAssign: (
			isCustom: boolean,
			templateId: string,
			startDatetime: string,
			endDatetime: string,
			employeeIds: string[],
			recurrence: RecurrenceType
		) => Promise<void>;
	}>();

	let isCustomMode = $state(false);
	let selectedTemplateId = $state<string>('');
	let startDatetime = $state<string>('');
	let endDatetime = $state<string>('');
	let searchQuery = $state('');
	let selectedEmployeeIds = $state<string[]>([]);
	let isSubmitting = $state(false);
	let selectedRecurrence = $state<RecurrenceType>('none');
	let submitError = $state<string | null>(null);

	const recurrenceOptions = [
		{ label: 'Do not repeat', value: 'none' },
		{ label: 'Repeat until end of week', value: 'end_of_week' },
		{ label: 'Repeat until end of month', value: 'end_of_month' }
	];

	$effect(() => {
		if (open) {
			isCustomMode = false;
			selectedTemplateId = preselectedTemplateId || (templates.length > 0 ? templates[0].id : '');
			searchQuery = '';
			selectedEmployeeIds = [];
			selectedRecurrence = 'none';
			submitError = null;

			if (date) {
				startDatetime = new Date(`${date}T08:00:00`).toISOString();
				endDatetime = new Date(`${date}T16:00:00`).toISOString();
			} else {
				startDatetime = '';
				endDatetime = '';
			}
		}
	});

	$effect(() => {
		if (!open) return;
		onSearchQueryChange?.(searchQuery);
	});

	let selectedTemplate = $derived(
		templates.find((t: ShiftTemplate) => t.id === selectedTemplateId)
	);
	let templateOptions = $derived(
		templates.map((t: ShiftTemplate) => ({ label: t.name, value: t.id }))
	);

	function toggleEmployee(id: string) {
		if (selectedEmployeeIds.includes(id)) {
			selectedEmployeeIds = selectedEmployeeIds.filter((e) => e !== id);
		} else {
			selectedEmployeeIds = [...selectedEmployeeIds, id];
		}
	}

	async function handleAssign() {
		submitError = null;

		if (isCustomMode) {
			if (!startDatetime || !endDatetime) {
				submitError = 'Please select both start and end times.';
				return;
			}
			if (new Date(startDatetime) >= new Date(endDatetime)) {
				submitError = 'End time must be after start time.';
				return;
			}
		} else {
			if (!selectedTemplateId) {
				submitError = 'Please select a shift template.';
				return;
			}
		}

		if (selectedEmployeeIds.length === 0) {
			submitError = 'Please select at least one employee.';
			return;
		}

		if (!date || !locationName) {
			submitError = 'Missing schedule details. Please close and reopen this panel.';
			return;
		}

		isSubmitting = true;
		try {
			await onAssign(
				isCustomMode,
				selectedTemplateId,
				startDatetime,
				endDatetime,
				selectedEmployeeIds,
				selectedRecurrence
			);
			open = false;
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Failed to assign employees.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Sheet bind:open title={m.assign_employees()}>
	<!-- Context Section -->
	<div class="mb-8 space-y-4">
		<div class="flex items-center gap-3 text-sm text-text-muted">
			<MapPin class="h-4 w-4" />
			<span class="font-medium">{locationName}</span>
		</div>
		<div class="flex items-center gap-3 text-sm text-text-muted">
			<Calendar class="h-4 w-4" />
			<span class="font-medium">{date}</span>
		</div>

		<!-- Mode Selector -->
		<div class="bg-surface-subtle flex rounded-xl border border-border/60 p-1">
			<button
				class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all {isCustomMode
					? 'text-text-muted hover:text-text'
					: 'bg-surface text-text shadow-sm'}"
				onclick={() => (isCustomMode = false)}
			>
				{m.preset_shift()}
			</button>
			<button
				class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all {isCustomMode
					? 'bg-surface text-text shadow-sm'
					: 'text-text-muted hover:text-text'}"
				onclick={() => (isCustomMode = true)}
			>
				{m.custom_time()}
			</button>
		</div>

		{#if isCustomMode}
			<div class="bg-surface-subtle/30 space-y-4 rounded-xl border border-border/60 p-4">
				<DateTimePicker label={m.start_time()} bind:value={startDatetime} />
				<DateTimePicker label={m.end_time()} bind:value={endDatetime} />
				{#if startDatetime && endDatetime && new Date(startDatetime) >= new Date(endDatetime)}
					<p class="text-xs font-medium text-rose-500">{m.end_time_after_start()}</p>
				{/if}
			</div>
		{:else}
			<div class="mt-4">
				<Select
					label={m.shift_template()}
					options={templateOptions}
					bind:value={selectedTemplateId}
					placeholder={m.select_template_placeholder()}
				/>
			</div>

			{#if selectedTemplate}
				<div
					class="bg-surface-subtle/50 mt-3 flex items-center justify-between rounded-xl border border-border/60 p-4"
				>
					<div class="flex items-center gap-3">
						<div
							class="h-4 w-4 rounded-full {selectedTemplate.colorClass.split(
								' '
							)[0]} border {selectedTemplate.colorClass.split(' ')[2]}"
						></div>
						<div>
							<div class="font-semibold text-text">{selectedTemplate.name}</div>
							<div class="flex items-center gap-1.5 text-xs text-text-muted">
								<Clock class="h-3.5 w-3.5" />
								<span>{selectedTemplate.startTime} - {selectedTemplate.endTime}</span>
							</div>
						</div>
					</div>
					{#if selectedTemplate.isCrossMidnight}
						<div
							class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400"
						>
							<Moon class="h-3 w-3" />
							<span>{m.cross_midnight_short()}</span>
						</div>
					{/if}
				</div>
			{/if}
		{/if}

		<div class="mt-4">
			<Select
				label={m.repeat_shift()}
				options={recurrenceOptions}
				bind:value={selectedRecurrence}
			/>
		</div>
	</div>

	<!-- Employee Selection -->
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-text-muted">{m.select_employees()}</h3>

		<div class="relative">
			<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder={m.search_employees()}
				class="w-full rounded-xl border border-border bg-surface py-2.5 pr-4 pl-10 text-sm text-text outline-hidden transition-all placeholder:text-text-subtle focus:ring-2 focus:ring-brand/20"
			/>
		</div>

		<div class="flex flex-col gap-2">
			{#if employeesLoadError}
				<div class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
					<p>{employeesLoadError}</p>
					{#if onRetryEmployees}
						<Button variant="ghost" class="mt-2" onclick={onRetryEmployees}>{m.retry()}</Button>
					{/if}
				</div>
			{:else if employeesLoading}
				<div class="flex items-center justify-center gap-2 py-8 text-sm text-text-muted">
					<Loader2 class="h-4 w-4 animate-spin" />
					<span>{m.loading_employees()}</span>
				</div>
			{:else}
				{#each availableEmployees as employee (employee.id)}
					<button
						class="hover:bg-surface-subtle flex items-center justify-between rounded-xl border border-border/60 p-3 transition-colors {selectedEmployeeIds.includes(
							employee.id
						)
							? 'border-brand/50 bg-brand/5'
							: 'bg-surface'}"
						onclick={() => toggleEmployee(employee.id)}
					>
						<div class="flex items-center gap-3">
							<div
								class="bg-surface-subtle flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-text"
							>
								{employee.name.charAt(0)}
							</div>
							<span class="text-sm font-medium text-text">{employee.name}</span>
						</div>
						<div
							class="flex h-5 w-5 items-center justify-center rounded-full border {selectedEmployeeIds.includes(
								employee.id
							)
								? 'border-brand bg-brand text-white'
								: 'border-border/60'}"
						>
							{#if selectedEmployeeIds.includes(employee.id)}
								<Check class="h-3 w-3" />
							{/if}
						</div>
					</button>
				{:else}
					<div class="py-8 text-center text-sm text-text-muted">
						{m.no_employees_matching({ query: searchQuery })}
					</div>
				{/each}
			{/if}
		</div>
	</div>

	{#snippet footer()}
		{#if submitError}
			<p class="mb-3 text-sm font-medium text-rose-600 dark:text-rose-400">{submitError}</p>
		{/if}
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-text-muted">
				{m.selected_count({ count: selectedEmployeeIds.length })}
			</span>
			<div class="flex gap-3">
				<Button variant="ghost" onclick={() => (open = false)} disabled={isSubmitting}>
					{m.cancel()}
				</Button>
				<Button
					variant="primary"
					onclick={handleAssign}
					disabled={(isCustomMode ? !startDatetime || !endDatetime : !selectedTemplateId) ||
						selectedEmployeeIds.length === 0 ||
						employeesLoading ||
						!date ||
						!locationName ||
						isSubmitting}
					isLoading={isSubmitting}
				>
					{m.assign()}
				</Button>
			</div>
		</div>
	{/snippet}
</Sheet>
