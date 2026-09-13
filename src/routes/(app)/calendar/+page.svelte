<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { CalendarDays } from 'lucide-svelte';
	import { listClients } from '$lib/api/clients';
	import { listEmployees } from '$lib/api/employees';
	import { createEvent, getEvent, listEvents, updateEvent } from '$lib/api/events';
	import AppointmentForm from '$lib/components/forms/AppointmentForm.svelte';
	import Calendar from '$lib/components/ui/Calendar.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { m } from '$lib/paraglide/messages';
	import { getAuthState } from '$lib/state/auth.svelte';
	import { getToastState } from '$lib/state/toast.svelte';
	import type { Appointment } from '$lib/types/appointments';
	import type { PageProps } from './$types';
	import type {
		CreateEventReminderInput,
		CreateEventResponse,
		EventOccurrenceResponse,
		UpdateEventRequest
	} from '$lib/types/api';

	type CalendarRange = { start: Date; end: Date };
	type EmployeeOption = { label: string; value: string };
	type AttendeeOption = { label: string; value: string };

	let { data }: PageProps = $props();

	const auth = getAuthState();
	const toast = getToastState();

	let appointments = $state.raw<Appointment[]>([]);
	let currentRange = $state<CalendarRange | null>(null);
	let isLoadingAppointments = $state(false);
	let rangeLoadError = $state<string | null>(null);
	let detailLoadError = $state<string | null>(null);
	let requestSequence = 0;
	let requestController: AbortController | null = null;
	let detailRequestSequence = 0;
	let detailRequestController: AbortController | null = null;

	let isModalOpen = $state(false);
	let selectedAppointment = $state.raw<Partial<Appointment> | null>(null);
	let workflowKey = $state(0);
	let formDirty = $state(false);
	let isLoadingAppointment = $state(false);
	let isSavingAppointment = $state(false);
	let saveError = $state<string | null>(null);

	let filteredEmployeeId = $derived(data.initial.employeeId);
	let filteredEmployeeLabel = $state('');
	let hasLoadedRange = $state(false);

	$effect(() => {
		void data.employeeLabel.then((label) => {
			if (filteredEmployeeId === data.initial.employeeId) filteredEmployeeLabel = label;
		});
	});

	const canCreateAppointments = $derived(auth.hasPermission(PERMISSIONS.APPOINTMENT.CREATE));
	const canEditAppointments = $derived(auth.hasPermission(PERMISSIONS.APPOINTMENT.UPDATE));
	const canViewAllAppointments = $derived(auth.hasPermission(PERMISSIONS.APPOINTMENT.VIEW_ALL));

	$effect(() => () => {
		requestController?.abort();
		detailRequestController?.abort();
	});

	function mapOccurrence(event: EventOccurrenceResponse): Appointment {
		const attendeeEmployeeIds = event.attendee_employee_ids ?? [];
		const attendeeClientIds = event.attendee_client_ids ?? [];

		return {
			id: event.id,
			kind: event.kind,
			title: event.title,
			description: event.description,
			location: event.location,
			color: event.color,
			start: event.start_at,
			end: event.end_at,
			masterEventId: event.master_event_id ?? undefined,
			recurrenceId: event.recurrence_id ?? undefined,
			isRecurringInstance: event.is_recurring_instance,
			attendeeEmployeeIds,
			attendeeClientIds,
			employeeIds: attendeeEmployeeIds,
			clientId: attendeeClientIds[0],
			createdAt: event.start_at,
			updatedAt: event.start_at
		};
	}

	function mapEvent(event: CreateEventResponse, occurrence?: Appointment): Appointment {
		const attendeeEmployeeIds = event.attendee_employee_ids ?? [];
		const attendeeClientIds = event.attendee_client_ids ?? [];
		return {
			id: event.id,
			kind: event.kind,
			title: event.title,
			description: event.description,
			location: event.location,
			color: event.color,
			start: occurrence?.start ?? event.start_at,
			end: occurrence?.end ?? event.end_at,
			masterStart: event.start_at,
			masterEnd: event.end_at,
			occurrenceStart: occurrence?.start,
			occurrenceEnd: occurrence?.end,
			rrule: event.rrule ?? undefined,
			masterEventId: occurrence?.masterEventId ?? event.recurring_event_id ?? undefined,
			recurrenceId: occurrence?.recurrenceId ?? event.recurrence_id ?? undefined,
			isRecurringInstance: occurrence?.isRecurringInstance ?? Boolean(event.recurrence_id),
			mutationScope: occurrence?.isRecurringInstance ? 'single' : 'series',
			attendeeEmployeeIds,
			attendeeClientIds,
			reminders: event.reminders.map((reminder) => ({
				id: reminder.id,
				minutes_before: reminder.minutes_before ?? undefined,
				remind_at: reminder.remind_at ?? undefined
			})),
			employeeIds: attendeeEmployeeIds,
			clientId: attendeeClientIds[0],
			status: event.status === 'cancelled' ? 'cancelled' : 'scheduled',
			createdAt: event.created_at,
			updatedAt: event.updated_at
		};
	}

	async function fetchEvents(start: Date, end: Date) {
		requestController?.abort();
		const controller = new AbortController();
		requestController = controller;
		const sequence = ++requestSequence;
		isLoadingAppointments = true;
		rangeLoadError = null;

		try {
			const response = await listEvents(
				{
					start_at: start.toISOString(),
					end_at: end.toISOString(),
					...(canViewAllAppointments && filteredEmployeeId
						? { employee_id: filteredEmployeeId }
						: {})
				},
				{ signal: controller.signal }
			);
			if (sequence !== requestSequence) return;
			appointments = response.data.map(mapOccurrence);
			hasLoadedRange = true;
		} catch (error) {
			if (controller.signal.aborted || sequence !== requestSequence) return;
			console.error('Failed to load events:', error);
			rangeLoadError = m.calendar_load_error();
			hasLoadedRange = true;
		} finally {
			if (sequence === requestSequence) isLoadingAppointments = false;
		}
	}

	function handleRangeChange(range: CalendarRange) {
		currentRange = range;
		void fetchEvents(range.start, range.end);
	}

	function handleEmployeeFilterChange() {
		const url = new URL(page.url);
		if (filteredEmployeeId) url.searchParams.set('employee', filteredEmployeeId);
		else url.searchParams.delete('employee');
		// The path is resolved; the query string is appended separately to preserve typed routing.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(resolve('/(app)/calendar') + url.search, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
		if (currentRange) void fetchEvents(currentRange.start, currentRange.end);
	}

	async function loadEmployeeOptions(query: string): Promise<EmployeeOption[]> {
		const response = await listEmployees({ page: 1, pageSize: 20, search: query || undefined });
		return response.data.results.map((employee) => ({
			label: `${employee.first_name} ${employee.last_name}`,
			value: employee.id
		}));
	}

	async function loadAttendeeEmployeeOptions(query: string): Promise<AttendeeOption[]> {
		const response = await listEmployees({ page: 1, pageSize: 50, search: query || undefined });
		return response.data.results.map((employee) => ({
			label: `${employee.first_name} ${employee.last_name}`.trim(),
			value: employee.id
		}));
	}

	async function loadClientOptions(query: string): Promise<AttendeeOption[]> {
		const response = await listClients({ page: 1, pageSize: 50, search: query || undefined });
		return response.data.results.map((client) => ({
			label: `${client.first_name} ${client.last_name}`.trim(),
			value: client.id
		}));
	}

	function openWorkflow(appointment: Partial<Appointment>) {
		selectedAppointment = appointment;
		saveError = null;
		formDirty = false;
		workflowKey += 1;
		isModalOpen = true;
	}

	function handleAddAppointment(date: Date) {
		if (!canCreateAppointments) return;
		openWorkflow({
			start: date.toISOString(),
			end: new Date(date.getTime() + 3_600_000).toISOString()
		});
	}

	async function handleEditAppointment(occurrence: Appointment) {
		if (!canEditAppointments) return;
		detailRequestController?.abort();
		const controller = new AbortController();
		detailRequestController = controller;
		const sequence = ++detailRequestSequence;
		selectedAppointment = occurrence;
		detailLoadError = null;
		formDirty = false;
		workflowKey += 1;
		isModalOpen = true;
		isLoadingAppointment = true;
		try {
			const response = await getEvent(occurrence.id, { signal: controller.signal });
			let appointment = mapEvent(response.data, occurrence);
			if (occurrence.masterEventId && occurrence.masterEventId !== occurrence.id) {
				const masterResponse = await getEvent(occurrence.masterEventId, {
					signal: controller.signal
				});
				appointment = {
					...appointment,
					masterStart: masterResponse.data.start_at,
					masterEnd: masterResponse.data.end_at,
					rrule: masterResponse.data.rrule ?? undefined
				};
			}
			if (sequence !== detailRequestSequence) return;
			selectedAppointment = appointment;
			workflowKey += 1;
		} catch (error) {
			if (controller.signal.aborted || sequence !== detailRequestSequence) return;
			console.error('Failed to load event details:', error);
			detailLoadError = m.calendar_event_details_error();
		} finally {
			if (sequence === detailRequestSequence) isLoadingAppointment = false;
		}
	}

	function closeWorkflow(requireConfirmation = true) {
		if (isSavingAppointment) return;
		if (requireConfirmation && formDirty && !window.confirm(m.discard_appointment_changes()))
			return;
		isModalOpen = false;
		detailRequestController?.abort();
		selectedAppointment = null;
		saveError = null;
		detailLoadError = null;
		formDirty = false;
	}

	function mapReminders(appointment: Partial<Appointment>): CreateEventReminderInput[] | undefined {
		const reminders = appointment.reminders
			?.map((reminder): CreateEventReminderInput | null => {
				if (typeof reminder.minutes_before === 'number') {
					return { minutes_before: reminder.minutes_before };
				}
				if (reminder.remind_at) return { remind_at: reminder.remind_at };
				return null;
			})
			.filter((reminder): reminder is CreateEventReminderInput => reminder !== null);
		return reminders?.length ? reminders : [];
	}

	async function handleSaveAppointment(payload: Partial<Appointment>) {
		if (!payload.start || !payload.end || !payload.title) {
			saveError = m.calendar_dates_required();
			return;
		}

		const commonPayload = {
			title: payload.title,
			description: payload.description?.trim() || undefined,
			location: payload.location?.trim() || undefined,
			color: payload.color || undefined,
			start_at: payload.start,
			end_at: payload.end,
			rrule: payload.rrule || undefined,
			attendee_employee_ids: payload.attendeeEmployeeIds ?? [],
			attendee_client_ids: payload.attendeeClientIds ?? [],
			reminders: mapReminders(payload)
		};

		isSavingAppointment = true;
		saveError = null;
		try {
			if (payload.id) {
				if (!canEditAppointments) return;
				const scope = payload.mutationScope ?? 'series';
				const targetId = payload.isRecurringInstance
					? (payload.masterEventId ?? payload.id)
					: payload.id;
				const updatePayload: UpdateEventRequest = {
					...commonPayload,
					scope,
					...(scope === 'single' ? { reminders: undefined } : {}),
					...(payload.recurrenceId ? { recurrence_id: payload.recurrenceId } : {})
				};
				await updateEvent(targetId, updatePayload);
				toast.success(m.appointment_updated_success());
			} else {
				if (!canCreateAppointments) return;
				await createEvent({ kind: payload.kind ?? 'appointment', ...commonPayload });
				toast.success(m.appointment_created_success());
			}

			closeWorkflow(false);
			if (currentRange) await fetchEvents(currentRange.start, currentRange.end);
		} catch (error) {
			console.error('Failed to save event:', error);
			saveError = m.calendar_save_error();
		} finally {
			isSavingAppointment = false;
		}
	}
