<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import { listEmployees, type EmployeeListItem } from '$lib/api/employees';
	import { createTimeEntry } from '$lib/api/uren';
	import type { CreateTimeEntryHourType } from '$lib/types/api';

	interface Props {
		open?: boolean;
		onSaved?: () => void;
	}

	let { open = $bindable(false), onSaved }: Props = $props();

	interface FormState {
		employeeId: string;
		employeeName: string;
		entryDate: string;
		startTime: string;
		endTime: string;
		breakMinutes: string;
		hourType: CreateTimeEntryHourType;
		projectName: string;
		projectNumber: string;
		clientName: string;
		activityCategory: string;
		activityDescription: string;
		notes: string;
	}

	interface FormErrors {
		employeeId: string;
		entryDate: string;
		startTime: string;
		endTime: string;
		breakMinutes: string;
		hourType: string;
	}

	const HOUR_TYPE_OPTIONS: Array<{ label: string; value: CreateTimeEntryHourType }> = [
		{ label: 'Normal', value: 'normal' },
		{ label: 'Overtime', value: 'overtime' },
		{ label: 'Travel', value: 'travel' },
		{ label: 'Leave', value: 'leave' },
		{ label: 'Sick', value: 'sick' },
		{ label: 'Training', value: 'training' }
	];

	const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
	const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

	let form = $state<FormState>({
		employeeId: '',
		employeeName: '',
		entryDate: new Date().toISOString().slice(0, 10),
		startTime: '',
		endTime: '',
		breakMinutes: '0',
		hourType: 'normal',
		projectName: '',
		projectNumber: '',
		clientName: '',
		activityCategory: '',
		activityDescription: '',
		notes: ''
	});

	let errors = $state<FormErrors>({
		employeeId: '',
		entryDate: '',
		startTime: '',
		endTime: '',
		breakMinutes: '',
		hourType: ''
	});

	let submitting = $state(false);
	let submitError = $state<string | null>(null);

	$effect(() => {
		if (!open) {
			resetForm();
		}
	});

	function resetForm() {
		form = {
			employeeId: '',
			employeeName: '',
			entryDate: new Date().toISOString().slice(0, 10),
			startTime: '',
			endTime: '',
			breakMinutes: '0',
			hourType: 'normal',
			projectName: '',
			projectNumber: '',
			clientName: '',
			activityCategory: '',
			activityDescription: '',
			notes: ''
		};
		errors = {
			employeeId: '',
			entryDate: '',
			startTime: '',
			endTime: '',
			breakMinutes: '',
			hourType: ''
		};
		submitError = null;
		submitting = false;
	}

	function validate(): boolean {
		let valid = true;

		errors = {
			employeeId: '',
			entryDate: '',
			startTime: '',
			endTime: '',
			breakMinutes: '',
			hourType: ''
		};

		if (!form.employeeId || !UUID_REGEX.test(form.employeeId)) {
			errors.employeeId = 'Please select an employee.';
			valid = false;
		}

		if (!form.entryDate || !DATE_REGEX.test(form.entryDate)) {
			errors.entryDate = 'Date is required (YYYY-MM-DD).';
			valid = false;
		}

		if (!form.startTime || !TIME_REGEX.test(form.startTime.trim())) {
			errors.startTime = 'Start time is required (HH:MM).';
			valid = false;
		}

		if (!form.endTime || !TIME_REGEX.test(form.endTime.trim())) {
			errors.endTime = 'End time is required (HH:MM).';
			valid = false;
		}

		const breakVal = Number(form.breakMinutes);
		if (form.breakMinutes !== '' && (!Number.isFinite(breakVal) || breakVal < 0)) {
			errors.breakMinutes = 'Break minutes must be 0 or more.';
			valid = false;
		}

		if (!form.hourType) {
			errors.hourType = 'Hour type is required.';
			valid = false;
		}

		return valid;
	}

	async function handleSubmit() {
		if (!validate()) return;

		submitting = true;
		submitError = null;

		try {
			await createTimeEntry({
				employee_id: form.employeeId,
				entry_date: form.entryDate,
				start_time: form.startTime.trim(),
				end_time: form.endTime.trim(),
				break_minutes: Number(form.breakMinutes) || 0,
				hour_type: form.hourType,
				project_name: form.projectName.trim() || null,
				project_number: form.projectNumber.trim() || null,
				client_name: form.clientName.trim() || null,
				activity_category: form.activityCategory.trim() || null,
				activity_description: form.activityDescription.trim() || null,
				notes: form.notes.trim() || null
			});

			onSaved?.();
			open = false;
		} catch (error) {
			submitError =
				error instanceof Error ? error.message : 'Failed to create time entry. Please try again.';
		} finally {
			submitting = false;
		}
	}

	async function loadEmployeeOptions(query: string): Promise<EmployeeListItem[]> {
		const response = await listEmployees({
			page: 1,
			pageSize: 20,
			search: query.trim() || undefined,
			isArchived: false,
			outOfService: false
		});
		return response.data.results;
	}

	function employeeLabel(employee: EmployeeListItem): string {
		const first = employee.first_name?.trim() ?? '';
		const last = employee.last_name?.trim() ?? '';
		return `${first} ${last}`.trim() || 'Unknown employee';
	}
