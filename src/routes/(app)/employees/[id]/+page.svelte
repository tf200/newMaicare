<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import {
		ArrowLeft,
		BadgeCheck,
		BriefcaseBusiness,
		Building2,
		CalendarDays,
		Clock3,
		Euro,
		Home,
		Mail,
		MapPin,
		Phone,
		ShieldCheck,
		UserRound,
		UsersRound
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import type { EmployeeDetail } from '$lib/api/employees';
	import type { EmployeeDetailLoadResult } from './+page';

	type DetailItem = {
		label: string;
		value: string;
		help?: string;
	};

	type Section = {
		title: string;
		description: string;
		icon: typeof UserRound;
		items: DetailItem[];
	};

	let { data } = $props<{
		data: {
			employeeData: Promise<EmployeeDetailLoadResult>;
		};
	}>();

	const employeeDataPromise = $derived.by(() => data.employeeData);

	const getFullName = (employee: EmployeeDetail) =>
		`${employee.first_name} ${employee.last_name}`.trim() || 'Unknown employee';

	const getInitials = (employee: EmployeeDetail) =>
		`${employee.first_name[0] ?? ''}${employee.last_name[0] ?? ''}`.toUpperCase() || 'EM';

	const getManagerName = (employee: EmployeeDetail) =>
		[employee.manager_first_name, employee.manager_last_name].filter(Boolean).join(' ');

	const getAddress = (employee: EmployeeDetail) =>
		`${employee.street} ${employee.house_number}${employee.house_number_addition ? employee.house_number_addition : ''}`;

	const formatDate = (value: string | null) =>
		value
			? new Date(value).toLocaleDateString('nl-NL', {
					day: '2-digit',
					month: 'long',
					year: 'numeric'
				})
			: 'Not set';

	const formatCurrency = (value: number | null) =>
		value == null
			? 'Not set'
			: new Intl.NumberFormat('nl-NL', {
					style: 'currency',
					currency: 'EUR',
					maximumFractionDigits: 2
				}).format(value);

	const formatHours = (value: number | null) =>
		value == null ? 'Not set' : `${value} hours / week`;

	const getStatusCards = (employee: EmployeeDetail) => [
		{
			label: 'Employment status',
			value: employee.is_archived ? 'Archived' : 'Active',
			description: employee.is_archived
				? 'Hidden from day-to-day planning'
				: 'Available for planning',
			className: employee.is_archived ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
		},
		{
			label: 'Service status',
			value: employee.out_of_service ? 'Out of service' : 'In service',
			description: employee.out_of_service ? 'Temporarily unavailable' : 'No service restrictions',
			className: employee.out_of_service ? 'bg-error/10 text-error' : 'bg-brand/10 text-brand'
		},
		{
			label: 'Borrowed equipment',
			value: employee.has_borrowed ? 'Yes' : 'No',
			description: employee.has_borrowed ? 'Assets assigned' : 'No borrowed items recorded',
			className: employee.has_borrowed
				? 'bg-secondary/10 text-secondary'
				: 'bg-border/60 text-text-muted'
		}
	];

	const getSections = (employee: EmployeeDetail): Section[] => {
		const managerName = getManagerName(employee);
		const address = getAddress(employee);

		return [
			{
				title: 'Contact',
				description: 'Primary ways to reach this employee.',
				icon: Mail,
				items: [
					{ label: 'Work email', value: employee.work_email_address ?? 'Not set' },
					{ label: 'Private email', value: employee.private_email_address ?? 'Not set' },
					{ label: 'Work phone', value: employee.work_phone_number ?? 'Not set' },
					{ label: 'Private phone', value: employee.private_phone_number ?? 'Not set' },
					{ label: 'Home telephone', value: employee.home_telephone_number ?? 'Not set' }
				]
			},
			{
				title: 'Contract',
				description: 'Current employment agreement and planning capacity.',
				icon: BriefcaseBusiness,
				items: [
					{ label: 'Contract type', value: employee.contract_type },
					{ label: 'Contract hours', value: formatHours(employee.contract_hours) },
					{ label: 'Contract rate', value: formatCurrency(employee.contract_rate) },
					{ label: 'Start date', value: formatDate(employee.contract_start_date) },
					{ label: 'End date', value: formatDate(employee.contract_end_date) }
				]
			},
			{
				title: 'Organization',
				description: 'Role, team ownership, and internal references.',
				icon: Building2,
				items: [
					{ label: 'Department', value: employee.department_name ?? 'Not assigned' },
					{ label: 'Position', value: employee.position ?? 'Not set' },
					{ label: 'Role', value: employee.role.name },
					{ label: 'Manager', value: managerName || 'Not assigned' },
					{ label: 'Employee number', value: employee.employee_number ?? 'Not set' },
					{ label: 'Employment number', value: employee.employment_number ?? 'Not set' }
				]
			},
			{
				title: 'Personal',
				description: 'Identity and residential details used by HR.',
				icon: Home,
				items: [
					{ label: 'BSN', value: employee.bsn },
					{ label: 'Date of birth', value: formatDate(employee.date_of_birth) },
					{ label: 'Gender', value: employee.gender },
					{ label: 'Street', value: address },
					{ label: 'Postal code', value: employee.postal_code },
					{ label: 'City', value: employee.city }
				]
			}
		];
	};
</script>

<svelte:head>
	<title>Employee | MaiCare</title>
</svelte:head>

<section class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<a
			href="/employees"
			class="inline-flex items-center gap-2 text-sm font-bold text-text-muted transition hover:text-brand"
		>
			<ArrowLeft class="h-4 w-4" />
			Back to employees
		</a>

		<div class="flex items-center gap-2">
			<Button variant="ghost">Archive</Button>
			<Button variant="secondary">Edit employee</Button>
		</div>
	</div>

	{#await employeeDataPromise}
		<header class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
			<div class="relative bg-gradient-to-br from-brand/15 via-surface to-success/10 p-6 sm:p-8">
				<div class="flex animate-pulse flex-col gap-6 sm:flex-row sm:items-center">
					<div class="h-24 w-24 rounded-3xl bg-border"></div>
					<div class="flex-1 space-y-4">
						<div class="h-4 w-36 rounded-full bg-border"></div>
						<div class="h-10 max-w-md rounded-2xl bg-border"></div>
						<div class="h-4 max-w-xl rounded-full bg-border"></div>
					</div>
				</div>
			</div>
		</header>
	{:then result}
		{#if result.loadError || !result.employee}
			<InlineErrorBanner
				message={result.loadError ?? 'Employee could not be found.'}
				onRetry={() => invalidateAll()}
			/>
		{:else}
			{@const employee = result.employee}
			{@const fullName = getFullName(employee)}
			{@const initials = getInitials(employee)}
			{@const managerName = getManagerName(employee)}
			{@const statusCards = getStatusCards(employee)}
			{@const sections = getSections(employee)}

			<header class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
				<div class="relative bg-gradient-to-br from-brand/15 via-surface to-success/10 p-6 sm:p-8">
					<div class="absolute top-0 right-0 h-40 w-40 rounded-full bg-brand/20 blur-3xl"></div>
					<div
						class="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-success/20 blur-3xl"
					></div>

					<div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
						<div class="flex flex-col gap-5 sm:flex-row sm:items-center">
							<div
								class="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-text text-3xl font-black tracking-tight text-surface shadow-lg shadow-brand/10"
							>
								{initials}
							</div>
							<div class="space-y-3">
								<div class="flex flex-wrap items-center gap-2">
									<span
										class="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success"
									>
										<BadgeCheck class="h-3.5 w-3.5" />
										{employee.is_archived ? 'Archived employee' : 'Active employee'}
									</span>
									<span
										class="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand"
									>
										<ShieldCheck class="h-3.5 w-3.5" />
										{employee.role.name}
									</span>
								</div>
								<div>
									<h1 class="text-4xl font-black tracking-tighter text-text sm:text-5xl">
										{fullName}
									</h1>
									<p class="mt-2 max-w-2xl text-sm font-semibold text-text-muted sm:text-base">
										{employee.position ?? 'Employee'} in {employee.department_name ??
											'No department'}. Responsible for care continuity, team coordination, and
										client planning coverage.
									</p>
								</div>
							</div>
						</div>

						<div class="grid min-w-0 gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
							<div class="rounded-2xl border border-border/70 bg-surface/80 p-4 backdrop-blur">
								<p class="text-xs font-bold text-text-subtle uppercase">Contract</p>
								<p class="mt-1 text-lg font-black text-text">{employee.contract_type}</p>
							</div>
							<div class="rounded-2xl border border-border/70 bg-surface/80 p-4 backdrop-blur">
								<p class="text-xs font-bold text-text-subtle uppercase">Hours</p>
								<p class="mt-1 text-lg font-black text-text">
									{employee.contract_hours == null ? 'Not set' : `${employee.contract_hours}h`}
								</p>
							</div>
							<div class="rounded-2xl border border-border/70 bg-surface/80 p-4 backdrop-blur">
								<p class="text-xs font-bold text-text-subtle uppercase">Rate</p>
								<p class="mt-1 text-lg font-black text-text">
									{formatCurrency(employee.contract_rate)}
								</p>
							</div>
						</div>
					</div>
				</div>
			</header>

			<div class="grid gap-4 md:grid-cols-3">
				{#each statusCards as card (card.label)}
					<article class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
						<div class="flex items-start justify-between gap-4">
							<div>
								<p class="text-sm font-bold text-text-muted">{card.label}</p>
								<p class="mt-2 text-2xl font-black tracking-tight text-text">{card.value}</p>
								<p class="mt-1 text-sm font-medium text-text-subtle">{card.description}</p>
							</div>
							<span class={`rounded-2xl p-3 ${card.className}`}>
								<ShieldCheck class="h-5 w-5" />
							</span>
						</div>
					</article>
				{/each}
			</div>

			<div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
				<div class="grid gap-6 lg:grid-cols-2">
					{#each sections as section (section.title)}
						<article class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
							<div class="mb-5 flex items-start gap-3">
								<span
									class="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand"
								>
									<section.icon class="h-5 w-5" />
								</span>
								<div>
									<h2 class="text-lg font-black tracking-tight text-text">{section.title}</h2>
									<p class="text-sm font-medium text-text-muted">{section.description}</p>
								</div>
							</div>

							<div class="divide-y divide-border/70">
								{#each section.items as item (item.label)}
									<div class="grid min-w-0 gap-1 py-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
										<p class="text-xs font-bold tracking-wide text-text-subtle uppercase">
											{item.label}
										</p>
										<p
											class="min-w-0 text-sm font-bold [overflow-wrap:anywhere] break-words text-text"
										>
											{item.value}
										</p>
									</div>
								{/each}
							</div>
						</article>
					{/each}
				</div>

				<aside class="space-y-6">
					<article class="rounded-3xl border border-border bg-surface p-6 shadow-sm">
						<div class="flex items-center gap-3">
							<span
								class="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary"
							>
								<UsersRound class="h-5 w-5" />
							</span>
							<div>
								<h2 class="text-lg font-black tracking-tight text-text">Team snapshot</h2>
								<p class="text-sm font-medium text-text-muted">
									Quick context for planning decisions.
								</p>
							</div>
						</div>

						<div class="mt-6 space-y-4">
							<div class="rounded-2xl bg-border/40 p-4">
								<div class="flex items-center gap-3 text-sm font-bold text-text">
									<Building2 class="h-4 w-4 text-brand" />
									{employee.department_name ?? 'Not assigned'}
								</div>
								<p class="mt-2 text-sm font-medium text-text-muted">
									Primary department assignment
								</p>
							</div>
							<div class="rounded-2xl bg-border/40 p-4">
								<div class="flex items-center gap-3 text-sm font-bold text-text">
									<UserRound class="h-4 w-4 text-brand" />
									{managerName || 'Not assigned'}
								</div>
								<p class="mt-2 text-sm font-medium text-text-muted">Direct manager</p>
							</div>
							<div class="rounded-2xl bg-border/40 p-4">
								<div class="flex items-center gap-3 text-sm font-bold text-text">
									<MapPin class="h-4 w-4 text-brand" />
									{employee.city}
								</div>
								<p class="mt-2 text-sm font-medium text-text-muted">Residential region</p>
							</div>
						</div>
					</article>

					<article class="rounded-3xl border border-border bg-text p-6 text-surface shadow-sm">
						<div class="flex items-center gap-3">
							<span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface/10">
								<Clock3 class="h-5 w-5" />
							</span>
							<div>
								<h2 class="text-lg font-black tracking-tight">Operational notes</h2>
								<p class="text-sm font-medium text-surface/60">
									Static placeholders for the final API state.
								</p>
							</div>
						</div>

						<div class="mt-6 grid gap-3">
							<div class="flex items-center justify-between rounded-2xl bg-surface/10 p-4">
								<span class="flex items-center gap-2 text-sm font-bold"
									><CalendarDays class="h-4 w-4" /> Started</span
								>
								<span class="text-sm font-black">{formatDate(employee.contract_start_date)}</span>
							</div>
							<div class="flex items-center justify-between rounded-2xl bg-surface/10 p-4">
								<span class="flex items-center gap-2 text-sm font-bold"
									><Euro class="h-4 w-4" /> Rate</span
								>
								<span class="text-sm font-black">{formatCurrency(employee.contract_rate)}</span>
							</div>
							<div class="flex items-center justify-between rounded-2xl bg-surface/10 p-4">
								<span class="flex items-center gap-2 text-sm font-bold"
									><Phone class="h-4 w-4" /> Work phone</span
								>
								<span class="text-sm font-black">{employee.work_phone_number ?? 'Not set'}</span>
							</div>
						</div>
					</article>
				</aside>
			</div>
		{/if}
	{/await}
</section>
