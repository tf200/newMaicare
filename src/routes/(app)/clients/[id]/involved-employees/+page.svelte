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
	import { BriefcaseBusiness, CalendarDays, Pencil, Plus, Trash2, UsersRound } from 'lucide-svelte';
	import {
		createClientInvolvedEmployee,
		deleteClientInvolvedEmployee,
		updateClientInvolvedEmployee
	} from '$lib/api/clients';
	import { listEmployees, type EmployeeListItem } from '$lib/api/employees';
	import Button from '$lib/components/ui/Button.svelte';
	import DatePicker from '$lib/components/ui/DatePicker.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import PermissionGuard from '$lib/components/ui/PermissionGuard.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import type { ClientInvolvedEmployee } from '$lib/types/api';
	import type { InvolvedEmployeesLoadResult } from './+page';

	let { data } = $props<{
		data: { involvedEmployeesData: Promise<InvolvedEmployeesLoadResult>; clientName?: string };
	}>();
	const auth = getAuthState();
	const breadcrumbs = getBreadcrumbsState();
	const dataPromise = $derived(data.involvedEmployeesData);
	const clientId = $derived(page.params.id ?? '');

	let modalOpen = $state(false);
	let editing = $state<ClientInvolvedEmployee | null>(null);
	let saving = $state(false);
	let submissionRequested = $state(false);
	let deletingId = $state<string | null>(null);
	let formError = $state<string | null>(null);
	const isCoordinatorRole = (value: string) => value.trim().toLowerCase() === 'coordinator';
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
				if (isCoordinatorRole(result.data.role)) {
					formError = m.involved_employee_coordinator_hint();
					submissionRequested = false;
					return;
				}
				saving = true;
				formError = null;
				try {
					const payload = {
						...result.data,
						start_date: `${result.data.start_date}T00:00:00Z`,
						role: result.data.role.trim()
					};
					if (editing) await updateClientInvolvedEmployee(clientId, editing.id, payload);
					else await createClientInvolvedEmployee(clientId, payload);
					resetForm();
					modalOpen = false;
					await invalidate(`app:client:${clientId}:involved-employees`);
				} catch (error) {
					formError = error instanceof Error ? error.message : m.involved_employee_save_failed();
				} finally {
					saving = false;
					submissionRequested = false;
				}
			}
		}
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

	function openCreate() {
		if (!auth.hasPermission(PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_CREATE)) return;
		editing = null;
		reset({
			data: { employee_id: '', start_date: new Date().toISOString().slice(0, 10), role: '' }
		});
		formError = null;
		modalOpen = true;
	}

	function openEdit(item: ClientInvolvedEmployee) {
		if (isCoordinatorRole(item.role)) return;
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
			!auth.hasPermission(PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_DELETE) ||
			!confirm(m.involved_employee_delete_confirm({ name: item.employee_name }))
		)
			return;
		deletingId = item.id;
		try {
			await deleteClientInvolvedEmployee(clientId, item.id);
			await invalidate(`app:client:${clientId}:involved-employees`);
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
				><Button onclick={openCreate}><Plus class="h-4 w-4" />{m.add_involved_employee()}</Button
				></PermissionGuard
			>
		</div>
	</header>

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
						<div class="flex items-start justify-between gap-3">
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
									<p class="truncate text-xs text-text-muted">{item.employee_id}</p>
								</div>
							</div>
							<span
								class="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand"
								>{isCoordinatorRole(item.role) ? m.coordinator() : item.role}</span
							>
						</div>
						<div class="mt-5 flex items-center gap-2 text-sm text-text-muted">
							<CalendarDays class="h-4 w-4 text-brand" />{m.starts_on()}
							{formatDate(item.start_date)}
						</div>
						{#if !isCoordinatorRole(item.role)}
							<div
								class="mt-4 flex justify-end gap-2 border-t border-border pt-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
							>
								<PermissionGuard permission={PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_UPDATE}
									><Button
										variant="ghost"
										class="px-3 py-2"
										aria-label={m.edit()}
										onclick={() => openEdit(item)}><Pencil class="h-4 w-4" /></Button
									></PermissionGuard
								><PermissionGuard permission={PERMISSIONS.CLIENT.INVOLVED_EMPLOYEE_DELETE}
									><Button
										variant="destructive"
										class="px-3 py-2"
										aria-label={m.delete()}
										isLoading={deletingId === item.id}
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
	onClose={resetForm}
	title={editing ? m.edit_involved_employee() : m.add_involved_employee()}
	description={m.involved_employee_form_description()}
>
	<form id="involved-employee-form" method="POST" use:enhance class="space-y-4" novalidate>
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
		<Input
			label={m.role()}
			bind:value={$form.role}
			placeholder={m.involved_employee_role_placeholder()}
			error={formatFormError($errors.role)}
		/>
		{#if isCoordinatorRole($form.role)}<p
				class="rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700"
			>
				{m.involved_employee_coordinator_hint()}
			</p>{/if}
		<div class="flex justify-end gap-2 pt-2">
			<Button
				variant="ghost"
				type="button"
				onclick={() => {
					resetForm();
					modalOpen = false;
				}}>{m.cancel()}</Button
			><Button type="submit" isLoading={saving}
				>{editing ? m.save_changes() : m.add_involved_employee()}</Button
			>
		</div>
	</form>
</Modal>