</script>

<svelte:head>
	<title>{m.appointments()} | MaiCare</title>
</svelte:head>

<section class="space-y-6">
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface/90 p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-20 -right-12 h-52 w-52 rounded-full bg-linear-to-br from-brand/15 to-success/10 blur-2xl"
		></div>
		<div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
			<div class="space-y-3">
				<div class="flex items-center gap-3 text-sm font-semibold text-brand-strong">
					<span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10">
						<CalendarDays aria-hidden="true" class="h-5 w-5" />
					</span>
					<span>{m.calendar_schedule()}</span>
				</div>
				<h1 class="text-2xl font-bold tracking-tight text-text">{m.appointments()}</h1>
				<p class="max-w-2xl text-sm font-medium text-text-muted">{m.appointments_subtitle()}</p>
			</div>

			{#if canViewAllAppointments}
				<div class="w-full lg:w-80">
					<SearchSelect
						label={m.filter_by_employee()}
						loadOptions={loadEmployeeOptions}
						bind:value={filteredEmployeeId}
						bind:displayValue={filteredEmployeeLabel}
						placeholder={m.all_employees()}
						searchPlaceholder={m.search_employees()}
						loadErrorText={m.calendar_employee_options_error()}
						onchange={handleEmployeeFilterChange}
					/>
				</div>
			{/if}
		</div>
	</header>

	{#if rangeLoadError}
		<InlineErrorBanner
			title={m.unable_to_load_appointments()}
			message={rangeLoadError}
			onRetry={currentRange ? () => fetchEvents(currentRange!.start, currentRange!.end) : undefined}
		/>
	{/if}

	<Calendar
		{appointments}
		onAddAppointment={canCreateAppointments ? handleAddAppointment : undefined}
		onEditAppointment={canEditAppointments ? handleEditAppointment : undefined}
		onRangeChange={handleRangeChange}
		loading={isLoadingAppointments}
		initialLoading={isLoadingAppointments && !hasLoadedRange}
		hasLoaded={hasLoadedRange}
	/>
</section>

<Modal
	title={selectedAppointment?.id ? m.edit_appointment() : m.new_appointment()}
	description={selectedAppointment?.id
		? m.edit_appointment_description()
		: m.new_appointment_description()}
	bind:open={isModalOpen}
	dismissible={!formDirty && !isSavingAppointment}
	loading={isLoadingAppointment}
	loadingLabel={m.calendar_loading_details()}
	closeLabel={m.close()}
	onClose={() => closeWorkflow(false)}
>
	{#if detailLoadError}
		<div class="mb-6">
			<InlineErrorBanner title={m.unable_to_load_appointments()} message={detailLoadError} />
		</div>
	{:else if saveError}
		<div class="mb-6">
			<InlineErrorBanner title={m.unable_to_save_appointment()} message={saveError} />
		</div>
	{/if}

	{#if !detailLoadError}
		{#key workflowKey}
			<AppointmentForm
				appointment={selectedAppointment ?? {}}
				onSave={handleSaveAppointment}
				loading={isSavingAppointment}
				loadEmployeeOptions={loadAttendeeEmployeeOptions}
				{loadClientOptions}
				onCancel={() => closeWorkflow()}
				onDirtyChange={(dirty) => (formDirty = dirty)}
			/>
		{/key}
	{/if}
</Modal>
