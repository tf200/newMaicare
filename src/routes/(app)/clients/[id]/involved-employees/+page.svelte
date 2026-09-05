<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import { getBreadcrumbsState } from '$lib/state/breadcrumbs.svelte';
	import { getAuthState } from '$lib/state/auth.svelte';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import {
		createInvolvedEmployeeSchema,
		type InvolvedEmployeeFormInput
	} from '$lib/schemas/involved-employee';
	import { formatFormError } from '$lib/utils/form-errors';
	import { createClientCoordinatorSchema } from '$lib/schemas/client-coordinator';
	import {
		BriefcaseBusiness,
		CalendarDays,
		Pencil,
		Plus,
		Trash2,
		UsersRound,
		UserRound
	} from 'lucide-svelte';
	import {
		createClientInvolvedEmployee,
		deleteClientInvolvedEmployee,
		updateClientInvolvedEmployee,
		updateClientCoordinator
	} from '$lib/api/clients';
	import { listEmployees, type EmployeeListItem } from '$lib/api/employees';
	import Button from '$lib/components/ui/Button.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import type {
		ClientCoordinatorAssignment,
		ClientInvolvedEmployee,
		ClientInvolvedEmployeeRole
	} from '$lib/types/api';
	import type {
		CoordinatorLoadResult,
		InvolvedEmployeeRolesLoadResult,
		InvolvedEmployeesLoadResult
	} from './+page';

	let { data } = $props<{
		data: {
			involvedEmployeesData: Promise<InvolvedEmployeesLoadResult>;
			rolesData: Promise<InvolvedEmployeeRolesLoadResult>;
			coordinatorData: Promise<CoordinatorLoadResult>;
			clientName?: string;
		};
	}>();
	const auth = getAuthState();
	const breadcrumbs = getBreadcrumbsState();
	const dataPromise = $derived(data.involvedEmployeesData);
	const rolesPromise = $derived(data.rolesData);
	const coordinatorPromise = $derived(data.coordinatorData);
	const clientId = $derived(page.params.id ?? '');

	let modalOpen = $state(false);
	let editing = $state<ClientInvolvedEmployee | null>(null);
	let saving = $state(false);
	let submissionRequested = $state(false);
	let deletingId = $state<string | null>(null);
	let formError = $state<string | null>(null);
	let coordinatorError = $state<string | null>(null);
	let coordinatorModalOpen = $state(false);
	let coordinatorEmployeeName = $state('');
	let coordinatorSaving = $state(false);
	let coordinatorSubmissionRequested = $state(false);
	let coordinatorInitial = $state({ employeeId: '', startDate: '' });
	let roleCatalog = $state.raw<ClientInvolvedEmployeeRole[]>([]);
	let rolesLoading = $state(true);
	const canManageCoordinator = $derived(
		auth.hasPermission(PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_CREATE) &&
			auth.hasPermission(PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_UPDATE)
	);
	const rolesAvailable = $derived(!rolesLoading && roleCatalog.length > 0);
	const isCoordinatorRole = (value: string) => value === 'coordinator';
	const roleLabel = (role: string | undefined) =>
		roleCatalog.find((item) => item.role === role)?.label ?? role ?? m.not_available();
	const roleDescription = (role: string | undefined) =>
		role ? roleCatalog.find((item) => item.role === role)?.description : undefined;
	const schema = createInvolvedEmployeeSchema({
		employeeRequired: m.involved_employee_required(),
		startDateRequired: m.involved_employee_required(),
		roleRequired: m.involved_employee_required(),
		dateFormat: m.involved_employee_required()
	});

	const { form, errors, enhance, reset } = superForm(
		defaults<InvolvedEmployeeFormInput>(
			{ employee_id: '', start_date: '', role: '' },
			valibotClient(schema)
		),
		{
			validators: valibotClient(schema),
			SPA: true,
			dataType: 'json',
			onSubmit: ({ cancel }) => {
				if (submissionRequested || saving) cancel();
				else submissionRequested = true;
			},
			onUpdate: async ({ form: result }) => {
				if (!submissionRequested) return;
				if (!result.valid) {
					submissionRequested = false;
					return;
				}
				const selectedRole = roleCatalog.find((role) => role.role === result.data.role);
				if (!rolesAvailable || !selectedRole || selectedRole.role === 'coordinator') {
					formError = m.involved_employee_required();
					submissionRequested = false;
					return;
				}
				saving = true;
				formError = null;
				try {
					const payload = {
						...result.data,
						start_date: `${result.data.start_date}T00:00:00Z`,
						role: selectedRole.role
					};
					if (editing) await updateClientInvolvedEmployee(clientId, editing.id, payload);
					else await createClientInvolvedEmployee(clientId, payload);
					resetForm();
					modalOpen = false;
					await Promise.all([
						invalidate(`app:client:${clientId}:involved-employees`),
						invalidate(`app:client:${clientId}:detail`)
					]);
				} catch (error) {
					formError = error instanceof Error ? error.message : m.involved_employee_save_failed();
				} finally {
					saving = false;
					submissionRequested = false;
				}
			}
		}
	);

	const coordinatorSchema = createClientCoordinatorSchema({
		employeeRequired: m.coordinator_employee_required(),
		dateFormat: m.coordinator_date_invalid()
	});
	const {
		form: coordinatorForm,
		errors: coordinatorErrors,
		enhance: enhanceCoordinator,
		reset: resetCoordinator
	} = superForm(defaults({ employee_id: '', start_date: '' }, valibotClient(coordinatorSchema)), {
		id: 'client-coordinator',
		SPA: true,
		dataType: 'json',
		validators: valibotClient(coordinatorSchema),
		onSubmit: ({ cancel }) => {
			if (coordinatorSaving || coordinatorSubmissionRequested || !canManageCoordinator) cancel();
			else coordinatorSubmissionRequested = true;
		},
		onUpdate: async ({ form: result }) => {
			if (!coordinatorSubmissionRequested) return;
			if (!result.valid) {
				coordinatorSubmissionRequested = false;
				return;
			}
			await saveCoordinator();
			coordinatorSubmissionRequested = false;
		}
	});
	const coordinatorUnchanged = $derived(
		$coordinatorForm.employee_id === coordinatorInitial.employeeId &&
			$coordinatorForm.start_date === coordinatorInitial.startDate
	);

	$effect(() => {
		breadcrumbs.items = [
			{ label: m.breadcrumb_home(), href: resolve('/(app)/dashboard') },
			{ label: m.clients(), href: resolve('/(app)/clients') },
			{
				label: data.clientName ?? m.breadcrumb_client_detail(),
				href: resolve('/(app)/clients/[id]', { id: clientId })
			},
			{ label: m.involved_employees() }
		];
		return () => (breadcrumbs.items = []);
	});

	const employeeLabel = (employee: EmployeeListItem) =>
		`${employee.first_name} ${employee.last_name}`.trim();
	const loadEmployeeOptions = async (query: string) =>
		(
			await listEmployees({
				page: 1,
				pageSize: 50,
				search: query,
				isArchived: false,
				outOfService: false
			})
		).data.results;
	const formatDate = (value: string) =>
		new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' }).format(
			new Date(value)
		);

	const openCoordinatorEditor = (assignment: ClientCoordinatorAssignment | null) => {
		if (!canManageCoordinator) return;
		coordinatorEmployeeName = assignment?.employee_name ?? '';
		const startDate = assignment?.start_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
		resetCoordinator({
			data: { employee_id: assignment?.employee_id ?? '', start_date: startDate }
		});
		coordinatorInitial = { employeeId: assignment?.employee_id ?? '', startDate };
		coordinatorError = null;
		coordinatorModalOpen = true;
	};

	function closeCoordinator() {
		if (coordinatorSaving) return;
		coordinatorModalOpen = false;
		resetCoordinator();
		coordinatorEmployeeName = '';
		coordinatorError = null;
	}

	const saveCoordinator = async () => {
		if (!canManageCoordinator || coordinatorSaving || coordinatorUnchanged) return;
		coordinatorSaving = true;
		coordinatorError = null;
		try {
			await updateClientCoordinator(clientId, {
				employee_id: $coordinatorForm.employee_id,
				start_date: `${$coordinatorForm.start_date}T00:00:00Z`
			});
			coordinatorModalOpen = false;
			resetCoordinator();
			await Promise.all([
				invalidate(`app:client:${clientId}:coordinator`),
				invalidate(`app:client:${clientId}:involved-employees`),
				invalidate(`app:client:${clientId}:detail`)
			]);
		} catch (error) {
			coordinatorError = error instanceof Error ? error.message : m.coordinator_save_failed();
		} finally {
			coordinatorSaving = false;
		}
	};

	$effect(() => {
		let active = true;
		rolesLoading = true;
		rolesPromise.then((result: InvolvedEmployeeRolesLoadResult) => {
			if (active) {
				roleCatalog = result.roles;
				rolesLoading = false;
			}
		});
		return () => {
			active = false;
		};
	});

	function openCreate() {
		if (!rolesAvailable || !auth.hasPermission(PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_CREATE)) return;
		editing = null;
		reset({
			data: { employee_id: '', start_date: new Date().toISOString().slice(0, 10), role: '' }
		});
		formError = null;
		modalOpen = true;
	}

	function openEdit(item: ClientInvolvedEmployee) {
		if (!rolesAvailable || isCoordinatorRole(item.role)) return;
		if (!auth.hasPermission(PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_UPDATE)) return;
		editing = item;
		reset({
			data: {
				employee_id: item.employee_id,
				start_date: item.start_date.slice(0, 10),
				role: item.role
			}
		});
		formError = null;
		modalOpen = true;
	}

	function resetForm() {
		reset({ data: { employee_id: '', start_date: '', role: '' } });
		formError = null;
		editing = null;
	}

	async function remove(item: ClientInvolvedEmployee) {
		if (
			deletingId ||
			isCoordinatorRole(item.role) ||
			!auth.hasPermission(PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_DELETE) ||
			!confirm(m.involved_employee_delete_confirm({ name: item.employee_name }))
		)
			return;
		deletingId = item.id;
		try {
			await deleteClientInvolvedEmployee(clientId, item.id);
			await invalidate(`app:client:${clientId}:involved-employees`);
			await invalidate(`app:client:${clientId}:detail`);
		} catch (error) {
			formError = error instanceof Error ? error.message : m.involved_employee_delete_failed();
		} finally {
			deletingId = null;
		}
	}
