<script lang="ts">
	import { AlertTriangle, CheckCircle2, GripVertical, Sparkles, XCircle } from 'lucide-svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import InlineErrorBanner from '$lib/components/ui/InlineErrorBanner.svelte';
	import MultiSearchSelect from '$lib/components/ui/MultiSearchSelect.svelte';
	import { listEmployees, type EmployeeListItem } from '$lib/api/employees';
	import { autoGenerateSchedules, saveGeneratedSchedule } from '$lib/api/schedules';
	import type {
		AutoGenerateScheduleResponse,
		GeneratedScheduleEmployee,
		GeneratedScheduleShiftTemplate,
		GeneratedScheduleSlot,
		GeneratedScheduleStatus
	} from '$lib/types/api/schedules';

	interface Props {
		open?: boolean;
		locationId: string;
		locationName: string;
		week: number;
		year: number;
		weekStartDate: string;
		onSaved?: () => void;
	}

	type EmployeeOption = {
		id: string;
		name: string;
	};

	type DragPayload = {
		employeeId: string;
		fromSlotKey: string | null;
	};

	let {
		open = $bindable(false),
		locationId,
		locationName,
		week,
		year,
		weekStartDate,
		onSaved
	}: Props = $props();

	let selectedEmployeeIds = $state<string[]>([]);
	let generating = $state(false);
	let saving = $state(false);
	let loadError = $state<string | null>(null);
	let draftError = $state<string | null>(null);
	let step = $state<'config' | 'review'>('config');
	let generatedPlan = $state<AutoGenerateScheduleResponse | null>(null);
	let draftSlots = $state<GeneratedScheduleSlot[]>([]);
	let dragPayload = $state<DragPayload | null>(null);
	let dragError = $state<string | null>(null);

	const maxEmployeesPerCell = 2;

	const statusUi: Record<
		GeneratedScheduleStatus,
		{ label: string; className: string; icon: typeof CheckCircle2 }
	> = {
		optimal: {
			label: 'Optimal',
			className: 'border-emerald-300/80 bg-emerald-50 text-emerald-700',
			icon: CheckCircle2
		},
		feasible: {
			label: 'Feasible',
			className: 'border-amber-300/80 bg-amber-50 text-amber-700',
			icon: AlertTriangle
		},
		infeasible: {
			label: 'Infeasible',
			className: 'border-rose-300/80 bg-rose-50 text-rose-700',
			icon: XCircle
		}
	};

	$effect(() => {
		if (!open) {
			step = 'config';
			generatedPlan = null;
			draftSlots = [];
			loadError = null;
			draftError = null;
			dragError = null;
			dragPayload = null;
		}
	});

	let employeeById = $derived.by(() => {
		const map = new Map<string, GeneratedScheduleEmployee>();
		if (!generatedPlan) return map;

		for (const employee of generatedPlan.employees) {
			map.set(employee.id, employee);
		}

		return map;
	});

	let sortedTemplates = $derived.by(() => {
		if (!generatedPlan) return [] as GeneratedScheduleShiftTemplate[];

		return [...generatedPlan.shift_templates].sort((left, right) => {
			if (left.start_minute !== right.start_minute) {
				return left.start_minute - right.start_minute;
			}
			return left.name.localeCompare(right.name);
		});
	});

	let shiftById = $derived.by(() => {
		const map = new Map<string, GeneratedScheduleShiftTemplate>();
		for (const shift of sortedTemplates) {
			map.set(shift.shift_id, shift);
		}
		return map;
	});

	let weekDays = $derived.by(() => {
		if (!generatedPlan) return [] as { date: string; dayName: string; dayNumber: number }[];

		const start = parseDateOnly(generatedPlan.week_start_date);
		return Array.from({ length: 7 }, (_, index) => {
			const date = addDays(start, index);
			return {
				date: formatDateKey(date),
				dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
				dayNumber: date.getDate()
			};
		});
	});

	let slotByKey = $derived.by(() => {
		const map = new Map<string, GeneratedScheduleSlot>();
		for (const slot of draftSlots) {
			map.set(buildSlotKey(slot.date, slot.shift_id), slot);
		}
		return map;
	});

	let unassignedEmployees = $derived.by(() => {
		if (!generatedPlan) return [] as GeneratedScheduleEmployee[];

		const assignedEmployeeIds = new Set<string>();
		for (const slot of draftSlots) {
			for (const employeeId of slot.employee_ids) {
				assignedEmployeeIds.add(employeeId);
			}
		}

		return generatedPlan.employees.filter(
			(employee: GeneratedScheduleEmployee) => !assignedEmployeeIds.has(employee.id)
		);
	});

	let liveSummary = $derived.by(() => {
		if (!generatedPlan) return [];

		const summaryByEmployeeId = new Map<
			string,
			{
				employee: GeneratedScheduleEmployee;
				assignedMinutes: number;
				overtimeMinutes: number;
				shiftCounts: Record<string, number>;
			}
		>();

		for (const employee of generatedPlan.employees) {
			summaryByEmployeeId.set(employee.id, {
				employee,
				assignedMinutes: 0,
				overtimeMinutes: 0,
				shiftCounts: {}
			});
		}

		for (const slot of draftSlots) {
			const shift = shiftById.get(slot.shift_id);
			if (!shift) continue;

			for (const employeeId of slot.employee_ids) {
				const summary = summaryByEmployeeId.get(employeeId);
				if (!summary) continue;

				summary.assignedMinutes += shift.duration_minutes;
				summary.shiftCounts[slot.shift_id] = (summary.shiftCounts[slot.shift_id] ?? 0) + 1;
			}
		}

		for (const summary of summaryByEmployeeId.values()) {
			summary.overtimeMinutes = Math.max(
				0,
				summary.assignedMinutes - summary.employee.target_minutes
			);
		}

		return Array.from(summaryByEmployeeId.values()).sort((left, right) => {
			const overtimeDiff = right.overtimeMinutes - left.overtimeMinutes;
			if (overtimeDiff !== 0) return overtimeDiff;
			return `${left.employee.first_name} ${left.employee.last_name}`.localeCompare(
				`${right.employee.first_name} ${right.employee.last_name}`
			);
		});
	});

	function parseDateOnly(dateText: string): Date {
		const [yearNumber, month, day] = dateText.split('-').map(Number);
		return new Date(yearNumber, month - 1, day);
	}

	function addDays(base: Date, days: number): Date {
		const next = new Date(base);
		next.setDate(next.getDate() + days);
		return next;
	}

	function formatDateKey(date: Date): string {
		const yearNumber = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${yearNumber}-${month}-${day}`;
	}

	function buildSlotKey(date: string, shiftId: string): string {
		return `${date}:${shiftId}`;
	}

	function formatMinutes(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = Math.abs(minutes % 60);
		return `${hours}h ${String(remainingMinutes).padStart(2, '0')}m`;
	}

	function toEmployeeOption(employee: EmployeeListItem): EmployeeOption {
		const firstName = employee.first_name?.trim() ?? '';
		const lastName = employee.last_name?.trim() ?? '';
		const name = `${firstName} ${lastName}`.trim() || 'Unknown employee';

		return {
			id: employee.id,
			name
		};
	}

	async function loadEmployeeOptions(query: string): Promise<EmployeeOption[]> {
		if (!locationId) return [];

		const response = await listEmployees({
			page: 1,
			pageSize: 50,
			search: query.trim() || undefined,
			isArchived: false,
			outOfService: false
		});

		return response.data.results.map(toEmployeeOption);
	}

	function isWeekConflictError(message: string): boolean {
		return (
			/week.*(already|not\s*empty)/i.test(message) || /already has any schedules/i.test(message)
		);
	}

	function normalizeSlots(slots: GeneratedScheduleSlot[]): GeneratedScheduleSlot[] {
		const map = new Map<string, GeneratedScheduleSlot>();

		for (const slot of slots) {
			const uniqueIds = Array.from(new Set(slot.employee_ids)).slice(0, maxEmployeesPerCell);
			map.set(buildSlotKey(slot.date, slot.shift_id), {
				date: slot.date,
				shift_id: slot.shift_id,
				employee_ids: uniqueIds
			});
		}

		return Array.from(map.values());
	}

	function getSlot(date: string, shiftId: string): GeneratedScheduleSlot {
		const existing = slotByKey.get(buildSlotKey(date, shiftId));
		if (existing) {
			return existing;
		}

		return {
			date,
			shift_id: shiftId,
			employee_ids: []
		};
	}

	function replaceSlot(nextSlot: GeneratedScheduleSlot) {
		const nextKey = buildSlotKey(nextSlot.date, nextSlot.shift_id);
		const filtered = draftSlots.filter(
			(slot) => buildSlotKey(slot.date, slot.shift_id) !== nextKey
		);

		if (nextSlot.employee_ids.length === 0) {
			draftSlots = filtered;
			return;
		}

		draftSlots = [...filtered, nextSlot];
	}

	function removeEmployeeFromSlot(slotKey: string, employeeId: string) {
		const slot = slotByKey.get(slotKey);
		if (!slot) return;

		replaceSlot({
			...slot,
			employee_ids: slot.employee_ids.filter((id: string) => id !== employeeId)
		});
	}

	function moveEmployee(employeeId: string, fromSlotKey: string | null, toSlotKey: string) {
		if (!generatedPlan) return;
		if (fromSlotKey === toSlotKey) return;

		const [toDate, toShiftId] = toSlotKey.split(':');
		const destinationSlot = getSlot(toDate, toShiftId);

		if (destinationSlot.employee_ids.includes(employeeId)) {
			if (fromSlotKey) {
				removeEmployeeFromSlot(fromSlotKey, employeeId);
			}
			dragError = null;
			return;
		}

		if (destinationSlot.employee_ids.length >= maxEmployeesPerCell) {
			dragError = 'This shift already has 2 employees. Move someone out first.';
			return;
		}

		if (fromSlotKey) {
			removeEmployeeFromSlot(fromSlotKey, employeeId);
		}

		replaceSlot({
			...destinationSlot,
			employee_ids: [...destinationSlot.employee_ids, employeeId]
		});

		dragError = null;
	}

	function buildSaveSlots(): GeneratedScheduleSlot[] {
		if (!generatedPlan) return [];

		const slots: GeneratedScheduleSlot[] = [];
		for (const day of weekDays) {
			for (const shift of sortedTemplates) {
				const slot = getSlot(day.date, shift.shift_id);
				slots.push({
					date: slot.date,
					shift_id: slot.shift_id,
					employee_ids: [...slot.employee_ids]
				});
			}
		}

		return slots;
	}

	function startDrag(event: DragEvent, employeeId: string, fromSlotKey: string | null) {
		dragPayload = { employeeId, fromSlotKey };
		event.dataTransfer?.setData('application/json', JSON.stringify({ employeeId, fromSlotKey }));
		event.dataTransfer?.setData('text/plain', employeeId);
		event.dataTransfer!.effectAllowed = 'move';
	}

	function parseDragPayload(event: DragEvent): DragPayload | null {
		const payloadText = event.dataTransfer?.getData('application/json');
		if (payloadText) {
			try {
				const parsed = JSON.parse(payloadText) as DragPayload;
				if (parsed?.employeeId) {
					return parsed;
				}
			} catch {
				// Ignore malformed payload and fallback to in-memory dragPayload.
			}
		}

		return dragPayload;
	}

	function onDropToSlot(event: DragEvent, slotKey: string) {
		event.preventDefault();
		const payload = parseDragPayload(event);
		if (!payload) return;

		moveEmployee(payload.employeeId, payload.fromSlotKey, slotKey);
		dragPayload = null;
	}

	function onDropToBench(event: DragEvent) {
		event.preventDefault();
		const payload = parseDragPayload(event);
		if (!payload?.fromSlotKey) return;

		removeEmployeeFromSlot(payload.fromSlotKey, payload.employeeId);
		dragPayload = null;
		dragError = null;
	}

	async function handleGenerate() {
		if (!locationId) {
			loadError = 'Please select a location first.';
			return;
		}

		if (selectedEmployeeIds.length === 0) {
			loadError = 'Select at least one employee to generate a schedule.';
			return;
		}

		loadError = null;
		draftError = null;
		dragError = null;
		generating = true;

		try {
			const response = await autoGenerateSchedules({
				location_id: locationId,
				week,
				year,
				employee_ids: selectedEmployeeIds
			});

			const plan = response.data;
			generatedPlan = {
				...plan,
				warnings: Array.isArray(plan.warnings) ? plan.warnings : []
			};
			draftSlots = normalizeSlots(plan.slots);
			step = 'review';
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: 'Unable to generate schedule right now. Please try again.';

			loadError = isWeekConflictError(message)
				? 'This week already has schedules for this location. Clear the week before generating a new plan.'
				: message;
		} finally {
			generating = false;
		}
	}

	async function handleSave() {
		if (!generatedPlan) return;

		saving = true;
		draftError = null;

		try {
			await saveGeneratedSchedule({
				plan_id: generatedPlan.plan_id,
				location_id: generatedPlan.location_id,
				week: generatedPlan.week,
				year: generatedPlan.year,
				slots: buildSaveSlots()
			});

			onSaved?.();
			open = false;
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: 'Unable to save generated schedule right now. Please try again.';

			draftError = isWeekConflictError(message)
				? 'This week is no longer empty for this location. Refresh schedules and try again.'
				: message;
		} finally {
			saving = false;
		}
	}

	function closeModal() {
		open = false;
	}

	function backToConfig() {
		step = 'config';
		draftError = null;
		dragError = null;
	}

	function employeeLabel(employee: GeneratedScheduleEmployee): string {
		return `${employee.first_name} ${employee.last_name}`.trim() || 'Unknown employee';
	}

	function toClock(minute: number): string {
		const hours = Math.floor(minute / 60)
			.toString()
			.padStart(2, '0');
		const minutes = (minute % 60).toString().padStart(2, '0');
		return `${hours}:${minutes}`;
	}
</script>

<Modal
	bind:open
	title="Auto-generate schedule"
	description="Create a draft for the selected week, then refine assignments before saving."
	size={step === 'review' ? '4xl' : 'xl'}
>
	{#if step === 'config'}
		<div class="space-y-5">
			<div class="bg-surface-subtle/40 rounded-2xl border border-border/70 p-4">
				<p class="text-sm font-semibold text-text">{locationName || 'Unknown location'}</p>
				<p class="mt-1 text-xs text-text-muted">
					Week {String(week).padStart(2, '0')} - {year} - starts {weekStartDate}
				</p>
			</div>

			<MultiSearchSelect
				label="Employees"
				bind:value={selectedEmployeeIds}
				loadOptions={loadEmployeeOptions}
				labelFn={(employee: EmployeeOption) => employee.name}
				valueFn={(employee: EmployeeOption) => employee.id}
				placeholder="Select employees to include"
				searchPlaceholder="Search employees..."
			/>

			{#if loadError}
				<InlineErrorBanner title="Could not generate plan" message={loadError} />
			{/if}

			<div class="rounded-xl border border-border/70 bg-surface p-3 text-xs text-text-muted">
				The solver can place up to {maxEmployeesPerCell} employees per shift cell. You can adjust the
				generated plan before saving.
			</div>
		</div>
	{:else if generatedPlan}
		{@const status = statusUi[generatedPlan.status]}
		<div class="space-y-4">
			<div
				class="bg-surface-subtle/40 flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 p-4"
			>
				<div
					class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold {status.className}"
				>
					<status.icon class="h-3.5 w-3.5" />
					{status.label}
				</div>
				<span class="text-xs text-text-muted">Plan ID: {generatedPlan.plan_id}</span>
				<span class="text-xs text-text-muted">Timezone: {generatedPlan.timezone}</span>
				<span class="text-xs text-text-muted">
					Max staff/shift: {generatedPlan.constraints.max_staff_per_shift}
				</span>
			</div>

			{#if (generatedPlan.warnings ?? []).length > 0}
				<div
					class="rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-800"
				>
					<p class="font-semibold">Warnings</p>
					<ul class="mt-1 space-y-1 text-xs">
						{#each generatedPlan.warnings ?? [] as warning, index (`${warning.code}-${index}`)}
							<li>{warning.code}: {warning.message}</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if draftError}
				<InlineErrorBanner title="Could not save generated schedule" message={draftError} />
			{/if}

			{#if dragError}
				<div
					class="rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-800"
				>
					{dragError}
				</div>
			{/if}

			<div class="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
				<section
					class="space-y-3 rounded-2xl border border-border/70 bg-surface p-3"
					aria-label="Unassigned employees"
					ondragover={(event) => event.preventDefault()}
					ondrop={onDropToBench}
				>
					<div>
						<h3 class="text-sm font-semibold text-text">Bench / Unassigned</h3>
						<p class="text-xs text-text-muted">Drag an employee here to remove from a shift.</p>
					</div>

					<div
						class="bg-surface-subtle/30 flex flex-wrap gap-2 rounded-xl border border-dashed border-border/80 p-2.5"
					>
						{#if unassignedEmployees.length > 0}
							{#each unassignedEmployees as employee (employee.id)}
								<div
									role="button"
									tabindex="-1"
									draggable="true"
									ondragstart={(event) => startDrag(event, employee.id, null)}
									class="inline-flex cursor-grab items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-xs font-medium text-text"
								>
									<GripVertical class="h-3 w-3 text-text-muted" />
									{employeeLabel(employee)}
								</div>
							{/each}
						{:else}
							<span class="text-xs text-text-muted">All selected employees are assigned.</span>
						{/if}
					</div>

					<div class="space-y-2 pt-1">
						<h4 class="text-xs font-semibold tracking-wide text-text-muted uppercase">
							Live summary
						</h4>
						<div class="max-h-[420px] space-y-2 overflow-auto pr-1">
							{#each liveSummary as summary (summary.employee.id)}
								<div class="bg-surface-subtle/30 rounded-xl border border-border/70 p-2.5">
									<div class="flex items-center justify-between gap-2">
										<p class="truncate text-xs font-semibold text-text">
											{employeeLabel(summary.employee)}
										</p>
										<span class="text-[11px] text-text-muted">
											{formatMinutes(summary.assignedMinutes)} / {formatMinutes(
												summary.employee.target_minutes
											)}
										</span>
									</div>
									{#if summary.overtimeMinutes > 0}
										<p class="mt-1 text-[11px] font-medium text-rose-700">
											Overtime: {formatMinutes(summary.overtimeMinutes)}
										</p>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</section>

				<section class="min-w-0 overflow-auto rounded-2xl border border-border/70 bg-surface">
					<div class="grid min-w-[980px] grid-cols-[220px_repeat(7,minmax(108px,1fr))]">
						<div
							class="bg-surface-subtle/80 sticky left-0 z-10 flex items-end border-r border-b border-border/60 p-3 text-[11px] font-semibold tracking-wide text-text-muted uppercase"
						>
							Shift
						</div>
						{#each weekDays as day (day.date)}
							<div class="bg-surface-subtle/80 border-r border-b border-border/60 p-2 text-center">
								<p class="text-[10px] font-semibold tracking-wide text-text-muted uppercase">
									{day.dayName}
								</p>
								<p class="text-lg font-light text-text">{day.dayNumber}</p>
							</div>
						{/each}

						{#each sortedTemplates as template (template.shift_id)}
							<div class="sticky left-0 z-10 border-r border-b border-border/60 bg-surface p-3">
								<p class="text-sm font-semibold text-text">{template.name}</p>
								<p class="mt-1 text-xs text-text-muted">
									{toClock(template.start_minute)} - {toClock(template.end_minute)}
									{template.overnight ? ' (+1d)' : ''}
								</p>
							</div>

							{#each weekDays as day (day.date)}
								{@const slotKey = buildSlotKey(day.date, template.shift_id)}
								{@const slot = getSlot(day.date, template.shift_id)}
								<div
									role="region"
									aria-label={`Dropzone for ${template.name} on ${day.dayName} ${day.dayNumber}`}
									class="min-h-[110px] border-r border-b border-border/60 bg-surface p-2"
									ondragover={(event) => event.preventDefault()}
									ondrop={(event) => onDropToSlot(event, slotKey)}
								>
									<div
										class="bg-surface-subtle/20 flex min-h-[92px] flex-col gap-1.5 rounded-lg border border-dashed border-border/70 p-1.5"
									>
										{#if slot.employee_ids.length > 0}
											{#each slot.employee_ids as employeeId (employeeId)}
												{@const employee = employeeById.get(employeeId)}
												<div
													role="button"
													tabindex="-1"
													draggable="true"
													ondragstart={(event) => startDrag(event, employeeId, slotKey)}
													class="group/item flex cursor-grab items-center justify-between gap-1 rounded-md border border-border bg-surface px-1.5 py-1 text-xs font-medium text-text"
												>
													<div class="flex min-w-0 items-center gap-1">
														<GripVertical class="h-3 w-3 shrink-0 text-text-muted" />
														<span class="truncate"
															>{employee ? employeeLabel(employee) : 'Unknown employee'}</span
														>
													</div>
													<button
														type="button"
														class="rounded p-0.5 text-text-muted opacity-0 transition-opacity group-hover/item:opacity-100 hover:bg-border/60 hover:text-text"
														onclick={(event) => {
															event.stopPropagation();
															removeEmployeeFromSlot(slotKey, employeeId);
														}}
														aria-label="Remove employee"
													>
														X
													</button>
												</div>
											{/each}
										{:else}
											<div
												class="flex min-h-[74px] items-center justify-center text-[11px] text-text-muted"
											>
												Drop employee here
											</div>
										{/if}
									</div>
								</div>
							{/each}
						{/each}
					</div>
				</section>
			</div>
		</div>
	{/if}

	{#snippet footer()}
		{#if step === 'config'}
			<div class="flex flex-wrap justify-end gap-2">
				<Button variant="ghost" onclick={closeModal} disabled={generating}>Cancel</Button>
				<Button
					onclick={handleGenerate}
					isLoading={generating}
					disabled={selectedEmployeeIds.length === 0}
				>
					<Sparkles class="h-4 w-4" />
					Generate plan
				</Button>
			</div>
		{:else if step === 'review'}
			<div class="flex flex-wrap justify-end gap-2">
				<Button variant="ghost" onclick={backToConfig} disabled={saving}>Back</Button>
				<Button variant="ghost" onclick={closeModal} disabled={saving}>Discard</Button>
				<Button onclick={handleSave} isLoading={saving}>Save generated schedule</Button>
			</div>
		{/if}
	{/snippet}
</Modal>
