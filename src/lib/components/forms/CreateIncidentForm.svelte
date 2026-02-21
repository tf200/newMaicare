<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { createIncident, updateIncident } from '$lib/api/incidents';
	import { listClients } from '$lib/api/clients';
	import { listEmployees, type EmployeeListItem } from '$lib/api/employees';
	import { listLocations } from '$lib/api/locations';
	import Button from '$lib/components/ui/Button.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import DateTimePicker from '$lib/components/ui/DateTimePicker.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import type {
		CreateIncidentInformedParty,
		CreateIncidentRequest,
		IncidentCauseCategory,
		IncidentFollowUpAction,
		IncidentNeededConsultation,
		IncidentPhysicalInjury,
		IncidentRecurrenceRisk,
		IncidentReporterInvolvement,
		ListClientsResponse,
		OrganizationLocation
	} from '$lib/types/api';
	import type {
		IncidentDetail,
		InformedParty,
		IncidentSeverity,
		IncidentType
	} from '$lib/types/incidents';

	let {
		open = $bindable(false),
		incidentId = null,
		initialIncident = null,
		onCreated
	} = $props<{
		open?: boolean;
		incidentId?: string | null;
		initialIncident?: IncidentDetail | null;
		onCreated?: () => void;
	}>();

	const createInitialForm = () => ({
		client_id: '',
		employee_id: '',
		location_id: '',
		reporter_involvement: '' as '' | IncidentReporterInvolvement,
		informed_parties: [] as CreateIncidentInformedParty[],
		occurred_at: new Date().toISOString(),
		incident_type: '' as '' | IncidentType,
		severity_of_incident: '' as '' | IncidentSeverity,
		incident_explanation: '',
		recurrence_risk: '' as '' | IncidentRecurrenceRisk,
		incident_prevent_steps: '',
		incident_taken_measures: '',
		cause_categories: [] as IncidentCauseCategory[],
		cause_explanation: '',
		physical_injury: '' as '' | IncidentPhysicalInjury,
		physical_injury_desc: '',
		psychological_damage: '',
		psychological_damage_desc: '',
		needed_consultation: '' as '' | IncidentNeededConsultation,
		follow_up_actions: [] as IncidentFollowUpAction[],
		follow_up_notes: '',
		is_employee_absent: false,
		additional_details: '',
		emails: ''
	});

	let formData = $state(createInitialForm());
	let errors = $state<Record<string, string>>({});
	let isLoading = $state(false);
	let errorMessage = $state('');
	let clientDisplay = $state('');
	let employeeDisplay = $state('');
	let locationDisplay = $state('');

	const isEditMode = $derived(Boolean(incidentId));

	const reporterOptions: Array<{ value: IncidentReporterInvolvement; label: string }> = [
		{ value: 'directly_involved', label: 'Directly involved' },
		{ value: 'witness', label: 'Witness' },
		{ value: 'found_afterwards', label: 'Found afterwards' },
		{ value: 'alarmed', label: 'Alarmed' }
	];

	const informedPartyOptions: Array<{ value: CreateIncidentInformedParty; label: string }> = [
		{ value: 'family', label: 'Family' },
		{ value: 'manager', label: 'Manager' }
	];

	const severityOptions: Array<{ value: IncidentSeverity; label: string }> = [
		{ value: 'near_incident', label: 'Near incident' },
		{ value: 'less_serious', label: 'Less serious' },
		{ value: 'serious', label: 'Serious' },
		{ value: 'fatal', label: 'Fatal' }
	];

	const incidentTypeOptions: Array<{ value: IncidentType; label: string }> = [
		{ value: 'passing_away', label: 'Passing away' },
		{ value: 'self_harm', label: 'Self harm' },
		{ value: 'violence', label: 'Violence' },
		{ value: 'fire_water_damage', label: 'Fire / water damage' },
		{ value: 'accident', label: 'Accident' },
		{ value: 'client_absence', label: 'Client absence' },
		{ value: 'medicines', label: 'Medicines' },
		{ value: 'organization', label: 'Organization' },
		{ value: 'use_prohibited_substances', label: 'Use prohibited substances' },
		{ value: 'other', label: 'Other' }
	];

	const recurrenceRiskOptions: Array<{ value: IncidentRecurrenceRisk; label: string }> = [
		{ value: 'very_low', label: 'Very low' },
		{ value: 'means', label: 'Medium' },
		{ value: 'high', label: 'High' },
		{ value: 'very_high', label: 'Very high' }
	];

	const causeCategoryOptions: Array<{ value: IncidentCauseCategory; label: string }> = [
		{ value: 'internal_personal', label: 'Internal / personal' },
		{ value: 'external_environmental', label: 'External / environmental' },
		{ value: 'organizational', label: 'Organizational' },
		{ value: 'technical', label: 'Technical' },
		{ value: 'employee_related', label: 'Employee related' },
		{ value: 'client_related', label: 'Client related' },
		{ value: 'other', label: 'Other' }
	];

	const physicalInjuryOptions: Array<{ value: IncidentPhysicalInjury; label: string }> = [
		{ value: 'no_injuries', label: 'No injuries' },
		{ value: 'not_noticeable_yet', label: 'Not noticeable yet' },
		{ value: 'bruising_swelling', label: 'Bruising / swelling' },
		{ value: 'skin_injury', label: 'Skin injury' },
		{ value: 'broken_bones', label: 'Broken bones' },
		{ value: 'shortness_of_breath', label: 'Shortness of breath' },
		{ value: 'death', label: 'Death' },
		{ value: 'other', label: 'Other' }
	];

	const neededConsultationOptions: Array<{ value: IncidentNeededConsultation; label: string }> = [
		{ value: 'no', label: 'No' },
		{ value: 'not_clear', label: 'Not clear' },
		{ value: 'hospitalization', label: 'Hospitalization' },
		{ value: 'consult_gp', label: 'Consult GP' }
	];

	const followUpActionOptions: Array<{ value: IncidentFollowUpAction; label: string }> = [
		{ value: 'medical_check', label: 'Medical check' },
		{ value: 'family_contact', label: 'Family contact' },
		{ value: 'internal_review', label: 'Internal review' },
		{ value: 'official_report', label: 'Official report' },
		{ value: 'notify_inspectorate', label: 'Notify inspectorate' },
		{ value: 'other', label: 'Other' }
	];

	const toNull = (value: string) => {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	};

	const toUndefined = (value: string) => {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : undefined;
	};

	const parseEmails = (value: string) =>
		Array.from(
			new Set(
				value
					.split(/[\n,;]+/)
					.map((email) => email.trim())
					.filter((email) => email.length > 0)
			)
		);

	const toEditableInformedParty = (value: InformedParty): CreateIncidentInformedParty | null => {
		if (value === 'care_coordinator') return 'manager';
		if (value === 'parents_guardians') return 'family';
		return null;
	};

	const toFormFromIncident = (incident: IncidentDetail) => ({
		client_id: incident.clientId,
		employee_id: incident.employeeId ?? '',
		location_id: incident.locationId ?? '',
		reporter_involvement: incident.reporterInvolvement ?? 'directly_involved',
		informed_parties: incident.informedParties
			.map(toEditableInformedParty)
			.filter((value): value is CreateIncidentInformedParty => value !== null),
		occurred_at: incident.occurredAt,
		incident_type: incident.incidentType,
		severity_of_incident: incident.severity,
		incident_explanation: incident.incidentExplanation ?? '',
		recurrence_risk: incident.recurrenceRisk,
		incident_prevent_steps: incident.incidentPreventSteps ?? '',
		incident_taken_measures: incident.incidentTakenMeasures ?? '',
		cause_categories: incident.causeCategories,
		cause_explanation: incident.causeExplanation ?? '',
		physical_injury: incident.physicalInjury,
		physical_injury_desc: incident.physicalInjuryDesc ?? '',
		psychological_damage: incident.psychologicalDamage ?? '',
		psychological_damage_desc: incident.psychologicalDamageDesc ?? '',
		needed_consultation: incident.neededConsultation,
		follow_up_actions: incident.followUpActions,
		follow_up_notes: incident.followUpNotes ?? '',
		is_employee_absent: incident.isEmployeeAbsent,
		additional_details: incident.additionalDetails ?? '',
		emails: (incident.emails ?? []).join(', ')
	});

	const validate = () => {
		const nextErrors: Record<string, string> = {};

		if (!formData.client_id) nextErrors.client_id = 'Client is required';
		if (!formData.reporter_involvement)
			nextErrors.reporter_involvement = 'Reporter involvement is required';
		if (!formData.incident_type) nextErrors.incident_type = 'Incident type is required';
		if (!formData.severity_of_incident) nextErrors.severity_of_incident = 'Severity is required';
		if (!formData.recurrence_risk) nextErrors.recurrence_risk = 'Recurrence risk is required';
		if (!formData.physical_injury) nextErrors.physical_injury = 'Physical injury is required';
		if (!formData.needed_consultation)
			nextErrors.needed_consultation = 'Needed consultation is required';

		const emails = parseEmails(formData.emails);
		const invalidEmail = emails.find((email) => !/^\S+@\S+\.\S+$/.test(email));
		if (invalidEmail) {
			nextErrors.emails = `Invalid email: ${invalidEmail}`;
		}

		errors = nextErrors;
		return Object.keys(nextErrors).length === 0;
	};

	const resetForm = () => {
		formData = createInitialForm();
		errors = {};
		errorMessage = '';
		clientDisplay = '';
		employeeDisplay = '';
		locationDisplay = '';
	};

	$effect(() => {
		if (!open) return;
		if (!isEditMode || !initialIncident) {
			if (!incidentId) {
				resetForm();
			}
			return;
		}

		formData = toFormFromIncident(initialIncident);
		clientDisplay = `${initialIncident.clientFirstName} ${initialIncident.clientLastName}`.trim();
		employeeDisplay =
			`${initialIncident.employeeFirstName} ${initialIncident.employeeLastName}`.trim();
		locationDisplay = initialIncident.locationName;
		errors = {};
		errorMessage = '';
	});

	const handleCancel = () => {
		if (isLoading) return;
		resetForm();
		open = false;
	};

	const handleSubmit = async () => {
		if (isLoading) return;
		errorMessage = '';
		if (!validate()) return;

		const payload: CreateIncidentRequest = {
			client_id: formData.client_id,
			employee_id: toUndefined(formData.employee_id),
			location_id: toUndefined(formData.location_id),
			reporter_involvement: formData.reporter_involvement as IncidentReporterInvolvement,
			informed_parties:
				formData.informed_parties.length > 0 ? [...formData.informed_parties] : undefined,
			occurred_at: formData.occurred_at || new Date().toISOString(),
			incident_type: formData.incident_type as IncidentType,
			severity_of_incident: formData.severity_of_incident as IncidentSeverity,
			incident_explanation: toNull(formData.incident_explanation),
			recurrence_risk: formData.recurrence_risk as IncidentRecurrenceRisk,
			incident_prevent_steps: toNull(formData.incident_prevent_steps),
			incident_taken_measures: toNull(formData.incident_taken_measures),
			cause_categories:
				formData.cause_categories.length > 0 ? [...formData.cause_categories] : undefined,
			cause_explanation: toNull(formData.cause_explanation),
			physical_injury: formData.physical_injury as IncidentPhysicalInjury,
			physical_injury_desc: toNull(formData.physical_injury_desc),
			psychological_damage: toUndefined(formData.psychological_damage),
			psychological_damage_desc: toNull(formData.psychological_damage_desc),
			needed_consultation: formData.needed_consultation as IncidentNeededConsultation,
			follow_up_actions:
				formData.follow_up_actions.length > 0 ? [...formData.follow_up_actions] : undefined,
			follow_up_notes: toNull(formData.follow_up_notes),
			is_employee_absent: formData.is_employee_absent,
			additional_details: toNull(formData.additional_details),
			emails: parseEmails(formData.emails)
		};

		isLoading = true;
		try {
			if (isEditMode && incidentId) {
				await updateIncident(incidentId, payload);
			} else {
				await createIncident(formData.client_id, payload);
			}
			onCreated?.();
			resetForm();
			open = false;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to save incident';
		} finally {
			isLoading = false;
		}
	};

	const loadClients = async (query: string) => {
		const res = await listClients({ page: 1, pageSize: 50, search: query });
		return res.data.results;
	};

	const loadEmployees = async (query: string) => {
		const res = await listEmployees({ page: 1, pageSize: 50, search: query });
		return res.data.results;
	};

	const loadLocations = async (query: string) => {
		const res = await listLocations({ page: 1, pageSize: 50, search: query });
		return res.data.results;
	};
