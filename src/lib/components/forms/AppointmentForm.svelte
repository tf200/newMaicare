<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import MultiSearchSelect from '$lib/components/ui/MultiSearchSelect.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import RRuleBuilder from '$lib/components/ui/RRuleBuilder.svelte';
	import type { Appointment } from '$lib/types/appointments';
	import { listEmployees } from '$lib/api/employees';
	import { listClients } from '$lib/api/clients';

	interface Props {
		appointment?: Partial<Appointment>;
		onSave: (appointment: Partial<Appointment>) => void;
		onCancel: () => void;
		loading?: boolean;
	}

	let { appointment = {}, onSave, onCancel, loading = false }: Props = $props();

	// Form fields matching API spec exactly
	let kind = $state<'appointment' | 'reminder'>(
		(appointment.kind as 'appointment' | 'reminder') || 'appointment'
	);
	let title = $state(appointment.title || '');
	let description = $state(appointment.description || '');
	let location = $state(appointment.location || '');
	let color = $state(appointment.color || '#1D4ED8');
	let start = $state(appointment.start || new Date().toISOString());
	let end = $state(appointment.end || new Date(Date.now() + 3600000).toISOString());
	let rrule = $state<string | undefined>(appointment.rrule);
	let attendeeEmployeeIds = $state<string[]>(appointment.attendeeEmployeeIds || []);
	let attendeeClientIds = $state<string[]>(appointment.attendeeClientIds || []);

	// Reminders (optional)
	let reminders = $state<Array<{ minutes_before?: number; remind_at?: string }>>(
		appointment.reminders?.map((r: any) => ({
			minutes_before: r.minutes_before,
			remind_at: r.remind_at
		})) || []
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

	let colorInput = $state<HTMLInputElement>();

	const reminderOptions = [
		{ label: 'None', value: '0' },
		{ label: '5 minutes before', value: '5' },
		{ label: '15 minutes before', value: '15' },
		{ label: '30 minutes before', value: '30' },
		{ label: '1 hour before', value: '60' },
		{ label: '1 day before', value: '1440' }
	];

	let selectedReminder = $state('0');

	// Load employees with search
	async function loadEmployees(query: string) {
		try {
			const response = await listEmployees({ search: query, page: 1, pageSize: 50 });
			return response.data.results.map((emp: any) => ({
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
			return response.data.results.map((client: any) => ({
				value: client.id,
				label: `${client.first_name} ${client.last_name}`
			}));
		} catch (e) {
			console.error('Failed to load clients:', e);
			return [];
		}
	}

	function handleRRuleChange(newRRule: string | undefined) {
		rrule = newRRule;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();

		// Build reminders array
		const finalReminders =
			selectedReminder !== '0'
				? [{ minutes_before: parseInt(selectedReminder, 10) }]
				: reminders.length > 0
					? reminders
					: undefined;

		onSave({
			...appointment,
			kind,
			title,
			description: description || null,
			location: location || null,
			color: color || null,
			start,
			end,
			rrule,
			attendeeEmployeeIds,
			attendeeClientIds,
			reminders: finalReminders
		});
	}
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-6">
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<!-- Kind -->
		<Select label="Type" options={kindOptions} bind:value={kind} />

		<!-- Color -->
		<div>
			<label class="mb-2 block text-sm font-semibold text-text-muted">Color</label>
			<div class="flex flex-wrap items-center gap-2">
				{#each colorOptions as colorOpt}
					<button
						type="button"
						onclick={() => (color = colorOpt.value)}
						class="h-10 w-10 rounded-xl transition-all {color === colorOpt.value
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
					class:ring-2={!colorOptions.some((opt) => opt.value === color)}
					class:ring-brand={!colorOptions.some((opt) => opt.value === color)}
					class:ring-offset-2={!colorOptions.some((opt) => opt.value === color)}
					style={!colorOptions.some((opt) => opt.value === color)
						? `background-color: ${color}; border-style: solid; border-color: ${color}`
						: ''}
					aria-label="Select custom color"
					title="Custom color"
				>
					<span class="text-lg font-bold">+</span>
				</button>

				<input
					bind:this={colorInput}
					type="color"
					value={color}
					oninput={(e) => (color = e.currentTarget.value)}
					class="sr-only"
				/>
			</div>
		</div>

		<!-- Title -->
		<div class="md:col-span-2">
			<Input label="Title" bind:value={title} placeholder="e.g. Weekly Check-in" required />
		</div>

		<!-- Description -->
		<div class="md:col-span-2">
			<Textarea
				label="Description"
				bind:value={description}
				placeholder="Add more details about this appointment..."
				rows={3}
			/>
		</div>

		<!-- Start/End -->
		<DateTimePicker label="Start" bind:value={start} />
		<DateTimePicker label="End" bind:value={end} />

		<!-- Location -->
		<div class="md:col-span-2">
			<Input
				label="Location"
				bind:value={location}
				placeholder="Physical address or meeting link"
			/>
		</div>

		<!-- Recurrence -->
		<div class="md:col-span-2">
			<RRuleBuilder {rrule} onChange={handleRRuleChange} />
		</div>

		<!-- Attendees -->
		<div class="md:col-span-2">
			<MultiSearchSelect
				label="Involved Employees"
				loadOptions={loadEmployees}
				bind:value={attendeeEmployeeIds}
				placeholder="Search and select employees..."
				searchPlaceholder="Search employees..."
			/>
		</div>

		<div class="md:col-span-2">
			<MultiSearchSelect
				label="Involved Clients"
				loadOptions={loadClients}
				bind:value={attendeeClientIds}
				placeholder="Search and select clients..."
				searchPlaceholder="Search clients..."
			/>
		</div>

		<!-- Reminder -->
		<div class="md:col-span-2">
			<Select label="Reminder" options={reminderOptions} bind:value={selectedReminder} />
		</div>
	</div>

	<div class="mt-4 flex justify-end gap-3">
		<Button variant="secondary" onclick={onCancel} type="button" disabled={loading}>Cancel</Button>
		<Button variant="primary" type="submit" isLoading={loading}>
			{appointment.id ? 'Update' : 'Create'}
			{kind === 'appointment' ? 'Appointment' : 'Reminder'}
		</Button>
	</div>
</form>