</script>

<svelte:head><title>{m.involved_employees()} | MaiCare</title></svelte:head>

<section class="space-y-6 pb-12">
	<header
		class="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm"
	>
		<div
			class="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-brand/10 blur-3xl"
		></div>
		<div class="relative flex flex-wrap items-start justify-between gap-4">
			<div>
				<div class="mb-3 flex items-center gap-2 text-sm font-semibold text-brand">
					<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10"
						><UsersRound class="h-5 w-5" /></span
					>{m.client_network()}
				</div>
				<h1 class="text-3xl font-bold tracking-tight text-text">{m.involved_employees()}</h1>
				<p class="mt-2 max-w-2xl text-sm font-medium text-text-muted">
					{m.involved_employees_description()}
				</p>
			</div>
			<PermissionGuard permission={PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_CREATE}
				><Button onclick={openCreate} disabled={!rolesAvailable}
					><Plus class="h-4 w-4" />{m.add_involved_employee()}</Button
				></PermissionGuard
			>
		</div>
	</header>

	<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="flex items-start gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"
				>
					<UserRound class="h-5 w-5" />
				</div>
				<div>
					<h2 class="text-lg font-semibold tracking-tight text-text">{m.main_coordinator()}</h2>
					<p class="mt-1 text-sm text-text-muted">{m.coordinator_summary_description()}</p>
				</div>
			</div>
			{#await coordinatorPromise then result}
				{#if !result.loadError}
					<PermissionGuard permission={PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_CREATE}
						><PermissionGuard permission={PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_UPDATE}
							><Button variant="secondary" onclick={() => openCoordinatorEditor(result.coordinator)}
								><Pencil class="h-4 w-4" />{result.coordinator
									? m.edit()
									: m.assign_coordinator()}</Button
							></PermissionGuard
						></PermissionGuard
					>
				{/if}
			{/await}
		</div>
		{#await coordinatorPromise}
			<div
				class="mt-5 grid animate-pulse gap-4 rounded-2xl border border-border bg-bg p-4 sm:grid-cols-3"
				aria-label={m.loading()}
			>
				<div class="h-12 rounded-xl bg-border/70"></div>
				<div class="h-12 rounded-xl bg-border/70"></div>
				<div class="h-12 rounded-xl bg-border/70"></div>
			</div>
		{:then coordinatorResult}
			{@const coordinator = coordinatorResult.coordinator}
			{#if coordinatorResult.loadError}<InlineErrorBanner
					message={coordinatorResult.loadError}
					onRetry={() => invalidate(`app:client:${clientId}:coordinator`)}
				/>
			{:else if coordinator}<div
					class="mt-5 grid gap-3 rounded-2xl border border-border bg-bg p-4 sm:grid-cols-3"
				>
					<div>
						<p class="text-xs font-semibold tracking-wide text-text-muted uppercase">
							{m.employee()}
						</p>
						<p class="mt-1 text-sm font-semibold text-text">{coordinator.employee_name}</p>
					</div>
					<div>
						<p class="text-xs font-semibold tracking-wide text-text-muted uppercase">
							{m.start_date()}
						</p>
						<p class="mt-1 text-sm font-semibold text-text">{formatDate(coordinator.start_date)}</p>
					</div>
					<div>
						<p class="text-xs font-semibold tracking-wide text-text-muted uppercase">{m.role()}</p>
						<p class="mt-1 text-sm font-semibold text-text">{roleLabel(coordinator.role)}</p>
					</div>
				</div>
			{:else}<p
					class="mt-5 rounded-2xl border border-dashed border-border bg-bg px-4 py-3 text-sm text-text-muted"
				>
					{m.no_coordinator_assigned()}
				</p>{/if}
		{/await}
	</section>
	{#await rolesPromise then rolesResult}{#if rolesResult.loadError}<InlineErrorBanner
				message={rolesResult.loadError}
				onRetry={() => invalidate('app:involved-employee-roles')}
			/>{/if}{/await}

	{#await dataPromise}
		<div class="grid gap-3 sm:grid-cols-2">
			<div class="h-32 animate-pulse rounded-2xl bg-border/70"></div>
			<div class="h-32 animate-pulse rounded-2xl bg-border/70"></div>
		</div>
	{:then result}
		{#if result.loadError}<InlineErrorBanner
				message={result.loadError}
				onRetry={() => invalidate(`app:client:${clientId}:involved-employees`)}
			/>{/if}
		{#if formError}<InlineErrorBanner message={formError} />{/if}
		{#if result.employees.length === 0 && !result.loadError}
			<EmptyState
				icon={BriefcaseBusiness}
				title={m.no_involved_employees()}
				description={m.no_involved_employees_description()}
				variant="dashed"
			/>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
				{#each result.employees as item (item.id)}
					<article
						class="group rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
					>
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div class="flex min-w-0 items-center gap-3">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 font-bold text-brand"
								>
									{item.employee_name
										.split(' ')
										.map((part: string) => part[0])
										.join('')
										.slice(0, 2)
										.toUpperCase()}
								</div>
								<div class="min-w-0">
									<h2 class="truncate font-bold text-text">{item.employee_name}</h2>
								</div>
							</div>
							<span
								class="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand"
								>{roleLabel(item.role)}</span
							>
						</div>
						{#if roleDescription(item.role)}<p class="mt-2 text-xs text-text-muted">
								{roleDescription(item.role)}
							</p>{/if}
						<div class="mt-5 flex items-center gap-2 text-sm text-text-muted">
							<CalendarDays class="h-4 w-4 text-brand" />{m.starts_on()}
							{formatDate(item.start_date)}
						</div>
						{#if !isCoordinatorRole(item.role)}
							<div class="mt-4 flex justify-end gap-2 border-t border-border pt-3">
								<PermissionGuard permission={PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_UPDATE}
									><Button
										variant="ghost"
										class="px-3 py-2"
										aria-label={m.edit()}
										disabled={!rolesAvailable}
										onclick={() => openEdit(item)}><Pencil class="h-4 w-4" /></Button
									></PermissionGuard
								><PermissionGuard permission={PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_DELETE}
									><Button
										variant="destructive"
										class="px-3 py-2"
										aria-label={m.delete()}
										isLoading={deletingId === item.id}
										disabled={deletingId !== null}
										onclick={() => remove(item)}><Trash2 class="h-4 w-4" /></Button
									></PermissionGuard
								>
							</div>
						{:else}
							<p
								class="mt-4 border-t border-border pt-3 text-right text-xs font-medium text-text-subtle"
							>
								{m.involved_employee_coordinator_hint()}
							</p>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	{/await}
</section>

<Modal
	bind:open={modalOpen}
	dismissible={!saving}
	onClose={resetForm}
	title={editing ? m.edit_involved_employee() : m.add_involved_employee()}
	description={m.involved_employee_form_description()}
>
	<form id="involved-employee-form" method="POST" use:enhance class="space-y-4" novalidate>
		{#if formError}<InlineErrorBanner message={formError} />{/if}
		<SearchSelect
			label={m.employee()}
			value={$form.employee_id}
			displayValue={editing?.employee_name ?? ''}
			placeholder={m.select_employee_placeholder()}
			searchPlaceholder={m.search_employee_placeholder()}
			loadOptions={loadEmployeeOptions}
			labelFn={employeeLabel}
			valueFn={(employee) => employee.id}
			onchange={(value) => ($form.employee_id = value)}
			error={formatFormError($errors.employee_id)}
		/>
		<DatePicker
			label={m.start_date()}
			bind:value={$form.start_date}
			error={formatFormError($errors.start_date)}
		/>
		<Select
			disabled={!rolesAvailable || saving}
			label={m.role()}
			bind:value={$form.role}
			options={roleCatalog
				.filter((item) => item.role !== 'coordinator')
				.map((item) => ({ value: item.role, label: item.label }))}
			placeholder={m.select_role_placeholder()}
			error={formatFormError($errors.role)}
		/>
		{#if roleDescription($form.role)}<p class="rounded-xl bg-bg px-3 py-2 text-xs text-text-muted">
				{roleDescription($form.role)}
			</p>{/if}
		<div class="flex justify-end gap-2 pt-2">
			<Button
				variant="ghost"
				type="button"
				disabled={saving}
				onclick={() => {
					resetForm();
					modalOpen = false;
				}}>{m.cancel()}</Button
			><Button type="submit" isLoading={saving} disabled={!rolesAvailable}
				>{editing ? m.save_changes() : m.add_involved_employee()}</Button
			>
		</div>
	</form>
</Modal>

<Modal
	bind:open={coordinatorModalOpen}
	dismissible={!coordinatorSaving}
	onClose={closeCoordinator}
	title={m.assign_coordinator()}
	description={m.coordinator_editor_description()}
>
	<form method="POST" use:enhanceCoordinator class="space-y-4" novalidate>
		<SearchSelect
			label={m.employee()}
			bind:value={$coordinatorForm.employee_id}
			bind:displayValue={coordinatorEmployeeName}
			loadOptions={loadEmployeeOptions}
			disabled={coordinatorSaving}
			error={formatFormError($coordinatorErrors.employee_id)}
			labelFn={employeeLabel}
			valueFn={(employee) => employee.id}
			placeholder={m.select_employee_placeholder()}
			searchPlaceholder={m.search_employee_placeholder()}
		/>
		<DatePicker
			label={m.start_date()}
			bind:value={$coordinatorForm.start_date}
			error={formatFormError($coordinatorErrors.start_date)}
		/>
		{#if coordinatorError}<div
				class="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
			>
				{coordinatorError}
			</div>{/if}
		<div class="flex justify-end gap-2 pt-2">
			<Button variant="ghost" type="button" disabled={coordinatorSaving} onclick={closeCoordinator}
				>{m.cancel()}</Button
			><Button
				type="submit"
				isLoading={coordinatorSaving}
				disabled={!canManageCoordinator || coordinatorUnchanged}>{m.save_changes()}</Button
			>
		</div>
	</form>
</Modal>