</script>

{#snippet clientItem(client: ListClientsResponse)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{client.first_name} {client.last_name}</span>
		<span class="text-xs text-text-muted">BSN: {client.bsn}</span>
	</div>
{/snippet}

{#snippet employeeItem(employee: EmployeeListItem)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{employee.first_name} {employee.last_name}</span>
		<span class="text-xs text-text-muted">BSN: {employee.bsn}</span>
	</div>
{/snippet}

{#snippet locationItem(location: OrganizationLocation)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{location.name}</span>
		<span class="text-xs text-text-muted">{location.city}</span>
	</div>
{/snippet}

<Modal
	bind:open
	title={isEditMode ? 'Edit Incident' : 'Create Incident'}
	description={isEditMode
		? 'Update incident details and keep reporting data in sync.'
		: 'Register a new incident and capture all required follow-up details.'}
	size="4xl"
>
	<div class="space-y-6">
		{#if errorMessage}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{errorMessage}
			</div>
		{/if}

		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				Core Details
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<SearchSelect
					label="Client"
					loadOptions={loadClients}
					bind:value={formData.client_id}
					bind:displayValue={clientDisplay}
					error={errors.client_id}
					item={clientItem}
					labelFn={(client) => `${client.first_name} ${client.last_name}`}
					valueFn={(client) => client.id}
					placeholder="Search for a client..."
					disabled={isEditMode}
				/>
				<SearchSelect
					label="Employee"
					loadOptions={loadEmployees}
					bind:value={formData.employee_id}
					bind:displayValue={employeeDisplay}
					item={employeeItem}
					labelFn={(employee) => `${employee.first_name} ${employee.last_name}`}
					valueFn={(employee) => employee.id}
					placeholder="Search for an employee..."
				/>
				<SearchSelect
					label="Location"
					loadOptions={loadLocations}
					bind:value={formData.location_id}
					bind:displayValue={locationDisplay}
					item={locationItem}
					labelFn={(location) => location.name}
					valueFn={(location) => location.id}
					placeholder="Search for a location..."
				/>
				<DateTimePicker label="Occurred at" bind:value={formData.occurred_at} />
				<Select
					label="Reporter involvement"
					bind:value={formData.reporter_involvement}
					options={reporterOptions}
					placeholder="Select involvement..."
					error={errors.reporter_involvement}
				/>
				<Select
					label="Incident type"
					bind:value={formData.incident_type}
					options={incidentTypeOptions}
					placeholder="Select incident type..."
					error={errors.incident_type}
				/>
				<Select
					label="Severity"
					bind:value={formData.severity_of_incident}
					options={severityOptions}
					placeholder="Select severity..."
					error={errors.severity_of_incident}
				/>
				<Select
					label="Recurrence risk"
					bind:value={formData.recurrence_risk}
					options={recurrenceRiskOptions}
					placeholder="Select risk..."
					error={errors.recurrence_risk}
				/>
			</div>
		</section>

		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				Impact & Cause
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Select
					label="Physical injury"
					bind:value={formData.physical_injury}
					options={physicalInjuryOptions}
					placeholder="Select injury status..."
					error={errors.physical_injury}
				/>
				<Select
					label="Needed consultation"
					bind:value={formData.needed_consultation}
					options={neededConsultationOptions}
					placeholder="Select consultation..."
					error={errors.needed_consultation}
				/>
				<MultiSelect
					label="Informed parties"
					bind:value={formData.informed_parties}
					options={informedPartyOptions}
					placeholder="Select informed parties..."
				/>
				<MultiSelect
					label="Cause categories"
					bind:value={formData.cause_categories}
					options={causeCategoryOptions}
					placeholder="Select cause categories..."
				/>
			</div>

			<Textarea
				label="Incident explanation"
				placeholder="Describe what happened in detail..."
				rows={4}
				bind:value={formData.incident_explanation}
			/>
			<Textarea
				label="Cause explanation"
				placeholder="Describe root causes and context..."
				rows={3}
				bind:value={formData.cause_explanation}
			/>
			<Textarea
				label="Physical injury details"
				placeholder="Add injury details if applicable..."
				rows={3}
				bind:value={formData.physical_injury_desc}
			/>
			<Input
				label="Psychological damage"
				placeholder="e.g. unrest"
				bind:value={formData.psychological_damage}
			/>
			<Textarea
				label="Psychological damage details"
				placeholder="Add mental impact details if applicable..."
				rows={3}
				bind:value={formData.psychological_damage_desc}
			/>
		</section>

		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				Follow-up
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<MultiSelect
					label="Follow-up actions"
					bind:value={formData.follow_up_actions}
					options={followUpActionOptions}
					placeholder="Select follow-up actions..."
				/>
				<div class="rounded-xl border border-border bg-surface/50 p-4">
					<Checkbox
						label="Employee absent due to incident"
						bind:checked={formData.is_employee_absent}
					/>
				</div>
			</div>

			<Textarea
				label="Prevention steps"
				placeholder="What can prevent this from recurring?"
				rows={3}
				bind:value={formData.incident_prevent_steps}
			/>
			<Textarea
				label="Taken measures"
				placeholder="Which direct measures were taken?"
				rows={3}
				bind:value={formData.incident_taken_measures}
			/>
			<Textarea
				label="Follow-up notes"
				placeholder="Any additional notes for follow-up..."
				rows={3}
				bind:value={formData.follow_up_notes}
			/>
			<Textarea
				label="Additional details"
				placeholder="Other relevant details..."
				rows={3}
				bind:value={formData.additional_details}
			/>
			<Textarea
				label="Notification emails"
				placeholder="name@domain.com, another@domain.com"
				rows={3}
				bind:value={formData.emails}
				error={errors.emails}
			/>
		</section>
	</div>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={isLoading}>Cancel</Button>
			<Button variant="secondary" class="gap-2" onclick={handleSubmit} {isLoading}>
				<Plus class="h-4 w-4" />
				{isLoading
					? isEditMode
						? 'Updating incident...'
						: 'Creating incident...'
					: isEditMode
						? 'Update incident'
						: 'Create incident'}
			</Button>
		</div>
	{/snippet}
</Modal>
