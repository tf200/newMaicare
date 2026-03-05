<script lang="ts">
	import { superForm, defaults } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
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
	import { formatFormError } from '$lib/utils/form-errors';
	import { m } from '$lib/paraglide/messages';
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
	import { IncidentSchema, type IncidentInput } from '$lib/schemas/incident';

	let {
		open = $bindable(false),
		incidentId = null,
		initialIncident = null,
		preselectedClientId = null,
		preselectedClientDisplay = '',
		onCreated
	} = $props<{
		open?: boolean;
		incidentId?: string | null;
		initialIncident?: IncidentDetail | null;
		preselectedClientId?: string | null;
		preselectedClientDisplay?: string;
		onCreated?: () => void;
	}>();

	let errorMessage = $state('');
	let clientDisplay = $state('');
	let employeeDisplay = $state('');
	let locationDisplay = $state('');
	const formId = 'create-incident-form';

	const isEditMode = $derived(Boolean(incidentId));

	const { form, errors, enhance, delayed, reset } = superForm(
		defaults(
			{
				client_id: '',
				employee_id: '',
				location_id: '',
				reporter_involvement: '',
				informed_parties: [],
				incident_type: '',
				severity_of_incident: '',
				recurrence_risk: '',
				physical_injury: '',
				needed_consultation: '',
				cause_categories: [],
				follow_up_actions: [],
				occurred_at: new Date().toISOString(),
				incident_explanation: '',
				incident_prevent_steps: '',
				incident_taken_measures: '',
				cause_explanation: '',
				physical_injury_desc: '',
				psychological_damage: '',
				psychological_damage_desc: '',
				follow_up_notes: '',
				additional_details: '',
				is_employee_absent: false,
				emails: ''
			} as unknown as IncidentInput,
			valibotClient(IncidentSchema)
		),
		{
			validators: valibotClient(IncidentSchema),
			SPA: true,
			dataType: 'json',
			onUpdate: async ({ form }) => {
				if (form.valid) {
					try {
						const payload: CreateIncidentRequest = {
							...form.data,
							employee_id: form.data.employee_id || undefined,
							location_id: form.data.location_id || undefined,
							incident_explanation: form.data.incident_explanation || null,
							incident_prevent_steps: form.data.incident_prevent_steps || null,
							incident_taken_measures: form.data.incident_taken_measures || null,
							cause_explanation: form.data.cause_explanation || null,
							physical_injury_desc: form.data.physical_injury_desc || null,
							psychological_damage: form.data.psychological_damage || undefined,
							psychological_damage_desc: form.data.psychological_damage_desc || null,
							follow_up_notes: form.data.follow_up_notes || null,
							additional_details: form.data.additional_details || null,
							informed_parties:
								form.data.informed_parties.length > 0
									? (form.data.informed_parties as CreateIncidentInformedParty[])
									: undefined,
							cause_categories:
								form.data.cause_categories.length > 0
									? (form.data.cause_categories as IncidentCauseCategory[])
									: undefined,
							follow_up_actions:
								form.data.follow_up_actions.length > 0
									? (form.data.follow_up_actions as IncidentFollowUpAction[])
									: undefined,
							emails: parseEmails(form.data.emails)
						};

						if (isEditMode && incidentId) {
							await updateIncident(incidentId, payload);
						} else {
							await createIncident(form.data.client_id, payload);
						}
						onCreated?.();
						reset();
						open = false;
					} catch (error) {
						errorMessage = error instanceof Error ? error.message : m.failed_save_incident();
					}
				}
			}
		}
	);

	const reporterOptions: Array<{ value: IncidentReporterInvolvement; label: string }> = [
		{ value: 'directly_involved', label: m.directly_involved() },
		{ value: 'witness', label: m.witness() },
		{ value: 'found_afterwards', label: m.found_afterwards() },
		{ value: 'alarmed', label: m.alarmed() }
	];

	const informedPartyOptions: Array<{ value: CreateIncidentInformedParty; label: string }> = [
		{ value: 'family', label: m.family() },
		{ value: 'manager', label: m.manager() }
	];

	const severityOptions: Array<{ value: IncidentSeverity; label: string }> = [
		{ value: 'near_incident', label: m.near_incident() },
		{ value: 'less_serious', label: m.less_serious() },
		{ value: 'serious', label: m.serious() },
		{ value: 'fatal', label: m.fatal() }
	];

	const incidentTypeOptions: Array<{ value: IncidentType; label: string }> = [
		{ value: 'passing_away', label: m.passing_away() },
		{ value: 'self_harm', label: m.self_harm() },
		{ value: 'violence', label: m.violence() },
		{ value: 'fire_water_damage', label: m.fire_water_damage() },
		{ value: 'accident', label: m.accident() },
		{ value: 'client_absence', label: m.client_absence() },
		{ value: 'medicines', label: m.medicines() },
		{ value: 'organization', label: m.organization() },
		{ value: 'use_prohibited_substances', label: m.use_prohibited_substances() },
		{ value: 'other', label: m.other() }
	];

	const recurrenceRiskOptions: Array<{ value: IncidentRecurrenceRisk; label: string }> = [
		{ value: 'very_low', label: m.very_low() },
		{ value: 'means', label: m.medium() },
		{ value: 'high', label: m.high() },
		{ value: 'very_high', label: m.very_high() }
	];

	const causeCategoryOptions: Array<{ value: IncidentCauseCategory; label: string }> = [
		{ value: 'internal_personal', label: m.internal_personal() },
		{ value: 'external_environmental', label: m.external_environmental() },
		{ value: 'organizational', label: m.organizational() },
		{ value: 'technical', label: m.technical() },
		{ value: 'employee_related', label: m.employee_related() },
		{ value: 'client_related', label: m.client_related() },
		{ value: 'other', label: m.other() }
	];

	const physicalInjuryOptions: Array<{ value: IncidentPhysicalInjury; label: string }> = [
		{ value: 'no_injuries', label: m.no_injuries() },
		{ value: 'not_noticeable_yet', label: m.not_noticeable_yet() },
		{ value: 'bruising_swelling', label: m.bruising_swelling() },
		{ value: 'skin_injury', label: m.skin_injury() },
		{ value: 'broken_bones', label: m.broken_bones() },
		{ value: 'shortness_of_breath', label: m.shortness_of_breath() },
		{ value: 'death', label: m.death() },
		{ value: 'other', label: m.other() }
	];

	const neededConsultationOptions: Array<{ value: IncidentNeededConsultation; label: string }> = [
		{ value: 'no', label: m.no() },
		{ value: 'not_clear', label: m.not_clear() },
		{ value: 'hospitalization', label: m.hospitalization() },
		{ value: 'consult_gp', label: m.consult_gp() }
	];

	const followUpActionOptions: Array<{ value: IncidentFollowUpAction; label: string }> = [
		{ value: 'medical_check', label: m.medical_check() },
		{ value: 'family_contact', label: m.family_contact() },
		{ value: 'internal_review', label: m.internal_review() },
		{ value: 'official_report', label: m.official_report() },
		{ value: 'notify_inspectorate', label: m.notify_inspectorate() },
		{ value: 'other', label: m.other() }
	];

	const toEditableInformedParty = (value: InformedParty): CreateIncidentInformedParty | null => {
		if (value === 'care_coordinator') return 'manager';
		if (value === 'parents_guardians') return 'family';
		return null;
	};

	const toFormFromIncident = (incident: IncidentDetail): IncidentInput => ({
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

	const parseEmails = (value: string): string[] =>
		value
			.split(/[\n,;]+/)
			.map((email) => email.trim())
			.filter((email) => email.length > 0);

	const handleCancel = () => {
		reset();
		open = false;
	};

	let wasOpen = $state(false);

	$effect(() => {
		if (open && !wasOpen) {
			if (!isEditMode || !initialIncident) {
				if (!incidentId) {
					reset();
					if (preselectedClientId) {
						$form.client_id = preselectedClientId;
						clientDisplay = preselectedClientDisplay;
					}
				}
			} else {
				const initialData = toFormFromIncident(initialIncident);
				reset({ data: initialData });
				clientDisplay =
					`${initialIncident.clientFirstName} ${initialIncident.clientLastName}`.trim();
				employeeDisplay =
					`${initialIncident.employeeFirstName} ${initialIncident.employeeLastName}`.trim();
				locationDisplay = initialIncident.locationName;
				errorMessage = '';
			}
		}
		wasOpen = open;
	});

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
		<span class="text-xs text-text-muted">{m.bsn()}: {client.bsn}</span>
	</div>
{/snippet}

{#snippet employeeItem(employee: EmployeeListItem)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{employee.first_name} {employee.last_name}</span>
		<span class="text-xs text-text-muted">{m.bsn()}: {employee.bsn}</span>
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
	title={isEditMode ? m.edit_incident() : m.create_incident()}
	description={isEditMode ? m.update_incident_description() : m.create_incident_description()}
	size="4xl"
>
	<form id={formId} use:enhance class="space-y-6">
		{#if errorMessage}
			<div class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
				{errorMessage}
			</div>
		{/if}

		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.core_details()}
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<SearchSelect
					label={m.client()}
					loadOptions={loadClients}
					bind:value={$form.client_id}
					bind:displayValue={clientDisplay}
					error={formatFormError($errors.client_id)}
					item={clientItem}
					labelFn={(client) => `${client.first_name} ${client.last_name}`}
					valueFn={(client) => client.id}
					placeholder={m.search_client_placeholder()}
					disabled={isEditMode}
				/>
				<SearchSelect
					label={m.employee()}
					loadOptions={loadEmployees}
					bind:value={$form.employee_id}
					bind:displayValue={employeeDisplay}
					item={employeeItem}
					labelFn={(employee) => `${employee.first_name} ${employee.last_name}`}
					valueFn={(employee) => employee.id}
					placeholder={m.search_employee_placeholder()}
				/>
				<SearchSelect
					label={m.location()}
					loadOptions={loadLocations}
					bind:value={$form.location_id}
					bind:displayValue={locationDisplay}
					item={locationItem}
					labelFn={(location) => location.name}
					valueFn={(location) => location.id}
					placeholder={m.search_location_placeholder()}
				/>
				<DateTimePicker label={m.occurred_at()} bind:value={$form.occurred_at} />
				<Select
					label={m.reporter_involvement()}
					bind:value={$form.reporter_involvement}
					options={reporterOptions}
					placeholder={m.select_involvement()}
					error={formatFormError($errors.reporter_involvement)}
				/>
				<Select
					label={m.incident_type()}
					bind:value={$form.incident_type}
					options={incidentTypeOptions}
					placeholder={m.select_incident_type()}
					error={formatFormError($errors.incident_type)}
				/>
				<Select
					label={m.severity()}
					bind:value={$form.severity_of_incident}
					options={severityOptions}
					placeholder={m.select_severity()}
					error={formatFormError($errors.severity_of_incident)}
				/>
				<Select
					label={m.recurrence_risk()}
					bind:value={$form.recurrence_risk}
					options={recurrenceRiskOptions}
					placeholder={m.select_recurrence_risk()}
					error={formatFormError($errors.recurrence_risk)}
				/>
			</div>
		</section>

		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.impact_cause()}
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<Select
					label={m.physical_injury()}
					bind:value={$form.physical_injury}
					options={physicalInjuryOptions}
					placeholder={m.select_injury_status()}
					error={formatFormError($errors.physical_injury)}
				/>
				<Select
					label={m.consultation_needed()}
					bind:value={$form.needed_consultation}
					options={neededConsultationOptions}
					placeholder={m.select_consultation()}
					error={formatFormError($errors.needed_consultation)}
				/>
				<MultiSelect
					label={m.informed_parties()}
					bind:value={$form.informed_parties}
					options={informedPartyOptions}
					placeholder={m.select_informed_parties()}
				/>
				<MultiSelect
					label={m.cause_categories()}
					bind:value={$form.cause_categories}
					options={causeCategoryOptions}
					placeholder={m.select_cause_categories()}
				/>
			</div>

			<Textarea
				label={m.incident_explanation()}
				placeholder={m.placeholder_incident_explanation()}
				rows={4}
				bind:value={$form.incident_explanation}
			/>
			<Textarea
				label={m.cause_explanation()}
				placeholder={m.placeholder_cause_explanation()}
				rows={3}
				bind:value={$form.cause_explanation}
			/>
			<Textarea
				label={m.physical_injury_details()}
				placeholder={m.placeholder_physical_injury_details()}
				rows={3}
				bind:value={$form.physical_injury_desc}
			/>
			<Input
				label={m.psychological_damage()}
				placeholder={m.placeholder_psychological_damage()}
				bind:value={$form.psychological_damage}
			/>
			<Textarea
				label={m.psychological_damage_details()}
				placeholder={m.placeholder_psychological_damage_details()}
				rows={3}
				bind:value={$form.psychological_damage_desc}
			/>
		</section>

		<section class="space-y-4">
			<h3 class="border-b border-border pb-2 text-sm font-bold tracking-wide text-text uppercase">
				{m.follow_up()}
			</h3>
			<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
				<MultiSelect
					label={m.follow_up_actions()}
					bind:value={$form.follow_up_actions}
					options={followUpActionOptions}
					placeholder={m.select_follow_up_actions()}
				/>
				<div class="rounded-xl border border-border bg-surface/50 p-4">
					<Checkbox label={m.employee_absent_incident()} bind:checked={$form.is_employee_absent} />
				</div>
			</div>

			<Textarea
				label={m.prevention_steps()}
				placeholder={m.placeholder_prevention_steps()}
				rows={3}
				bind:value={$form.incident_prevent_steps}
			/>
			<Textarea
				label={m.taken_measures()}
				placeholder={m.placeholder_taken_measures()}
				rows={3}
				bind:value={$form.incident_taken_measures}
			/>
			<Textarea
				label={m.follow_up_notes()}
				placeholder={m.placeholder_follow_up_notes()}
				rows={3}
				bind:value={$form.follow_up_notes}
			/>
			<Textarea
				label={m.additional_details()}
				placeholder={m.placeholder_additional_details()}
				rows={3}
				bind:value={$form.additional_details}
			/>
			<Textarea
				label={m.notification_emails()}
				placeholder={m.placeholder_notification_emails()}
				rows={3}
				bind:value={$form.emails}
				error={formatFormError($errors.emails)}
			/>
		</section>
		<button type="submit" class="hidden" aria-hidden="true"></button>
	</form>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<Button variant="ghost" onclick={handleCancel} disabled={$delayed}>{m.cancel()}</Button>
			<Button variant="secondary" class="gap-2" form={formId} type="submit" isLoading={$delayed}>
				<Plus class="h-4 w-4" />
				{$delayed
					? isEditMode
						? m.updating_incident()
						: m.creating_incident()
					: isEditMode
						? m.update_incident()
						: m.create_incident_action()}
			</Button>
		</div>
	{/snippet}
</Modal>
