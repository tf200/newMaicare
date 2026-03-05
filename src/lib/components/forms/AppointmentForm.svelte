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
		{ label: m.appointment_label(), value: 'appointment' },
		{ label: m.reminder_label(), value: 'reminder' }
	];

	const colorOptions = [
		{ value: '#1D4ED8', label: m.color_blue() },
		{ value: '#059669', label: m.color_green() },
		{ value: '#DC2626', label: m.color_red() }
	];

	const reminderOptions = [
		{ label: m.none(), value: '0' },
		{ label: m.reminder_minutes_before({ minutes: 5 }), value: '5' },
		{ label: m.reminder_minutes_before({ minutes: 15 }), value: '15' },
		{ label: m.reminder_minutes_before({ minutes: 30 }), value: '30' },
		{ label: m.reminder_hour_before(), value: '60' },
		{ label: m.reminder_day_before(), value: '1440' }
	];

	const kindLabel = $derived.by(() =>
		$form.kind === 'appointment' ? m.appointment_label() : m.reminder_label()
	);

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
			label={m.type()}
			options={kindOptions}
			bind:value={$form.kind}
			error={($errors.kind as string[] | undefined)?.join('\n')}
		/>

		<!-- Color -->
		<div>
			<label for="color-input" class="mb-2 block text-sm font-semibold text-text-muted">
				{m.color()}
			</label>
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
					aria-label={m.select_custom_color()}
					title={m.custom_color()}
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
				label={m.title()}
				bind:value={$form.title}
				placeholder={m.appointment_title_placeholder()}
				error={formatFormError($errors.title)}
				required
			/>
		</div>

		<!-- Description -->
		<div class="md:col-span-2">
			<Textarea
				label={m.description()}
				bind:value={$form.description}
				placeholder={m.appointment_description_placeholder()}
				rows={3}
				error={formatFormError($errors.description)}
			/>
		</div>

		<!-- Start/End -->
		<DateTimePicker
			label={m.start()}
			bind:value={$form.start}
			error={formatFormError($errors.start)}
		/>
		<DateTimePicker label={m.end()} bind:value={$form.end} error={formatFormError($errors.end)} />

		<!-- Location -->
		<div class="md:col-span-2">
			<Input
				label={m.location()}
				bind:value={$form.location}
				placeholder={m.appointment_location_placeholder()}
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
				label={m.involved_employees()}
				loadOptions={loadEmployees}
				bind:value={$form.attendeeEmployeeIds}
				placeholder={m.search_select_employees_placeholder()}
				searchPlaceholder={m.search_employees()}
				error={($errors.attendeeEmployeeIds as string[] | undefined)?.join('\n')}
			/>
		</div>

		<div class="md:col-span-2">
			<MultiSearchSelect
				label={m.involved_clients()}
				loadOptions={loadClients}
				bind:value={$form.attendeeClientIds}
				placeholder={m.search_select_clients_placeholder()}
				searchPlaceholder={m.search_clients()}
				error={($errors.attendeeClientIds as string[] | undefined)?.join('\n')}
			/>
		</div>

		<!-- Reminder -->
		<div class="md:col-span-2">
			<Select label={m.reminder()} options={reminderOptions} bind:value={selectedReminder} />
		</div>
	</div>

	<div class="mt-4 flex justify-end gap-3">
		<Button variant="secondary" onclick={onCancel} type="button" disabled={loading || $delayed}
			>{m.cancel()}</Button
		>
		<Button variant="primary" type="submit" isLoading={loading || $delayed}>
			{appointment.id ? `${m.update()} ${kindLabel}` : `${m.create()} ${kindLabel}`}
		</Button>
	</div>
</form>
