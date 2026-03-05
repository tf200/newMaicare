<script lang="ts">
	import { getAuthState } from '$lib/state/auth.svelte';
	import { createEvent, listEvents } from '$lib/api/events';
	import Calendar from '$lib/components/ui/Calendar.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import AppointmentForm from '$lib/components/forms/AppointmentForm.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { Appointment } from '$lib/types/appointments';
	import type { PageData } from './$types';
	import type { EventOccurrenceResponse } from '$lib/types/api';

	let { data }: { data: PageData } = $props();
	const auth = getAuthState();

	// Appointments state - loaded from API
	let appointments = $state<Appointment[]>([]);
	let isLoadingAppointments = $state(false);
	let loadError = $state<string | null>(null);

	// Track current calendar range for filtering
	let currentRange = $state<{ start: Date; end: Date } | null>(null);

	let isModalOpen = $state(false);
	let selectedAppointment = $state<Partial<Appointment> | null>(null);
	let isSavingAppointment = $state(false);
	let saveError = $state<string | null>(null);
	let scope = $state('my'); // 'my', 'all', 'employee', 'client'
	let selectedScopeId = $state('');
	let filteredEmployeeId = $state(''); // For APPOINTMENT.VIEW_ALL permission filter

	const isAdmin = $derived(auth.user?.role_id === 'admin' || auth.user?.role_id === 'manager');
	const canViewAllAppointments = $derived(auth.hasPermission('APPOINTMENT.VIEW_ALL'));

	// Prepare options for selects from streamed data
	let employeeOptions = $state<{ label: string; value: string }[]>([]);
	let clientOptions = $state<{ label: string; value: string }[]>([]);

	$effect(() => {
		data.employeesPromise.then((employees) => {
			employeeOptions = employees.map((e) => ({
				label: `${e.first_name} ${e.last_name}`,
				value: e.id
			}));
		});
		data.clientsPromise.then((clients) => {
			clientOptions = clients.map((c) => ({
				label: `${c.first_name} ${c.last_name}`,
				value: c.id
			}));
		});
	});

	// Fetch events from API when range changes
	async function fetchEvents(start: Date, end: Date) {
		isLoadingAppointments = true;
		loadError = null;

		try {
			const requestPayload: Parameters<typeof listEvents>[0] = {
				start_at: start.toISOString(),
				end_at: end.toISOString()
			};

			// Add employee_id filter if user has VIEW_ALL permission and selected an employee
			if (canViewAllAppointments && filteredEmployeeId) {
				requestPayload.employee_id = filteredEmployeeId;
			}

			const response = await listEvents(requestPayload);

			// Map API response to Appointment type
			appointments = response.data.map(mapEventToAppointment);
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to load appointments.';
			console.error('Failed to load events:', error);
		} finally {
			isLoadingAppointments = false;
		}
	}

	function mapEventToAppointment(event: EventOccurrenceResponse): Appointment {
		const attendeeEmployeeIds = event.attendee_employee_ids ?? [];
		const attendeeClientIds = event.attendee_client_ids ?? [];

		return {
			id: event.id,
			kind: event.kind,
			title: event.title,
			description: event.description ?? undefined,
			location: event.location ?? undefined,
			color: event.color ?? undefined,
			start: event.start_at,
			end: event.end_at,
			attendeeEmployeeIds,
			attendeeClientIds,
			// Legacy fields
			employeeIds: attendeeEmployeeIds,
			clientId: attendeeClientIds[0],
			status: 'scheduled',
			type: event.kind === 'appointment' ? 'consultation' : 'other',
			createdAt: event.start_at,
			updatedAt: event.start_at
		};
	}

	function handleRangeChange(range: { start: Date; end: Date }) {
		currentRange = range;
		fetchEvents(range.start, range.end);
	}

	// Refetch when employee filter changes (only for users with VIEW_ALL permission)
	$effect(() => {
		if (canViewAllAppointments && currentRange) {
			fetchEvents(currentRange.start, currentRange.end);
		}
	});

	function handleAddAppointment(date: Date) {
		saveError = null;
		selectedAppointment = {
			start: date.toISOString(),
			end: new Date(date.getTime() + 3600000).toISOString()
		};
		isModalOpen = true;
	}

	function handleEditAppointment(appointment: Appointment) {
		saveError = null;
		selectedAppointment = { ...appointment };
		isModalOpen = true;
	}

	function mapEventStatusToAppointmentStatus(status: string): Appointment['status'] {
		if (status === 'confirmed') {
			return 'scheduled';
		}
		if (status === 'completed' || status === 'cancelled') {
			return status;
		}
		return 'scheduled';
	}

	async function handleSaveAppointment(payload: Partial<Appointment>) {
		if (payload.id) {
			// Update existing (not implemented yet)
			appointments = appointments.map((a) =>
				a.id === payload.id ? ({ ...a, ...payload } as Appointment) : a
			);
			saveError = null;
			isModalOpen = false;
			return;
		}

		if (!payload.start || !payload.end) {
			saveError = 'Please provide start and end date/time.';
			return;
		}

		const mappedReminders = payload.reminders
			?.map((reminder) => {
				if (typeof reminder.minutes_before === 'number') {
					return { minutes_before: reminder.minutes_before };
				}
				if (typeof reminder.remind_at === 'string' && reminder.remind_at.length > 0) {
					return { remind_at: reminder.remind_at };
				}
				return null;
			})
			.filter(
				(reminder): reminder is { minutes_before: number } | { remind_at: string } =>
					reminder !== null
			);

		const createPayload: Parameters<typeof createEvent>[0] = {
			kind: payload.kind || 'appointment',
			title: payload.title || undefined,
			description: payload.description?.trim() ? payload.description : null,
			location: payload.location?.trim() ? payload.location : null,
			color: payload.color || null,
			start_at: payload.start,
			end_at: payload.end,
			rrule: payload.rrule || undefined,
			attendee_employee_ids: payload.attendeeEmployeeIds?.length
				? payload.attendeeEmployeeIds
				: undefined,
			attendee_client_ids: payload.attendeeClientIds?.length
				? payload.attendeeClientIds
				: undefined,
			reminders: mappedReminders && mappedReminders.length > 0 ? mappedReminders : undefined
		};

		isSavingAppointment = true;
		try {
			const response = await createEvent(createPayload);
			const event = response.data;
			const attendeeEmployeeIds = event.attendee_employee_ids ?? [];
			const attendeeClientIds = event.attendee_client_ids ?? [];
			const newApp: Appointment = {
				id: event.id,
				kind: event.kind,
				title: event.title || 'Appointment',
				description: event.description ?? undefined,
				start: event.start_at,
				end: event.end_at,
				status: mapEventStatusToAppointmentStatus(event.status),
				location: event.location ?? undefined,
				color: event.color ?? undefined,
				rrule: event.rrule ?? undefined,
				attendeeEmployeeIds,
				attendeeClientIds,
				reminders: (event.reminders ?? []).map((reminder) => ({
					id: reminder.id,
					minutes_before: reminder.minutes_before ?? undefined,
					remind_at: reminder.remind_at ?? undefined
				})),
				// Legacy fields
				clientId: attendeeClientIds[0],
				employeeIds: attendeeEmployeeIds,
				type: 'consultation',
				createdAt: event.created_at,
				updatedAt: event.updated_at
			};

			appointments = [...appointments, newApp];
			saveError = null;
			isModalOpen = false;
		} catch (error) {
			saveError = error instanceof Error ? error.message : 'Failed to save appointment.';
		} finally {
			isSavingAppointment = false;
		}
	}

	const filteredAppointments = $derived.by(() => {
		const currentEmployeeId = auth.user?.employee_id || '';

		if (scope === 'my') {
			// API already enforces attendee visibility for current user;
			// keep a safe fallback for locally-created items.
			if (!currentEmployeeId) return appointments;
			return appointments.filter(
				(a) =>
					(a.attendeeEmployeeIds?.length ?? 0) === 0 ||
					a.attendeeEmployeeIds?.includes(currentEmployeeId) ||
					a.employeeIds?.includes(currentEmployeeId)
			);
		}
		if (scope === 'employee' && selectedScopeId) {
			return appointments.filter(
				(a) =>
					a.attendeeEmployeeIds?.includes(selectedScopeId) ||
					a.employeeIds?.includes(selectedScopeId)
			);
		}
		if (scope === 'client' && selectedScopeId) {
			return appointments.filter(
				(a) => a.attendeeClientIds?.includes(selectedScopeId) || a.clientId === selectedScopeId
			);
		}
		return appointments;
	});
