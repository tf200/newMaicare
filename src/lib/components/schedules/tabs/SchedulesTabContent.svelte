<script lang="ts">
	import {
		CalendarDays,
		Clock,
		Moon,
		ChevronLeft,
		ChevronRight,
		Loader2,
		Plus,
		Sparkles,
		X
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SearchSelect from '$lib/components/ui/SearchSelect.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { OrganizationLocation } from '$lib/types/api';

	interface Employee {
		id: string;
		name: string;
		scheduleId: string | null;
	}

	interface ShiftTemplate {
		id: string;
		name: string;
		startTime: string;
		endTime: string;
		isCrossMidnight: boolean;
		colorClass: string;
	}

	interface ScheduledShift {
		id: string;
		templateId: string;
		date: string;
		employees: Employee[];
	}

	interface VisibleDay {
		date: string;
		dayName: string;
		dayNumber: number;
		isToday: boolean;
	}

	interface MonthlyDay {
		date: string;
		dayNumber: number;
		dayName: string;
		isCurrentMonth: boolean;
		isToday: boolean;
	}

	type ViewMode = 'weekly' | 'monthly';

	interface Props {
		selectedLocationId: string;
		selectedLocationDisplay: string;
		viewMode: ViewMode;
		weekOffset: number;
		monthOffset: number;
		loadLocationOptions: (query: string) => Promise<OrganizationLocation[]>;
		visibleDateRange: string;
		currentMonthDate: Date;
		schedulesError: string | null;
		retrySchedulesFetch: () => void;
		locationsLoadError: string | null;
		templates: ShiftTemplate[];
		visibleDays: VisibleDay[];
		getShifts: (templateId: string, date: string) => ScheduledShift[];
		deletingScheduleIds: string[];
		onUnassignEmployee: (scheduleId: string) => Promise<void>;
		onOpenAssignSheet: (date: string, templateId: string | null) => void;
		weekdaysShort: string[];
		shiftsByDate: Map<string, ScheduledShift[]>;
		monthlyDays: MonthlyDay[];
		templateById: Map<string, ShiftTemplate>;
		onOpenAutoGenerateModal: () => void;
	}

	let {
		selectedLocationId = $bindable(),
		selectedLocationDisplay = $bindable(),
		viewMode = $bindable(),
		weekOffset = $bindable(),
		monthOffset = $bindable(),
		loadLocationOptions,
		visibleDateRange,
		currentMonthDate,
		schedulesError,
		retrySchedulesFetch,
		locationsLoadError,
		templates,
		visibleDays,
		getShifts,
		deletingScheduleIds,
		onUnassignEmployee,
		onOpenAssignSheet,
		weekdaysShort,
		shiftsByDate,
		monthlyDays,
		templateById,
		onOpenAutoGenerateModal
	}: Props = $props();
</script>

{#snippet locationOption(option: OrganizationLocation)}
	<div class="flex flex-col py-0.5">
		<span class="font-medium text-text">{option.name}</span>
		<div class="text-xs text-text-muted">
			<span>{option.street} {option.house_number}, {option.city}</span>
		</div>
	</div>
{/snippet}

<div class="flex flex-1 flex-col rounded-b-3xl border border-border/70 bg-surface">
	<header
		class="sticky top-0 z-20 flex shrink-0 flex-col gap-4 border-b border-border/60 bg-surface/85 px-6 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
	>
		<div class="flex items-center gap-3">
			<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
				<CalendarDays class="h-5 w-5" />
			</div>
			<div>
				<h1 class="text-lg font-bold tracking-tight text-text">{m.schedules_management()}</h1>
				<div class="mt-0.5 flex items-center gap-2 text-sm text-text-muted">
					<SearchSelect
						bind:value={selectedLocationId}
						bind:displayValue={selectedLocationDisplay}
						loadOptions={loadLocationOptions}
						labelFn={(location) => location.name}
						valueFn={(location) => location.id}
						item={locationOption}
						placeholder={m.select_location()}
						searchPlaceholder={m.search_locations()}
						compact
						className="w-[200px]"
					/>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<div
				class="bg-surface-subtle mr-2 flex items-center rounded-xl border border-border/70 p-1 shadow-sm"
			>
				<button
					class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {viewMode === 'weekly'
						? 'bg-surface text-text shadow-sm'
						: 'text-text-muted hover:text-text'}"
					onclick={() => (viewMode = 'weekly')}
				>
					{m.weekly()}
				</button>
				<button
					class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {viewMode ===
					'monthly'
						? 'bg-surface text-text shadow-sm'
						: 'text-text-muted hover:text-text'}"
					onclick={() => (viewMode = 'monthly')}
				>
					{m.monthly()}
				</button>
			</div>

			{#if viewMode === 'weekly'}
				<div class="flex items-center rounded-xl border border-border/70 bg-surface p-1 shadow-sm">
					<button
						type="button"
						class="hover:bg-surface-subtle flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text"
						onclick={() => (weekOffset -= 1)}
						aria-label={m.previous_week()}
					>
						<ChevronLeft class="h-4 w-4" />
					</button>
					<span class="px-3 text-sm font-medium text-text">
						{visibleDateRange}
					</span>
					<button
						type="button"
						class="hover:bg-surface-subtle flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text"
						onclick={() => (weekOffset += 1)}
						aria-label={m.next_week()}
					>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
				<Button variant="ghost" class="rounded-xl" onclick={() => (weekOffset = 0)}
					>{m.this_week()}</Button
				>
				<Button
					class="rounded-xl"
					onclick={onOpenAutoGenerateModal}
					disabled={!selectedLocationId}
				>
					<Sparkles class="h-4 w-4" />
					{m.auto_generate()}
				</Button>
			{:else}
				<div class="flex items-center rounded-xl border border-border/70 bg-surface p-1 shadow-sm">
					<button
						type="button"
						class="hover:bg-surface-subtle flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text"
						onclick={() => (monthOffset -= 1)}
						aria-label={m.previous_month()}
					>
						<ChevronLeft class="h-4 w-4" />
					</button>
					<span class="min-w-[120px] px-3 text-center text-sm font-medium text-text">
						{currentMonthDate.toLocaleDateString(getLocale(), {
							month: 'long',
							year: 'numeric'
						})}
					</span>
					<button
						type="button"
						class="hover:bg-surface-subtle flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:text-text"
						onclick={() => (monthOffset += 1)}
						aria-label={m.next_month()}
					>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
				<Button variant="ghost" class="rounded-xl" onclick={() => (monthOffset = 0)}
					>{m.this_month()}</Button
				>
			{/if}
		</div>
	</header>

	<div class="flex-1 overflow-auto p-6">
		{#if schedulesError}
			<div class="mb-4">
				<InlineErrorBanner
					title={m.unable_to_load_schedules()}
					message={schedulesError}
					onRetry={retrySchedulesFetch}
				/>
			</div>
		{/if}

		{#if locationsLoadError}
			<div class="mb-4">
				<InlineErrorBanner title={m.unable_to_load_locations()} message={locationsLoadError} />
			</div>
		{/if}

		{#if !selectedLocationId}
			<div class="rounded-3xl border border-border/70 bg-surface p-5 text-sm text-text-muted">
				{m.no_location_selected()}
			</div>
		{:else if viewMode === 'weekly'}
			<div class="min-w-[980px] overflow-hidden rounded-3xl border border-border/70 bg-surface">
				<div class="grid grid-cols-[220px_repeat(7,minmax(132px,1fr))]">
					<div
						class="bg-surface-subtle/80 flex items-end border-r border-b border-border/60 p-4 text-xs font-semibold tracking-wider text-text-muted uppercase"
					>
						{m.shift_template()}
					</div>

					{#each visibleDays as day (day.date)}
						<div
							class="border-r border-b border-border/60 p-3 text-center {day.isToday
								? 'bg-brand/5'
								: 'bg-surface-subtle/80'}"
						>
							<span class="text-[11px] font-semibold tracking-wider text-text-muted uppercase"
								>{day.dayName}</span
							>
							<div
								class="mt-1 text-2xl font-light {day.isToday
									? 'mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 font-medium text-brand'
									: 'text-text'}"
							>
								{day.dayNumber}
							</div>
						</div>
					{/each}

					{#if templates.length === 0}
						<div
							class="col-span-8 flex items-center justify-center border-r border-b border-border/60 bg-surface px-4 py-10 text-sm text-text-muted"
						>
							{m.no_shift_templates()}
						</div>
					{:else}
						{#each templates as template (template.id)}
							<div class="sticky left-0 z-10 border-r border-b border-border/60 bg-surface p-4">
								<div class="flex items-center gap-2">
									<div class="h-3.5 w-3.5 rounded-full {template.colorClass.split(' ')[0]}"></div>
									<span class="text-sm font-bold text-text">{template.name}</span>
								</div>
								<div class="mt-1.5 flex items-center gap-1.5 text-[11px] text-text-subtle">
									<Clock class="h-3.5 w-3.5" />
									<span>{template.startTime} - {template.endTime}</span>
								</div>
								{#if template.isCrossMidnight}
									<div
										class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400"
									>
										<Moon class="h-3 w-3" />
										<span>{m.cross_midnight()}</span>
									</div>
								{/if}
							</div>

							{#each visibleDays as day (day.date)}
								{@const cellShifts = getShifts(template.id, day.date)}
								<div
									class="group/cell flex min-h-[124px] flex-col gap-2 border-r border-b border-border/60 p-2.5 {day.isToday
										? 'bg-brand/5'
										: 'bg-surface/80'}"
								>
									{#if cellShifts.length > 0}
										<div class="flex flex-col gap-2">
											{#each cellShifts as shift (shift.id)}
												{@const visibleEmployees = shift.employees.slice(0, 2)}
												{#each visibleEmployees as employee (employee.id)}
													<div class="group relative">
														<div
															class="flex w-full items-center justify-between gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold shadow-sm {template.colorClass}"
														>
															<span class="block min-w-0 flex-1 truncate text-left"
																>{employee.name}</span
															>
															{#if employee.scheduleId}
																<button
																	type="button"
																	class="flex items-center justify-center rounded-md p-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10"
																	onclick={() => void onUnassignEmployee(employee.scheduleId!)}
																	disabled={deletingScheduleIds.includes(employee.scheduleId)}
																	aria-label={m.remove_employee_from_shift({ name: employee.name })}
																>
																	{#if deletingScheduleIds.includes(employee.scheduleId)}
																		<Loader2 class="h-3.5 w-3.5 animate-spin" />
																	{:else}
																		<X class="h-3.5 w-3.5" />
																	{/if}
																</button>
															{/if}
														</div>
													</div>
												{/each}

												{#if shift.employees.length > 2}
													<Tooltip
														content={shift.employees
															.slice(2)
															.map((employee) => employee.name)
															.join(', ')}
														position="top"
													>
														<div
															class="inline-flex w-fit items-center rounded-md px-1.5 py-0.5 text-xs font-medium text-text-muted"
														>
															{m.more_count({ count: shift.employees.length - 2 })}
														</div>
													</Tooltip>
												{/if}
											{/each}
										</div>
										<button
											type="button"
											class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/40 py-1.5 text-[11px] font-medium text-text-muted/40 transition-all hover:!border-brand/30 hover:!bg-brand/5 hover:!text-brand"
											aria-label={m.add_employee_to_shift({
												name: template.name,
												date: day.date
											})}
											onclick={() => onOpenAssignSheet(day.date, template.id)}
										>
											<Plus class="h-3.5 w-3.5" />
											<span class="opacity-0 transition-opacity group-hover/cell:opacity-100"
												>{m.add()}</span
											>
										</button>
									{:else}
										<button
											type="button"
											class="flex h-full min-h-[104px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/30 text-text-muted/40 transition-all hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
											aria-label={m.add_employee_to_shift({
												name: template.name,
												date: day.date
											})}
											onclick={() => onOpenAssignSheet(day.date, template.id)}
										>
											<Plus class="h-5 w-5" />
											<span
												class="text-[11px] font-medium opacity-0 transition-opacity group-hover/cell:opacity-100"
												>{m.add_employee()}</span
											>
										</button>
									{/if}
								</div>
							{/each}
						{/each}
					{/if}
				</div>
			</div>
		{:else}
			<div
				class="flex h-full min-h-[600px] min-w-[700px] flex-col overflow-hidden rounded-3xl border border-border/70 bg-surface sm:h-auto"
			>
				<div class="bg-surface-subtle/80 hidden grid-cols-7 border-b border-border/60 sm:grid">
					{#each weekdaysShort as d (d)}
						<div
							class="p-3 text-center text-[11px] font-semibold tracking-wider text-text-muted uppercase"
						>
							{d}
						</div>
					{/each}
				</div>
				<div class="grid flex-1 grid-cols-1 sm:auto-rows-[minmax(130px,1fr)] sm:grid-cols-7">
					{#each monthlyDays as day (day.date)}
						{@const dayShifts = shiftsByDate.get(day.date) ?? []}
						<div
							class="group/day flex flex-col border-b border-border/60 p-3 sm:flex-col sm:border-r sm:p-2 {day.isCurrentMonth
								? 'bg-surface'
								: 'bg-surface-subtle/30 hidden sm:flex'} {day.isToday ? 'bg-brand/5' : ''}"
						>
							<div class="mb-3 flex items-center justify-between sm:mb-2">
								<div class="flex items-center gap-2">
									<span class="w-8 text-xs font-semibold text-text-muted uppercase sm:hidden"
										>{day.dayName}</span
									>
									<span
										class="text-sm font-medium {day.isToday
											? 'flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-brand'
											: day.isCurrentMonth
												? 'text-text'
												: 'text-text-muted/50'}"
									>
										{day.dayNumber}
									</span>
								</div>
								<button
									class="bg-surface-subtle rounded-md p-1.5 text-text-muted transition-opacity group-hover/day:opacity-100 hover:bg-brand/10 hover:text-brand sm:bg-transparent sm:p-1 sm:opacity-0"
									aria-label={m.add_shift_on_date({ date: day.date })}
									onclick={() => onOpenAssignSheet(day.date, null)}
								>
									<Plus class="h-4 w-4" />
								</button>
							</div>

							<div class="flex flex-1 flex-col gap-1.5">
								{#each dayShifts.slice(0, 3) as shift (shift.id)}
									{@const template = templateById.get(shift.templateId)}
									{#if template}
										<Tooltip
											content={shift.employees.map((employee) => employee.name).join(', ')}
											position="top"
										>
											<div
												class="flex cursor-default items-center justify-between rounded-md px-1.5 py-1 text-[11px] font-medium shadow-sm {template.colorClass} hover:brightness-110"
											>
												<div class="mr-1 truncate">
													{template.name}
												</div>
												<div class="flex shrink-0 items-center gap-1">
													<span class="opacity-90">{shift.employees.length}</span>
													{#if template.isCrossMidnight}
														<Moon class="h-2.5 w-2.5 opacity-70" />
													{/if}
												</div>
											</div>
										</Tooltip>
									{/if}
								{/each}
								{#if dayShifts.length > 3}
									<div class="px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
										{m.more_count({ count: dayShifts.length - 3 })}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
