<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { m } from '$lib/paraglide/messages';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import MultiSearchSelect from '$lib/components/ui/MultiSearchSelect.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import RRuleBuilder from '$lib/components/ui/RRuleBuilder.svelte';
	import { formatFormError } from '$lib/utils/form-errors';
	import type { Appointment } from '$lib/types/appointments';
	import { listEmployees, type EmployeeListItem } from '$lib/api/employees';
	import { listClients } from '$lib/api/clients';
	import { AppointmentSchema, type AppointmentInput } from '$lib/schemas/appointment';
	import type { ListClientsResponse } from '$lib/types/api/clients';

	interface Props {
		appointment?: Partial<Appointment>;
		onSave: (appointment: Partial<Appointment>) => void;
		onCancel: () => void;
		loading?: boolean;
	}

	let { appointment = {}, onSave, onCancel, loading = false }: Props = $props();

	let selectedReminder = $state('0');
	let colorInput = $state<HTMLInputElement>();
	const formId = 'appointment-form';

	const buildInitialData = (): AppointmentInput => ({
		kind: appointment.kind ?? 'appointment',
		title: appointment.title ?? '',
		description: appointment.description ?? '',
		location: appointment.location ?? '',
		color: appointment.color ?? '#1D4ED8',
		start: appointment.start ?? new Date().toISOString(),
		end: appointment.end ?? new Date(Date.now() + 3600000).toISOString(),
		rrule: appointment.rrule,
		attendeeEmployeeIds: appointment.attendeeEmployeeIds ?? [],
		attendeeClientIds: appointment.attendeeClientIds ?? [],
		reminders:
			appointment.reminders?.map((reminder) => ({
				minutes_before: reminder.minutes_before,
				remind_at: reminder.remind_at
			})) ?? []
	});

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(buildInitialData(), valibotClient(AppointmentSchema)),
		{
			validators: valibotClient(AppointmentSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: ({ form }) => {
				if (form.valid) {
					// Build reminders array if local quick-select is used
					const finalReminders: Appointment['reminders'] | undefined =
						selectedReminder !== '0'
							? [{ minutes_before: parseInt(selectedReminder, 10) }]
							: form.data.reminders && form.data.reminders.length > 0
								? form.data.reminders
								: undefined;

					onSave({
						...appointment,
						...form.data,
						description: form.data.description || null,
						location: form.data.location || null,
						color: form.data.color || null,
						reminders: finalReminders
					});
				}
			}
		}
	);

	const kindOptions = [
		{ label: 'Appointment', value: 'appointment' },
		{ label: 'Reminder', value: 'reminder' }
	];

	const colorOptions = [
		{ value: '#1D4ED8', label: 'Blue' },
		{ value: '#059669', label: 'Green' },
		{ value: '#DC2626', label: 'Red' }
	];

	const reminderOptions = [
		{ label: 'None', value: '0' },
		{ label: '5 minutes before', value: '5' },
		{ label: '15 minutes before', value: '15' },
		{ label: '30 minutes before', value: '30' },
		{ label: '1 hour before', value: '60' },
		{ label: '1 day before', value: '1440' }
	];

	// Load employees with search
	async function loadEmployees(query: string) {
		try {
			const response = await listEmployees({ search: query, page: 1, pageSize: 50 });
			return response.data.results.map((emp: EmployeeListItem) => ({
				value: emp.id,
				label: `${emp.first_name} ${emp.last_name}`
			}));
		} catch (e) {
			console.error('Failed to load employees:', e);
			return [];
		}
	}

	// Load clients with search
	async function loadClients(query: string) {
		try {
			const response = await listClients({ search: query, page: 1, pageSize: 50 });
			return response.data.results.map((client: ListClientsResponse) => ({
				value: client.id,
				label: `${client.first_name} ${client.last_name}`
			}));
		} catch (e) {
			console.error('Failed to load clients:', e);
			return [];
		}
	}

	function handleRRuleChange(newRRule: string | undefined) {
		$form.rrule = newRRule;
	}
</script>