</script>

<div class="flex flex-col gap-8">
	<!-- Page Header & Filters -->
	<div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
		<div>
			<h1 class="text-4xl font-bold tracking-tighter text-text">{m.appointments()}</h1>
			<p class="text-text-muted">{m.appointments_subtitle()}</p>
		</div>

		{#if isAdmin || canViewAllAppointments}
			<div
				class="flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-surface p-4 shadow-sm"
			>
				{#if isAdmin}
					<div class="w-40">
						<Select
							label={m.scope()}
							options={[
								{ label: m.my_calendar(), value: 'my' },
								{ label: m.all(), value: 'all' },
								{ label: m.by_employee(), value: 'employee' },
								{ label: m.by_client(), value: 'client' }
							]}
							bind:value={scope}
						/>
					</div>

					{#if scope === 'employee'}
						<div class="w-60">
							<Select
								label={m.select_employee()}
								options={employeeOptions}
								bind:value={selectedScopeId}
								placeholder={m.choose_employee()}
							/>
						</div>
					{:else if scope === 'client'}
						<div class="w-60">
							<Select
								label={m.select_client()}
								options={clientOptions}
								bind:value={selectedScopeId}
								placeholder={m.choose_client()}
							/>
						</div>
					{/if}
				{/if}

				<!-- Employee filter for users with APPOINTMENT.VIEW_ALL permission -->
				<PermissionGuard permission="APPOINTMENT.VIEW_ALL">
					<div class="w-60">
						<Select
							label={m.filter_by_employee()}
							options={[{ label: m.all_employees(), value: '' }, ...employeeOptions]}
							bind:value={filteredEmployeeId}
							placeholder={m.select_employee_placeholder()}
						/>
					</div>
				</PermissionGuard>
			</div>
		{/if}
	</div>

	{#if loadError}
		<InlineErrorBanner title={m.unable_to_load_appointments()} message={loadError} />
	{/if}

	{#if saveError}
		<InlineErrorBanner title={m.unable_to_save_appointment()} message={saveError} />
	{/if}

	<!-- Calendar View -->
	<Calendar
		appointments={filteredAppointments}
		onAddAppointment={handleAddAppointment}
		onEditAppointment={handleEditAppointment}
		onRangeChange={handleRangeChange}
		loading={isLoadingAppointments}
	/>
</div>

<!-- Appointment Modal -->
<Modal
	title={selectedAppointment?.id ? m.edit_appointment() : m.new_appointment()}
	description={selectedAppointment?.id
		? m.edit_appointment_description()
		: m.new_appointment_description()}
	bind:open={isModalOpen}
>
	<AppointmentForm
		appointment={selectedAppointment || {}}
		onSave={handleSaveAppointment}
		loading={isSavingAppointment}
		onCancel={() => (isModalOpen = false)}
	/>
</Modal>