</script>

<Modal
	bind:open
	title="Add Time Entry"
	description="Manually create a time entry for an employee."
	size="lg"
>
	<div class="space-y-5">
		{#if submitError}
			<InlineErrorBanner title="Could not save" message={submitError} />
		{/if}

		<div class="grid gap-5 sm:grid-cols-2">
			<div class="sm:col-span-2">
				<SearchSelect
					label="Employee"
					bind:value={form.employeeId}
					bind:displayValue={form.employeeName}
					loadOptions={loadEmployeeOptions}
					labelFn={employeeLabel}
					valueFn={(emp: EmployeeListItem) => emp.id}
					placeholder="Search and select an employee..."
					searchPlaceholder="Search employees..."
					error={errors.employeeId}
				/>
			</div>

			<Input
				id="entry-date"
				label="Date"
				type="date"
				bind:value={form.entryDate}
				error={errors.entryDate}
			/>

			<Select
				label="Hour Type"
				options={HOUR_TYPE_OPTIONS}
				bind:value={form.hourType}
				error={errors.hourType}
			/>

			<Input
				id="start-time"
				label="Start Time"
				type="time"
				bind:value={form.startTime}
				error={errors.startTime}
			/>

			<Input
				id="end-time"
				label="End Time"
				type="time"
				bind:value={form.endTime}
				error={errors.endTime}
			/>

			<Input
				id="break-minutes"
				label="Break (minutes)"
				type="number"
				bind:value={form.breakMinutes}
				error={errors.breakMinutes}
				min="0"
			/>
		</div>

		<div class="border-t border-border pt-4">
			<p class="mb-3 text-xs font-bold tracking-widest text-text-subtle uppercase">
				Optional Details
			</p>
			<div class="grid gap-5 sm:grid-cols-2">
				<Input
					id="client-name"
					label="Client Name"
					type="text"
					bind:value={form.clientName}
					placeholder="e.g. Zorginstelling ABC"
				/>

				<Input
					id="project-name"
					label="Project Name"
					type="text"
					bind:value={form.projectName}
					placeholder="e.g. Nachtzorg"
				/>

				<Input
					id="project-number"
					label="Project Number"
					type="text"
					bind:value={form.projectNumber}
					placeholder="e.g. PRJ-001"
				/>

				<Input
					id="activity-category"
					label="Activity Category"
					type="text"
					bind:value={form.activityCategory}
					placeholder="e.g. Zorg, Overleg"
				/>

				<div class="sm:col-span-2">
					<Input
						id="activity-description"
						label="Activity Description"
						type="text"
						bind:value={form.activityDescription}
						placeholder="Describe the activity..."
					/>
				</div>

				<div class="sm:col-span-2">
					<Input
						id="notes"
						label="Notes"
						type="text"
						bind:value={form.notes}
						placeholder="Any additional notes..."
					/>
				</div>
			</div>
		</div>
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-2">
			<Button variant="ghost" onclick={() => (open = false)} disabled={submitting}>Cancel</Button>
			<Button onclick={handleSubmit} isLoading={submitting}>Create Entry</Button>
		</div>
	{/snippet}
</Modal>