<form id={formId} use:enhance class="flex flex-col gap-6">
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<!-- Kind -->
		<Select
			label="Type"
			options={kindOptions}
			bind:value={$form.kind}
			error={($errors.kind as string[] | undefined)?.join('\n')}
		/>

		<!-- Color -->
		<div>
			<label for="color-input" class="mb-2 block text-sm font-semibold text-text-muted">Color</label
			>
			<div class="flex flex-wrap items-center gap-2">
				{#each colorOptions as colorOpt}
					<button
						type="button"
						onclick={() => ($form.color = colorOpt.value)}
						class="h-10 w-10 rounded-xl transition-all {$form.color === colorOpt.value
							? 'scale-110 ring-2 ring-brand ring-offset-2'
							: 'hover:scale-105'}"
						style="background-color: {colorOpt.value}"
						aria-label={colorOpt.label}
						title={colorOpt.label}
					></button>
				{/each}

				<!-- Custom color picker -->
				<button
					type="button"
					onclick={() => colorInput?.click()}
					class="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface text-text-muted transition-all hover:border-brand hover:text-brand"
					class:ring-2={!colorOptions.some((opt) => opt.value === $form.color)}
					class:ring-brand={!colorOptions.some((opt) => opt.value === $form.color)}
					class:ring-offset-2={!colorOptions.some((opt) => opt.value === $form.color)}
					style={!colorOptions.some((opt) => opt.value === $form.color)
						? `background-color: ${$form.color}; border-style: solid; border-color: ${$form.color}`
						: ''}
					aria-label="Select custom color"
					title="Custom color"
				>
					<span class="text-lg font-bold">+</span>
				</button>

				<input
					id="color-input"
					bind:this={colorInput}
					type="color"
					value={$form.color}
					oninput={(e) => ($form.color = e.currentTarget.value)}
					class="sr-only"
				/>
			</div>
			{#if $errors.color}
				<p class="mt-1 text-xs text-error">{($errors.color as string[])?.join('\n')}</p>
			{/if}
		</div>

		<!-- Title -->
		<div class="md:col-span-2">
			<Input
				label="Title"
				bind:value={$form.title}
				placeholder="e.g. Weekly Check-in"
				error={formatFormError($errors.title)}
				required
			/>
		</div>

		<!-- Description -->
		<div class="md:col-span-2">
			<Textarea
				label="Description"
				bind:value={$form.description}
				placeholder="Add more details about this appointment..."
				rows={3}
				error={formatFormError($errors.description)}
			/>
		</div>

		<!-- Start/End -->
		<DateTimePicker label="Start" bind:value={$form.start} error={formatFormError($errors.start)} />
		<DateTimePicker label="End" bind:value={$form.end} error={formatFormError($errors.end)} />

		<!-- Location -->
		<div class="md:col-span-2">
			<Input
				label="Location"
				bind:value={$form.location}
				placeholder="Physical address or meeting link"
				error={formatFormError($errors.location)}
			/>
		</div>

		<!-- Recurrence -->
		<div class="md:col-span-2">
			<RRuleBuilder rrule={$form.rrule} onChange={handleRRuleChange} />
			{#if $errors.rrule}
				<p class="mt-1 text-xs text-error">{formatFormError($errors.rrule)}</p>
			{/if}
		</div>

		<!-- Attendees -->
		<div class="md:col-span-2">
			<MultiSearchSelect
				label="Involved Employees"
				loadOptions={loadEmployees}
				bind:value={$form.attendeeEmployeeIds}
				placeholder="Search and select employees..."
				searchPlaceholder="Search employees..."
				error={($errors.attendeeEmployeeIds as string[] | undefined)?.join('\n')}
			/>
		</div>

		<div class="md:col-span-2">
			<MultiSearchSelect
				label="Involved Clients"
				loadOptions={loadClients}
				bind:value={$form.attendeeClientIds}
				placeholder="Search and select clients..."
				searchPlaceholder="Search clients..."
				error={($errors.attendeeClientIds as string[] | undefined)?.join('\n')}
			/>
		</div>

		<!-- Reminder -->
		<div class="md:col-span-2">
			<Select label="Reminder" options={reminderOptions} bind:value={selectedReminder} />
		</div>
	</div>

	<div class="mt-4 flex justify-end gap-3">
		<Button variant="secondary" onclick={onCancel} type="button" disabled={loading || $delayed}
			>Cancel</Button
		>
		<Button variant="primary" type="submit" isLoading={loading || $delayed}>
			{appointment.id ? 'Update' : 'Create'}
			{$form.kind === 'appointment' ? 'Appointment' : 'Reminder'}
		</Button>
	</div>
</form>
